const mongoose = require('mongoose');
//mongoose.set('bufferTimeoutMS',30000);
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app);
const User = require('../models/user');
const helper = require('./user_test_helpers');


beforeEach(async () => {
    await User.deleteMany({});

    const users = helper.initialUsers.map(user => new User(user));
    const promises = users.map(user => user.save());
    await Promise.all(promises);
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('GET /api/users', () => {
    const url = '/api/users';

    test('returns correct status code and content type header', async () => {
        await api.get(url)
            .expect(200)
            .expect('Content-Type',/application\/json/);
    });

    test('returns all users', async () => {
        const response = await api.get(url);

        expect(response.body).toHaveLength(helper.initialUsers.length);
    });

    test('returns users with ids', async () => {
        const response = await api.get(url);
        response.body.forEach(blog => {
            expect(blog).toHaveProperty('id');
        })
    })
});

describe('GET /api/users/:id', () => {
    const url = '/api/users';

    test('returns user with given id', async () => {
        const users = await helper.usersInDb();
        const response = await api.get(`${url}/${users[0].id}`)
            .expect(200)
            .expect('Content-Type',/application\/json/);

        expect(response.body).toEqual(users[0]);
    });

    test('with invalid id returns 404', async () => {
        const invalidId = await helper.nonExistingId();
        await api.get(`${url}/${invalidId}`).expect(404);
    })
})

describe('POST /api/users', () => {
    const url = '/api/users';
    const newUser = {
        username:'simsim',
        name:'Simon',
        password:'SuperSecretWords'
    }

    test('adds one user', async () => {
        const response = await api.post(url)
            .send(newUser)
            .expect(201)
            .expect('Content-Type',/application\/json/);

        const users = await helper.usersInDb();
        expect(users.length).toBe(helper.initialUsers.length + 1);
        expect(response.body.username).toBe(newUser.username);
        expect(response.body.name).toBe(newUser.name);
    })

    test('missing username returns 400', async () => {
        const { username, ...userNoUsername } = newUser;
        await api.post(url).send(userNoUsername).expect(400);
    });

    test('missing password returns 400', async () => {
        const { password, ...userNoPassword } = newUser;
        await api.post(url).send(userNoPassword).expect(400);
    });

    test('username with length<3 returns 400', async () => {
        const shortNameUser = { ...newUser, username:'ts' };
        await api.post(url).send(shortNameUser).expect(400);
    });

    test('password with length<3 returns 400', async () => {
        const shortPasswordUser = { ...newUser, password:'ts' };
        await api.post(url).send(shortPasswordUser).expect(400);
    });
})