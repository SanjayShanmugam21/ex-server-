const AuditLog = require('../models/AuditLog');

const logAction = async (action, entity, entityId, performedBy, role, metadata = {}) => {
    try {
        const log = new AuditLog({
            action,
            entity,
            entityId,
            performedBy,
            role,
            timestamp: new Date(),
            metadata,
        });

        await log.save();
    } catch (error) {
        console.error('Audit Log Error:', error);
    }
};

module.exports = logAction;
