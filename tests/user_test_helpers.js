const User = require('../models/user');

const initialUsers = [
    {
        username:'root',
        name:'admin',
        password:'nimda'
    }
]

const nonExistingId = async () => {
    const user = new User({ username: 'nobody',name:'no body',password:'NoPassword' })
    await user.save()
    await user.deleteOne()

    return user._id.toString()
}

const usersInDb = async () => {
    const users = await User.find({}).populate('blogs',{ user:0 });
    return users.map(user => user.toJSON())
}

module.exports = {
    initialUsers, usersInDb, nonExistingId
}