const mongoose = require('mongoose');
//mongoose.set('bufferTimeoutMS',30000);
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app);
const Blog = require('../models/blog');
const User = require('../models/user');
const helper = require('./blog_test_helpers');
const logger = require('../utils/logger');

const user = {
    username:'simsom',
    name:'nomis',
    password:'CanYouGuessThis'
};
let authorizationHeaderValue;

beforeEach(async () => {
    await User.deleteMany({});
    await Blog.deleteMany({});

    const userResponse = await api.post('/api/users').send(user);
    const loginResponse = await api.post('/api/login').send(user);
    authorizationHeaderValue = `Bearer ${loginResponse.body.token}`;

    const blogs = helper.initialBlogs.map(blog => new Blog({ user:userResponse.body.id,...blog }));
    const promises = blogs.map(blog => blog.save());
    await Promise.all(promises);
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('GET /api/blogs', () => {
    const url = '/api/blogs';

    test('returns correct status code and content type header', async () => {
        await api.get(url)
            .expect(200)
            .expect('Content-Type',/application\/json/);
    });

    test('returns all blogs', async () => {
        const response = await api.get(url);

        expect(response.body).toHaveLength(helper.initialBlogs.length);
    });

    test('contains blog about react patterns', async () => {
        const response = await api.get(url);
        const titles = response.body.map(r => r.title);
        expect(titles).toContain('React patterns');
    });

    test('returns blogs with ids', async () => {
        const response = await api.get(url);
        response.body.forEach(blog => {
            expect(blog).toHaveProperty('id');
        })
    })
});

describe('POST /api/blogs', () => {
    const url = '/api/blogs';
    const newBlog = {
        title: 'Representing Heterogeneous Data',
        author: 'Bob Nystrom',
        url: 'https://journal.stuffwithstuff.com/2023/08/04/representing-heterogeneous-data/',
        likes: 16,
    }

    test('adds one blog', async () => {
        const response = await api.post(url)
            .set('authorization',authorizationHeaderValue)
            .send(newBlog)
            .expect(201)
            .expect('Content-Type',/application\/json/);

        const blogs = await helper.blogsInDb();
        expect(blogs.length).toBe(helper.initialBlogs.length + 1);

        expect(blogs).toEqual(expect.arrayContaining([
            expect.objectContaining(response.body)
        ]));

        //check if user is referenced in blog entry
        const{ password, ...userWithoutPassword } = user;
        expect(response.body).toHaveProperty('user',expect.objectContaining(userWithoutPassword));

        //check if blog is in blogs array of given user
        const userResponse = await api.get(`/api/users/${response.body.user.id}`);
        const { user:_, ...blogWithoutUser } = response.body;
        expect(userResponse.body.blogs).toContainEqual(blogWithoutUser);
    })

    test('sets likes to 0 if missing in request body', async () => {
        const { likes, ...blogNoLikes } = newBlog;
        const response = await api.post(url)
            .set('authorization',authorizationHeaderValue)
            .send(blogNoLikes)
            .expect(201)
            .expect('Content-Type',/application\/json/);

        expect(response.body).toHaveProperty('likes',0);
    })

    test('missing title returns 400', async () => {
        const { title, ...blogNoTitle } = newBlog;
        await api.post(url)
            .set('authorization',authorizationHeaderValue)
            .send(blogNoTitle)
            .expect(400);
    })

    test('missing url returns 400', async () => {
        const blogNoUrl = { ...newBlog };
        delete blogNoUrl.url;
        await api.post(url)
            .set('authorization',authorizationHeaderValue)
            .send(blogNoUrl)
            .expect(400);
    });

    test('without authorization returns 401', async () => {
        await api.post(url)
            .send(newBlog)
            .expect(401);
    })
})

describe('DELETE /api/blogs/:id',() => {
    const url = '/api/blogs';
    test('with valid id removes blog', async () => {
        const blogs = await helper.blogsInDb();
        const toBeRemoved = blogs[0];

        await api.delete(`${url}/${toBeRemoved.id}`)
            .set('authorization',authorizationHeaderValue)
            .expect(204);

        const blogsAfter = await helper.blogsInDb();
        expect(blogsAfter.length).toBe(blogs.length-1);
        expect(blogsAfter).not.toContainEqual(toBeRemoved);
    });

    test('without authorization header returns 401', async () => {
        const blogs = await helper.blogsInDb();
        const toBeRemoved = blogs[0];

        await api.delete(`${url}/${toBeRemoved.id}`).expect(401);
    });

    test('with wrong user logged in returns 401', async () => {
        //create a second user
        const secondUser = {
            username:'e11a',
            name:'Ella',
            password:'EllasSecret'
        };
        await api.post('/api/users').send(secondUser);
        const loginResponse = await api.post('/api/login').send(secondUser);
        const secondUserAuth = `Bearer ${loginResponse.body.token}`;

        const blogs = await helper.blogsInDb();
        const toBeRemoved = blogs[0];

        await api.delete(`${url}/${toBeRemoved.id}`)
            .set('authorization',secondUserAuth)
            .expect(401);
    });
})

describe('PUT /api/blogs/:id',() => {
    const url = '/api/blogs';
    const newBlogValues = {
        title: 'Representing Heterogeneous Data',
        author: 'Bob Nystrom',
        url: 'https://journal.stuffwithstuff.com/2023/08/04/representing-heterogeneous-data/',
        likes: 16,
    }
    test('updates all fields accordingly', async () => {
        const blogs = await helper.blogsInDb();
        const updated = { ...newBlogValues,id:blogs[0].id };

        const response = await api
            .put(`${url}/${blogs[0].id}`)
            .set('authorization',authorizationHeaderValue)
            .send(updated)
            .expect(200)
            .expect('Content-Type',/application\/json/);

        expect(response.body).toMatchObject(updated);
    });

    test('without authorization returns 401', async () => {
        const blogs = await helper.blogsInDb();
        const updated = { ...newBlogValues,id:blogs[0].id };

        await api.put(`${url}/${blogs[0].id}`)
            .send(updated)
            .expect(401)
            .expect('Content-Type',/application\/json/);
    })

    test('for non-existing id returns 404', async () => {
        const nonExistingId = await helper.nonExistingId();
        const updated = { ...newBlogValues,id:nonExistingId };
        await api.put(`${url}/${nonExistingId}`)
            .set('authorization',authorizationHeaderValue)
            .send(updated)
            .expect(404);
    });

    test('update with wrong user returns 401', async () => {
        const anotherUser = {
            username:'admin',
            name:'admin',
            password:'admin'
        }
        await api.post('/api/users').send(anotherUser);
        const loginResponse = await api.post('/api/login').send(anotherUser);
        const anotherAuthorization = `Bearer ${loginResponse.body.token}`;

        const blogs = await helper.blogsInDb();
        const updated = { ...newBlogValues,id:blogs[0].id };

        await api
            .put(`${url}/${blogs[0].id}`)
            .set('authorization',anotherAuthorization)
            .send(updated)
            .expect(401);
    })
})