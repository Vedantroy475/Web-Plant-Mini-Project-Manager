const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Project title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters'],

    },
    description: {
        type: String,
        trim: true,
        default: '',
        maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },

},
    {
        timestamps: true,
    }

);

// Cascade delete all tasks when project.deleteOne() is called on a document

projectSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    await mongoose.model('Task').deleteMany({ project: this._id });
});

module.exports = mongoose.model('Project', projectSchema);