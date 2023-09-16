const mongoose = require('mongoose');
//mongoose.set('bufferTimeoutMS',30000);
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app);
const User = require('../models/user');
const helper = require('./user_test_helpers');


beforeEach(async () => {
    await User.deleteMany({});

    await api.post('/api/users').send(helper.initialUsers[0]);
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('POST /api/login', () => {
    const url = '/api/login';
    const credentials = {
        username:'root',
        password:'nimda'
    }
    test('with missing username returns 400', async () => {
        const { username, ...noUsername } = credentials;
        await api.post(url).send(noUsername).expect(400);
    });

    test('with missing password returns 400', async () => {
        const { password, ...noPassword } = credentials;
        await api.post(url).send(noPassword).expect(400);
    });

    test('with non-existing username returns 401', async () => {
        const missingUser =  { username:'toor', password:credentials.password };
        await api.post(url).send(missingUser).expect(401);
    })

    test('with wrong password returns 401', async () => {
        const wrongPassword = { username:credentials.username,password:'credentials.password.slice(1)' };
        await api.post(url).send(wrongPassword).expect(401);
    })

    test('with correct credentials returns token', async () => {
        const result = await api.post(url).send(credentials).expect(200);
        expect(result.body).toHaveProperty('token');
        expect(result.body.username).toBe(credentials.username);
        expect(result.body.name).toBe(helper.initialUsers[0].name);
    })
})

