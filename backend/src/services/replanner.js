const Company = require('../models/Company');
const Panel = require('../models/Panel');
const Student = require('../models/Student');
const Room = require('../models/Room');
const ScheduleVersion = require('../models/ScheduleVersion');
const Interview = require('../models/Interview');
const { calculateMetrics } = require('./metrics');

function timeToMins(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

function minsToTime(mins) {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
}

async function runReplanner(parentVersionId, disruption) {
    console.log(`Running replan for disruption: ${disruption.type}`);
    
    // 1. Create new version
    const newVersion = new ScheduleVersion({ 
        description: `Replan: ${disruption.type}`,
        parentVersionId,
        disruptionDetails: disruption
    });
    await newVersion.save();

    // 2. Load parent interviews
    const parentInterviews = await Interview.find({ scheduleVersionId: parentVersionId }).lean();
    
    // 3. Identify Affected (Invalidate)
    const newInterviews = [];
    const affectedToReschedule = []; // Array of parent interview objects
    const directlyCancelled = [];

    let affectedCount = 0;

    for (let inv of parentInterviews) {
        if (inv.status !== 'SCHEDULED') {
            // Already unscheduled, copy it over but maybe we can retry it? 
            // For minimum churn, we usually don't retry old failures unless requested.
            // We will copy it over as is.
            const copy = { ...inv };
            delete copy._id;
            copy.scheduleVersionId = newVersion._id;
            newInterviews.push(copy);
            continue;
        }

        let isAffected = false;
        let reason = null;

        if (disruption.type === 'COMPANY_DELAY' && inv.companyId.toString() === disruption.targetId.toString()) {
            const company = await Company.findById(disruption.targetId);
            const originalStartMins = timeToMins(company.startTime);
            const newStartMins = originalStartMins + (disruption.delayHours * 60);
            
            const invStartMins = timeToMins(inv.startTime);
            if (invStartMins < newStartMins) {
                isAffected = true;
                reason = `Company delayed. New start time is ${minsToTime(newStartMins)}`;
            }
        } 
        else if (disruption.type === 'PANEL_DROP' && inv.panelId && inv.panelId.toString() === disruption.targetId.toString()) {
            isAffected = true;
            reason = `Panel dropped`;
        }
        else if (disruption.type === 'STUDENT_WITHDRAW' && inv.studentId.toString() === disruption.targetId.toString()) {
            // Cancel outright, do not reschedule
            const copy = { ...inv };
            delete copy._id;
            copy.scheduleVersionId = newVersion._id;
            copy.status = 'UNSCHEDULED';
            copy.reason = 'Student withdrew';
            newInterviews.push(copy);
            directlyCancelled.push(copy);
            continue;
        }
        else if (disruption.type === 'ROOM_UNAVAILABLE' && inv.roomId && inv.roomId.toString() === disruption.targetId.toString()) {
            isAffected = true;
            reason = `Room became unavailable`;
        }

        if (isAffected) {
            affectedCount++;
            affectedToReschedule.push(inv);
        } else {
            // Unaffected - Freeze it
            const copy = { ...inv };
            delete copy._id;
            copy.scheduleVersionId = newVersion._id;
            newInterviews.push(copy);
        }
    }

    // 4. Strong Local Repair
    // Build bookings for frozen interviews to know what gaps are left
    const studentBookings = {};
    const roomBookings = {};
    const panelBookings = {};

    function book(bookings, id, day, start, end) {
        if (!bookings[id]) bookings[id] = [];
        bookings[id].push({ day, start, end });
    }

    function isAvailable(bookings, id, day, start, end) {
        if (!bookings[id]) return true;
        for (let b of bookings[id]) {
            if (b.day === day && Math.max(start, b.start) < Math.min(end, b.end)) {
                return false;
            }
        }
        return true;
    }

    for (let inv of newInterviews) {
        if (inv.status === 'SCHEDULED') {
            const start = timeToMins(inv.startTime);
            const end = timeToMins(inv.endTime);
            book(studentBookings, inv.studentId.toString(), inv.day, start, end);
            book(panelBookings, inv.panelId.toString(), inv.day, start, end);
            book(roomBookings, inv.roomId.toString(), inv.day, start, end);
        }
    }

    // Load necessary models for rescheduling
    const rooms = await Room.find({ isAvailable: true }).lean();
    if (disruption.type === 'ROOM_UNAVAILABLE') {
        // Filter out the unavailable room for new schedules
        const idx = rooms.findIndex(r => r._id.toString() === disruption.targetId.toString());
        if (idx > -1) rooms.splice(idx, 1);
    }

    let movedInterviews = 0;
    let newCancellations = 0;

    // Sort affected by priority/original time to schedule them efficiently
    affectedToReschedule.sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));

    for (let oldInv of affectedToReschedule) {
        const company = await Company.findById(oldInv.companyId).lean();
        
        let newStartMinsLimit = timeToMins(company.startTime);
        if (disruption.type === 'COMPANY_DELAY' && company._id.toString() === disruption.targetId.toString()) {
            newStartMinsLimit += (disruption.delayHours * 60);
        }

        const compEndMins = timeToMins(company.endTime);
        const duration = company.durationMins;
        
        let panels = await Panel.find({ companyId: company._id }).lean();
        if (disruption.type === 'PANEL_DROP') {
            panels = panels.filter(p => p._id.toString() !== disruption.targetId.toString());
        }

        let scheduled = false;
        let possibleSlots = [];

        for (let t = newStartMinsLimit; t + duration <= compEndMins; t += 15) {
            for (let panel of panels) {
                for (let room of rooms) {
                    if (
                        isAvailable(studentBookings, oldInv.studentId.toString(), company.day, t, t + duration) &&
                        isAvailable(panelBookings, panel._id.toString(), company.day, t, t + duration) &&
                        isAvailable(roomBookings, room._id.toString(), company.day, t, t + duration)
                    ) {
                        // Score based on distance from original time (minimise time shift)
                        const origStart = timeToMins(oldInv.startTime);
                        const timeShiftPenalty = Math.abs(t - origStart);
                        const score = 1000 - timeShiftPenalty; // higher is better

                        possibleSlots.push({ panel, room, start: t, end: t + duration, score });
                    }
                }
            }
        }

        if (possibleSlots.length > 0) {
            possibleSlots.sort((a, b) => b.score - a.score);
            const best = possibleSlots[0];

            book(studentBookings, oldInv.studentId.toString(), company.day, best.start, best.end);
            book(panelBookings, best.panel._id.toString(), company.day, best.start, best.end);
            book(roomBookings, best.room._id.toString(), company.day, best.start, best.end);

            newInterviews.push({
                scheduleVersionId: newVersion._id,
                studentId: oldInv.studentId,
                companyId: oldInv.companyId,
                panelId: best.panel._id,
                roomId: best.room._id,
                day: company.day,
                startTime: minsToTime(best.start),
                endTime: minsToTime(best.end),
                status: 'SCHEDULED'
            });
            scheduled = true;
            movedInterviews++;
        }

        if (!scheduled) {
            newInterviews.push({
                scheduleVersionId: newVersion._id,
                studentId: oldInv.studentId,
                companyId: oldInv.companyId,
                status: 'UNSCHEDULED',
                reason: `Replan failed: No slots available after disruption`
            });
            newCancellations++;
        }
    }

    await Interview.insertMany(newInterviews);

    // 5. Configurable Replan Cost
    // Cost = (moved_interviews * W1) + (affected_students * W2) + (cancellations * W3)
    const W1 = 1; // Penalty for moving
    const W2 = 2; // Penalty for touching a student's schedule
    const W3 = 10; // Heavy penalty for cancellation
    
    // In this greedy local repair, the 'cost' is technically the outcome, not the objective function of a solver, 
    // but we report it to show replan quality.
    const replanCost = (movedInterviews * W1) + (affectedCount * W2) + (newCancellations * W3);
    
    newVersion.disruptionDetails.replanCost = replanCost;
    newVersion.disruptionDetails.moved = movedInterviews;
    newVersion.disruptionDetails.cancelled = newCancellations;
    newVersion.markModified('disruptionDetails');
    await newVersion.save();

    await calculateMetrics(newVersion._id);

    console.log(`Replan complete. Moved: ${movedInterviews}, Cancelled: ${newCancellations}, Cost: ${replanCost}`);
    return newVersion;
}

module.exports = {
    runReplanner
};
