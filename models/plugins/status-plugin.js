module.exports = exports = function statusPlugin (schema, options) {
    schema.add({recordStatus: {type: String, default: 'active'}});
    schema.add({softDeletedOn: Date});
    schema.add({deactivatedOn: Date});

    schema.pre('save', function (next) {
        const now = new Date();
        switch (this.recordStatus) {
            case 'deleted':
                this.softDeletedOn = now;
                break;
            case 'inactive':
                this.softDeletedOn = null;
                this.deactivatedOn = now;
                break;
            default:
                this.softDeletedOn = null;
                this.deactivatedOn = null;
        }
        next();
    });

    schema.methods.softDelete = function (callback) {
        this.recordStatus = 'deleted';
        this.save({validateBeforeSave: false}, callback);
    };

    schema.methods.activate = function (callback) {
        this.recordStatus = 'active';
        this.save({validateBeforeSave: false}, callback);
    };

    schema.methods.deactivate = function (callback) {
        this.recordStatus = 'inactive';
        this.save({validateBeforeSave: false}, callback);
    };

    schema.statics.deactivate = function (conds) {
        if (!conds) conds = {};
        const now = new Date();
        return this.update(conds, {
            $set: {
                deactivatedOn: now,
                softDeletedOn: null,
                recordStatus: 'inactive'
            }
        }, {multi: true});
    };

    schema.statics.softDelete = function (conds) {
        if (!conds) conds = {};
        const now = new Date();
        return this.update(conds, {
            $set: {
                softDeletedOn: now,
                recordStatus: 'deleted'
            }
        }, {multi: true});
    };

    schema.statics.findActive = function (conds) {
        if (!conds) conds = {};
        const conditions = Object.assign({}, conds, { recordStatus: 'active' });
        return this.find(conditions);
    };

    schema.statics.findOneActive = function (conds) {
        if (!conds) conds = {};
        const conditions = Object.assign({}, conds, { recordStatus: 'active' });
        return this.findOne(conditions);
    };

    schema.statics.findInactive = function (conds) {
        if (!conds) conds = {};
        const conditions = Object.assign({}, conds, { recordStatus: 'inactive' });
        return this.find(conditions);
    };

    schema.statics.findDeleted = function (conds) {
        if (!conds) conds = {};
        const conditions = Object.assign({}, conds, { recordStatus: 'deleted' });
        return this.find(conditions);
    };

    schema.set('toObject', {virtuals: true});
    schema.set('toJSON', {virtuals: true});

};

