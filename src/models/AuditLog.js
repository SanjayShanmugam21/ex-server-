const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
    },
    entity: {
        type: String,
        required: true,
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    role: {
        type: String,
        require: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    metadata: {
        type: Object,
        default: {},
    },
}, {
    timestamps: true,
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
