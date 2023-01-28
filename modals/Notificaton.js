const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'Users',
        required: true
    },
    request: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Users',

    }],
    status: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Users'
    }]
})

module.exports = mongoose.model('Notifications', notificationSchema)