const Interview = require('../models/Interview');
const Room = require('../models/Room');
const ScheduleVersion = require('../models/ScheduleVersion');

async function calculateMetrics(versionId) {
    const interviews = await Interview.find({ scheduleVersionId: versionId }).lean();
    
    const total = interviews.length;
    if (total === 0) return null;

    const scheduled = interviews.filter(i => i.status === 'SCHEDULED');
    const scheduledCount = scheduled.length;
    const schedulingRate = (scheduledCount / total) * 100;

    // Calculate clashes (should be 0 for valid schedule, but good to measure)
    let clashes = 0;
    const studentSchedules = {};
    for (let inv of scheduled) {
        if (!studentSchedules[inv.studentId]) studentSchedules[inv.studentId] = [];
        
        const [sh, sm] = inv.startTime.split(':').map(Number);
        const [eh, em] = inv.endTime.split(':').map(Number);
        const start = sh * 60 + sm;
        const end = eh * 60 + em;

        for (let existing of studentSchedules[inv.studentId]) {
            if (existing.day === inv.day && Math.max(start, existing.start) < Math.min(end, existing.end)) {
                clashes++;
            }
        }
        studentSchedules[inv.studentId].push({ day: inv.day, start, end });
    }

    // Room Utilization (Scheduled mins / Total available mins per day 09:00-17:00 = 8 hrs * 60 = 480 mins)
    const totalRooms = await Room.countDocuments({ isAvailable: true });
    // Assume 4 days
    const totalAvailableMins = totalRooms * 4 * 480; 
    let totalScheduledMins = 0;
    for (let inv of scheduled) {
        const [sh, sm] = inv.startTime.split(':').map(Number);
        const [eh, em] = inv.endTime.split(':').map(Number);
        totalScheduledMins += ((eh * 60 + em) - (sh * 60 + sm));
    }
    const roomUtilization = (totalScheduledMins / totalAvailableMins) * 100;

    // Replan Churn (Compare with parent if exists)
    let replanChurn = 0;
    const version = await ScheduleVersion.findById(versionId).lean();
    if (version.parentVersionId) {
        const parentInterviews = await Interview.find({ scheduleVersionId: version.parentVersionId, status: 'SCHEDULED' }).lean();
        // Count how many scheduled interviews changed time, room, or panel, or were cancelled
        const parentMap = {};
        for (let pi of parentInterviews) {
            parentMap[`${pi.studentId}_${pi.companyId}`] = pi;
        }

        let movedOrCancelled = 0;
        for (let inv of interviews) {
            const key = `${inv.studentId}_${inv.companyId}`;
            const p = parentMap[key];
            if (p) {
                if (inv.status === 'UNSCHEDULED') {
                    movedOrCancelled++;
                } else if (inv.startTime !== p.startTime || inv.day !== p.day || inv.roomId.toString() !== p.roomId.toString()) {
                    movedOrCancelled++;
                }
            }
        }
        replanChurn = parentInterviews.length > 0 ? (movedOrCancelled / parentInterviews.length) * 100 : 0;
    }

    const metrics = {
        totalInterviews: total,
        scheduled: scheduledCount,
        unscheduled: total - scheduledCount,
        schedulingRate: schedulingRate.toFixed(2),
        studentClashes: clashes,
        roomUtilization: roomUtilization.toFixed(2),
        replanChurn: replanChurn.toFixed(2)
    };

    // Save back to version
    await ScheduleVersion.findByIdAndUpdate(versionId, { metrics });

    return metrics;
}

module.exports = {
    calculateMetrics
};
