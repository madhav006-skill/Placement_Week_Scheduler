const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    name: { type: String, required: true },
    day: { type: Number, required: true }, // 1 to 4
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true }, // "17:00"
    cgpaCutoff: { type: Number, required: true },
    durationMins: { type: Number, required: true },
    priorityTier: { type: Number, required: true } // 1 (highest) to 3
});

module.exports = mongoose.model('Company', companySchema);
