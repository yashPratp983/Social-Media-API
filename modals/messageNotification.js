const mongoose = require('mongoose');

const notification = new mongoose.Schema({
    messageId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Message',
    },
    message: {
        type: String,
        required: true
    },
    sender: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
});

module.exports = mongoose.model('messageNotification', notification);