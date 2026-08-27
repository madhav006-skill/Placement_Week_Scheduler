const mongoose = require('mongoose');

const panelSchema = new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    isAvailable: { type: Boolean, default: true }
});

module.exports = mongoose.model('Panel', panelSchema);
