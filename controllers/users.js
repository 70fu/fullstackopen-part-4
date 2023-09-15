const bcrypt = require('bcrypt');
const usersRouter = require('express').Router();
const User = require('../models/user');
const logger = require('../utils/logger');

usersRouter.post('/', async (request, response) => {
    const { username, name, password } = request.body;

    //return 400 if password is missing
    if(!password){
        response.status(400).send('password is required');
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
    const users = await User.find({});
    response.status(200).json(users);
})

module.exports = usersRouter;