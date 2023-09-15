const User = require('../models/user');

const initialUsers = [
    {
        username:'root',
        name:'admin',
        password:'nimda'
    }
]

const usersInDb = async () => {
    const users = await User.find({}).populate('blogs',{ user:0 });
    return users.map(user => user.toJSON())
}

module.exports = {
    initialUsers, usersInDb
}