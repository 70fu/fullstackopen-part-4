const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app);
const Blog = require('../models/blog');
const helper = require('./test_helpers');
const logger = require('../utils/logger');


beforeEach(async () => {
    await Blog.deleteMany({});

    const blogs = helper.initialBlogs.map(blog => new Blog(blog));
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
            .send(newBlog)
            .expect(201)
            .expect('Content-Type',/application\/json/);

        const blogs = await helper.blogsInDb();
        expect(blogs.length).toBe(helper.initialBlogs.length + 1);

        expect(blogs).toContainEqual(response.body);
    })

    test('sets likes to 0 if missing in request body', async () => {
        const { likes, ...blogNoLikes } = newBlog;
        const response = await api.post(url)
            .send(blogNoLikes)
            .expect(201)
            .expect('Content-Type',/application\/json/);

        expect(response.body).toHaveProperty('likes',0);
    })

    test('missing title returns 400', async () => {
        const { title, ...blogNoTitle } = newBlog;
        await api.post(url).send(blogNoTitle).expect(400);
    })

    test('missing url returns 400', async () => {
        const blogNoUrl = { ...newBlog };
        delete blogNoUrl.url;
        await api.post(url).send(blogNoUrl).expect(400);
    })
})