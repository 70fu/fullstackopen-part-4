const bcrypt = require('bcrypt');
const usersRouter = require('express').Router();
const User = require('../models/user');
const logger = require('../utils/logger');

usersRouter.post('/', async (request, response) => {
    const MINIMUM_PASSWORD_LENGTH=3;
    const { username, name, password } = request.body;

    //return 400 if password is missing or too short
    if(!password || password.length<MINIMUM_PASSWORD_LENGTH){
        response.status(400).send(`password of at least ${MINIMUM_PASSWORD_LENGTH} characters is required`);
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = new User({
        username,
        name,
        passwordHash
    });

    const savedUser = await user.save();

    response.status(201).json(savedUser);
});

usersRouter.get('/', async (request, response) => {
    const users = await User.find({}).populate('blogs', { user:0 });
    response.status(200).json(users);
});

usersRouter.get('/:id', async (request, response) => {
    const user = await User.findById(request.params.id).populate('blogs',{ user:0 });
    if(!user){
        response.status(404).end();
    }
    else {
        response.status(200).json(user);
    }
})

module.exports = usersRouter;