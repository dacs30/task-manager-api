const request = require('supertest');
const Task = require('../src/models/task');
const app = require('../src/app');
const {
    userOneId, 
    userOne, 
    setupDatabase,
    userTwoId,
    userTwo,
    taskOne,
    taskTwo,
    taskThree
} = require('./fixtures/db');

// creating a fake user everytime we start a test 
beforeEach(setupDatabase);

test('Should create test for user', async () => {
    const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: 'From my test'
        })
        .expect(201);

    const task = await Task.findById(response.body._id);
    expect(task).not.toBeNull();
    expect(task.completed).toBe(false);
});

test('Try to get all tasks for user one', async () => {
    const response = await request(app)
                        .get('/tasks')
                        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
                        .expect(200);

    const tasks = await response.body;

    expect(tasks).not.toBeNull();
});

test('Try to delete a user ones task using user two', async () => {
    const response = await request(app)
                        .delete(`/taks/${taskOne._id}`)
                        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
                        .expect(404);

    const task = await Task.findById(taskOne._id);
    expect(task).not.toBeNull();
})