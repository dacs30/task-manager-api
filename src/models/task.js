const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({ // using schema (check doc)
    description: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false                        // default value set to false (task not completed)
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId, // using mongoose to get the owner id
        required: true,
        ref: 'User'                           // referenced to a User model
    }
}, {
    timestamps: true
})

const Task = mongoose.model('Task', taskSchema); // model with the schema

module.exports = Task;