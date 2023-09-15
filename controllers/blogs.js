const logger = require('../utils/logger');
const blogRouter = require('express').Router()
const Blog = require('../models/blog');
const User = require('../models/user');

blogRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({}).populate('user',{ username:1,name:1 });
    return response.json(blogs)
})

blogRouter.post('/', async (request, response) => {
    logger.info('creating blog entry for body',request.body);

    //find any user in the database that created this blog
    const user = (await User.find({}).limit(1))[0];
    logger.info('Using user: ',user);
    if(!user){
        return response.status(400).send('at least 1 user must exist to create blog entries');
    }

    const blog = new Blog({ ...request.body, user:user._id });

    const result = await blog.save();
    user.blogs = user.blogs.concat(result._id);
    await user.save();
    await result.populate('user',{ username:1,name:1 });
    return response.status(201).json(result);
})

blogRouter.delete('/:id', async (request, response) => {
    logger.info('deleting blog entry with id', request.params.id);
    await Blog.findByIdAndDelete(request.params.id);
    return response.status(204).end();
})

blogRouter.put('/:id', async (request, response) => {
    logger.info('updating blog entry with id', request.params.id);
    const updated = await Blog.findByIdAndUpdate(request.params.id,request.body,{ new: true, runValidators: true, context: 'query' });
    if(updated){
        return response.status(200).json(updated);
    }
    else {
        return response.status(404).end();
    }
})

module.exports = blogRouter;