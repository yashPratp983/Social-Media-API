const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
    content: [{
        user: { type: mongoose.Schema.ObjectId, ref: 'Users', },
        name: { type: String },
        profilePic: {
            public_id: {
                type: String
            },
            url: {
                type: String
            }
        },
        comment: { type: String },
    }],
    post: {
        type: mongoose.Schema.ObjectId,
        ref: 'Posts',
        required: true
    }
})

module.exports = mongoose.model('Comments', commentSchema);