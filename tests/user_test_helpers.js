const User = require('../models/user');

const initialUsers = [
    {
        username:'root',
        name:'admin',
        password:'nimda'
    }
]

const usersInDb = async () => {
    const users = await User.find({})
    return users.map(user => user.toJSON())
}

module.exports = {
    initialUsers, usersInDb
}