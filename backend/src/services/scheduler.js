const Company = require('../models/Company');
const Panel = require('../models/Panel');
const Student = require('../models/Student');
const Room = require('../models/Room');
const ScheduleVersion = require('../models/ScheduleVersion');
const Interview = require('../models/Interview');

// Helper to convert "HH:MM" to minutes from midnight
function timeToMins(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

function minsToTime(mins) {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
}

async function generateBaselineSchedule() {
    console.log("Generating Baseline Schedule...");
    
    // Create new version
    const version = new ScheduleVersion({ description: "Initial Baseline Schedule" });
    await version.save();

    const companies = await Company.find().sort({ priorityTier: 1, day: 1 }).lean();
    const rooms = await Room.find({ isAvailable: true }).lean();
    const students = await Student.find().populate('shortlistedCompanyIds').lean();
    
    const companyPanels = {};
    for (let c of companies) {
        companyPanels[c._id] = await Panel.find({ companyId: c._id }).lean();
    }

    // State trackers to check availability
    // Format: "day_mins": boolean
    // For faster lookup, we'll store booked intervals per resource
    // resource_bookings[resourceId] = [ {day, start, end} ]
    const studentBookings = {};
    const roomBookings = {};
    const panelBookings = {};

    function isAvailable(bookings, id, day, start, end) {
        if (!bookings[id]) return true;
        for (let b of bookings[id]) {
            if (b.day === day && Math.max(start, b.start) < Math.min(end, b.end)) {
                return false; // Overlap
            }
        }
        return true;
    }

    function book(bookings, id, day, start, end) {
        if (!bookings[id]) bookings[id] = [];
        bookings[id].push({ day, start, end });
    }

    const interviewsToInsert = [];

    for (let company of companies) {
        const panels = companyPanels[company._id];
        if (!panels || panels.length === 0) continue;

        // Find students shortlisted for this company, sorted by CGPA desc
        const shortlistedStudents = students
            .filter(s => s.shortlistedCompanyIds.some(c => (c._id || c).toString() === company._id.toString()))
            .sort((a, b) => b.cgpa - a.cgpa);

        const compStartMins = timeToMins(company.startTime);
        const compEndMins = timeToMins(company.endTime);
        const duration = company.durationMins;

        for (let student of shortlistedStudents) {
            let scheduled = false;

            // Generate possible slots
            let possibleSlots = [];
            
            // Generate slots in steps of 15 mins
            for (let t = compStartMins; t + duration <= compEndMins; t += 15) {
                for (let panel of panels) {
                    for (let room of rooms) {
                        if (
                            isAvailable(studentBookings, student._id, company.day, t, t + duration) &&
                            isAvailable(panelBookings, panel._id, company.day, t, t + duration) &&
                            isAvailable(roomBookings, room._id, company.day, t, t + duration)
                        ) {
                            // Calculate Score based on requested policy
                            // Priority Score (already handled roughly by sorting, but let's add it)
                            let score = (4 - company.priorityTier) * 100;
                            
                            // Waiting time impact (prefer closer to other interviews on same day)
                            let waitPenalty = 0;
                            if (studentBookings[student._id]) {
                                let sameDay = studentBookings[student._id].filter(b => b.day === company.day);
                                if (sameDay.length > 0) {
                                    // Find min distance
                                    let minDist = Math.min(...sameDay.map(b => Math.min(Math.abs(t - b.end), Math.abs(b.start - (t+duration)))));
                                    waitPenalty = minDist * 0.1; // small penalty for large gaps
                                }
                            }
                            
                            score -= waitPenalty;

                            possibleSlots.push({
                                panel, room, start: t, end: t + duration, score
                            });
                        }
                    }
                }
            }

            if (possibleSlots.length > 0) {
                // Pick best slot
                possibleSlots.sort((a, b) => b.score - a.score); // Highest score first
                const best = possibleSlots[0];

                book(studentBookings, student._id, company.day, best.start, best.end);
                book(panelBookings, best.panel._id, company.day, best.start, best.end);
                book(roomBookings, best.room._id, company.day, best.start, best.end);

                interviewsToInsert.push({
                    scheduleVersionId: version._id,
                    studentId: student._id,
                    companyId: company._id,
                    panelId: best.panel._id,
                    roomId: best.room._id,
                    day: company.day,
                    startTime: minsToTime(best.start),
                    endTime: minsToTime(best.end),
                    status: 'SCHEDULED'
                });
                scheduled = true;
            }

            if (!scheduled) {
                interviewsToInsert.push({
                    scheduleVersionId: version._id,
                    studentId: student._id,
                    companyId: company._id,
                    status: 'UNSCHEDULED',
                    reason: 'No available slots (Room/Panel/Student conflict)'
                });
            }
        }
    }

    if (interviewsToInsert.length > 0) {
        await Interview.insertMany(interviewsToInsert);
    }
    
    console.log(`Scheduled ${interviewsToInsert.filter(i=>i.status==='SCHEDULED').length} interviews. Unscheduled: ${interviewsToInsert.filter(i=>i.status==='UNSCHEDULED').length}`);
    return version;
}

module.exports = {
    generateBaselineSchedule
};
