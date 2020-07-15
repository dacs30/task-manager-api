const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const {userOneId, userOne, setupDatabase} = require('./fixtures/db');

// creating a fake user everytime we start a test 
beforeEach(setupDatabase);

// testing the API endpoints
test('Test to signup a new user', async () => {
    const response = await request(app).post('/users').send({
        name: 'Dacs',
        email: 'dcstest@example.com',
        password: 'mypass123!'
    }).expect(201);

    // Assert the database was changed correctly
    const user = await User.findById(response.body.user._id);
    expect(user).not.toBeNull(); // we expect the user not to be null

    // Assertions baout the response
    expect(response.body).toMatchObject({
        user: { 
            name: 'Dacs' // asserting with the users name
        }
    })
});

// testing the log in with the test data
test('Test log in existing user', async () => {
   const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200);

    const user = await User.findById(userOneId);
    expect(response.body.token).toBe(user.tokens[1].token);
});

// testing login with a nonexisting user (should receive a 400 status code)
test('Nonexistent user login', async () => {
    await request(app).post('/users/login').send({
        email: 'someEmail@example.com',
        passoword: '123'
    }).expect(400);
});

test('Should get profile for user', async () => {
    await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`) // confirms the token (if exists)
        .send()
        .expect(200);
});

test('Try to get a profile with auth', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401);
});

test('Try to delete account', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);

    const user = await User.findById(userOneId);
    expect(user).toBeNull();
});

test('Try to delete a non auth user', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401);
});

test('Testing image upload', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')
        .expect(200);

    const user = await User.findById(userOneId);
    expect(user.avatar).toEqual(expect.any(Buffer)); // comparing objects / checks if it a buffer
});

test('Testing update valid users fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({name: 'Luis'})
        .expect(200);
});

test('Testing update invalid users fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({height: 120})
        .expect(400);
});