const mongoose = require('mongoose');

const scheduleVersionSchema = new mongoose.Schema({
    createdAt: { type: Date, default: Date.now },
    parentVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScheduleVersion', default: null },
    description: { type: String, required: true },
    disruptionDetails: { type: Object, default: null },
    metrics: { type: Object, default: null }
});

module.exports = mongoose.model('ScheduleVersion', scheduleVersionSchema);
