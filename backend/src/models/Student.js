const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    branch: { type: String, required: true },
    cgpa: { type: Number, required: true },
    shortlistedCompanyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Company' }],
    status: { type: String, enum: ['ACTIVE', 'WITHDRAWN', 'PLACED'], default: 'ACTIVE' }
});

module.exports = mongoose.model('Student', studentSchema);
