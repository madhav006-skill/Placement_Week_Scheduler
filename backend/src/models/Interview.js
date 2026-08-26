const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
    scheduleVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScheduleVersion', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    panelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Panel', default: null },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
    day: { type: Number },
    startTime: { type: String }, // "10:00"
    endTime: { type: String },
    status: { type: String, enum: ['SCHEDULED', 'UNSCHEDULED', 'COMPLETED'], required: true },
    reason: { type: String, default: null } // Reason if unscheduled
});

module.exports = mongoose.model('Interview', interviewSchema);
