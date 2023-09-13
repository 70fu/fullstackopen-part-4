const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helpers');
const api = supertest(app);
const Blog = require('../models/blog');

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
})