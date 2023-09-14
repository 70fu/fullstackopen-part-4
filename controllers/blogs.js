const logger = require('../utils/logger');
const blogRouter = require('express').Router()
const Blog = require('../models/blog');


blogRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({});
    return response.json(blogs)
})

blogRouter.post('/', async (request, response) => {
    logger.info('creating blog entry for body',request.body);
    const blog = new Blog(request.body)

    const result = await blog.save();
    return response.status(201).json(result);
})

blogRouter.delete('/:id', async (request, response) => {
    logger.info('deleting blog entry with id', request.params.id);
    await Blog.findByIdAndDelete(request.params.id);
    return response.status(204).end();
})

module.exports = blogRouter;