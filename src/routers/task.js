const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');
const router = new express.Router();

// posting a new task (needs to be logged in)
router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,       // copying all the fields using this super cool ES6 feature 
        owner: req.user._id
    })
    try {
        await task.save();
        res.status(201).send(task);
    } catch (e) {
        res.status(400).send(e);
    }
})

// GET /tasks?completed=true or =false
// GET /tasks?limit=10&skip=0 (0 = first page, 10 = second page)
// GET /tasks?sortBy=createdAt_asc or _desc
// showing all the tasks
router.get('/tasks', auth, async (req, res) => { 
    const match = {};
    const sort = {};

    if(req.query.completed){
        match.completed = req.query.completed === 'true'; // checking the query
    }

    if(req.query.sortBy){
        const parts = req.query.sortBy.split('_');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1; //turnary (I dont know how to write this) operator
    }

    try {
        // const tasks = await Task.find({owner: req.user._id}); // the old way I was doing till query strings
        await req.user.populate({ // new way of doing
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        res.send(req.user.tasks);
    } catch(e) {
        res.status(500).send(e);
    }

})

// showing a task by id (made by the user)
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {                               // id and owner are the filters
        const task = await Task.findOne({_id, owner: req.user._id});

        if(!task){
            return res.status(404).send();
        }
        res.send(task);
    } catch(e) {
        res.status(500).send(e);
    }
})

// updating a task by its id
router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed']; 
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update)); // check if it is allowed

    if (!isValidOperation) {
        res.status(400).send({error: 'Invalid update!'});
    }

    try {
        // the next three lines are super important
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id});

        if (!task) {
            res.status(400).send();
        }

        updates.forEach((update) => task[update] = req.body[update]);

        await task.save();

        res.status(201).send(task);
    } catch (e) {
        res.status(500).send(e);
    }
})

// deleting a task
router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id});

        if(!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch (e) {
        res.status(500).send();
    }
})

module.exports = router;