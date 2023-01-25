const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
    content: [{
        user: { type: mongoose.Schema.ObjectId, ref: 'Users', },
        comment: { type: String },
    }],
    post: {
        type: mongoose.Schema.ObjectId,
        ref: 'Posts',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Comments', commentSchema);