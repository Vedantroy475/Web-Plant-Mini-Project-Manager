const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true,
        maxLength: [150, 'Task title cannot exceed 150 characters'],
    },
    description: {
        type: String,
        enum: {
            values: ['todo', 'in-progress', 'done'],
            message: '{VALUE} is not a valid status',
        },
        default: 'todo',
    },
    dueDate: {
        type: Date,
        default: null,
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
        index: true,
    },
},
    {
        timestamps: true,
    }

);

// Compound index to speed up filtering by status and sorting by dueDate within a project
taskSchema.index({ project: 1, status: 1, dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);
