const express = require('express');
const router = express.Router();
const generateData = require('../utils/generator');
const { generateBaselineSchedule } = require('../services/scheduler');
const { runReplanner } = require('../services/replanner');
const { calculateMetrics } = require('../services/metrics');

const Company = require('../models/Company');
const Panel = require('../models/Panel');
const Student = require('../models/Student');
const Room = require('../models/Room');
const ScheduleVersion = require('../models/ScheduleVersion');
const Interview = require('../models/Interview');

router.post('/generate-data', async (req, res) => {
    try {
        await generateData();
        res.json({ message: 'Data generated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/schedule/baseline', async (req, res) => {
    try {
        const version = await generateBaselineSchedule();
        const metrics = await calculateMetrics(version._id);
        res.json({ version, metrics });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/schedule/replan/:versionId', async (req, res) => {
    try {
        const disruption = req.body;
        // disruption: { type: 'COMPANY_DELAY', targetId: '...', delayHours: 2 }
        const newVersion = await runReplanner(req.params.versionId, disruption);
        res.json(newVersion);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/schedule/latest', async (req, res) => {
    try {
        const version = await ScheduleVersion.findOne().sort({ createdAt: -1 });
        if (!version) return res.status(404).json({ error: 'No schedule found' });
        
        const interviews = await Interview.find({ scheduleVersionId: version._id })
            .populate('studentId')
            .populate('companyId')
            .populate('panelId')
            .populate('roomId');
        res.json({ version, interviews });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/schedule/:versionId', async (req, res) => {
    try {
        const interviews = await Interview.find({ scheduleVersionId: req.params.versionId })
            .populate('studentId')
            .populate('companyId')
            .populate('panelId')
            .populate('roomId');
        res.json(interviews);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/companies', async (req, res) => {
    try {
        const companies = await Company.find().lean();
        const panels = await Panel.find().lean();
        for (let c of companies) {
            c.panels = panels.filter(p => p.companyId.toString() === c._id.toString());
        }
        res.json(companies);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/students', async (req, res) => {
    try {
        const students = await Student.find().populate('shortlistedCompanyIds');
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/rooms', async (req, res) => {
    try {
        const rooms = await Room.find();
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/metrics/:versionId', async (req, res) => {
    try {
        let version = await ScheduleVersion.findById(req.params.versionId);
        if (!version) return res.status(404).json({ error: 'Version not found' });
        
        if (!version.metrics) {
            version.metrics = await calculateMetrics(req.params.versionId);
        }
        res.json(version.metrics);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/diff/:versionId', async (req, res) => {
    try {
        const version = await ScheduleVersion.findById(req.params.versionId);
        if (!version || !version.parentVersionId) return res.json({ diff: [], summary: {} });

        const newInterviews = await Interview.find({ scheduleVersionId: version._id })
            .populate('studentId').populate('companyId').populate('panelId').populate('roomId').lean();
            
        const oldInterviews = await Interview.find({ scheduleVersionId: version.parentVersionId })
            .populate('studentId').populate('companyId').populate('panelId').populate('roomId').lean();

        const oldMap = {};
        for (let o of oldInterviews) {
            oldMap[`${o.studentId._id}_${o.companyId._id}`] = o;
        }

        const changes = [];
        const stakeholders = new Set();
        
        let moved = 0, cancelled = 0, newlyScheduled = 0;

        for (let n of newInterviews) {
            const key = `${n.studentId._id}_${n.companyId._id}`;
            const o = oldMap[key];

            if (o) {
                if (n.status === 'UNSCHEDULED' && o.status === 'SCHEDULED') {
                    changes.push({ type: 'CANCELLED', old: o, new: n, reason: n.reason });
                    stakeholders.add(n.studentId.name);
                    stakeholders.add(n.companyId.name);
                    cancelled++;
                } else if (n.status === 'SCHEDULED' && o.status === 'UNSCHEDULED') {
                    changes.push({ type: 'NEWLY_SCHEDULED', old: o, new: n });
                    stakeholders.add(n.studentId.name);
                    stakeholders.add(n.companyId.name);
                    newlyScheduled++;
                } else if (n.status === 'SCHEDULED' && o.status === 'SCHEDULED' && 
                          (n.startTime !== o.startTime || n.day !== o.day || (n.roomId && o.roomId && n.roomId._id.toString() !== o.roomId._id.toString()))) {
                    changes.push({ type: 'MOVED', old: o, new: n });
                    stakeholders.add(n.studentId.name);
                    stakeholders.add(n.companyId.name);
                    moved++;
                }
            } else if (n.status === 'SCHEDULED') {
                changes.push({ type: 'NEWLY_SCHEDULED', old: null, new: n });
                stakeholders.add(n.studentId.name);
                stakeholders.add(n.companyId.name);
                newlyScheduled++;
            }
        }

        res.json({
            changes,
            summary: {
                moved, cancelled, newlyScheduled,
                affectedStakeholders: Array.from(stakeholders)
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});




// --- NEW CRUD ROUTES ---

// Create Student
router.post('/students', async (req, res) => {
    try {
        const student = new Student(req.body);
        await student.save();
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Student
router.put('/students/:id', async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('shortlistedCompanyIds');
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Withdraw Student manually (this triggers replan if active interviews exist)
router.put('/students/:id/withdraw', async (req, res) => {
    try {
        const latestVersion = await ScheduleVersion.findOne().sort({ createdAt: -1 });
        if (latestVersion) {
            // Trigger replanner directly which handles DB persistence
            const newVersion = await runReplanner(latestVersion._id, { type: 'STUDENT_WITHDRAW', targetId: req.params.id });
            res.json({ message: 'Student withdrawn and schedule replanned', newVersion });
        } else {
            // If no schedule exists, just update DB
            await Student.findByIdAndUpdate(req.params.id, { status: 'WITHDRAWN' });
            res.json({ message: 'Student withdrawn' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Company
router.post('/companies', async (req, res) => {
    try {
        const company = new Company(req.body);
        await company.save();
        res.json(company);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Company
router.put('/companies/:id', async (req, res) => {
    try {
        const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(company);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Panel Availability
router.put('/panels/:id/availability', async (req, res) => {
    try {
        const { isAvailable } = req.body;
        const panel = await Panel.findById(req.params.id);
        
        if (!isAvailable) {
            const latestVersion = await ScheduleVersion.findOne().sort({ createdAt: -1 });
            if (latestVersion) {
                const newVersion = await runReplanner(latestVersion._id, { type: 'PANEL_DROP', targetId: req.params.id });
                return res.json({ message: 'Panel marked unavailable and schedule replanned', panel, newVersion });
            }
        }
        
        panel.isAvailable = isAvailable;
        await panel.save();
        res.json({ message: 'Panel availability updated', panel });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Room Availability
router.put('/rooms/:id/availability', async (req, res) => {
    try {
        const { isAvailable } = req.body;
        const room = await Room.findById(req.params.id);
        
        if (!isAvailable) {
            const latestVersion = await ScheduleVersion.findOne().sort({ createdAt: -1 });
            if (latestVersion) {
                const newVersion = await runReplanner(latestVersion._id, { type: 'ROOM_UNAVAILABLE', targetId: req.params.id });
                return res.json({ message: 'Room marked unavailable and schedule replanned', room, newVersion });
            }
        }
        
        room.isAvailable = isAvailable;
        await room.save();
        res.json({ message: 'Room availability updated', room });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
