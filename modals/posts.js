const mongoose = require('mongoose');
const cloudinary = require('../utils/cloudinary');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: [true, "Please add description"],
        default: ''
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'Users',
        required: true
    },
    photos: [{
        public_id: {
            type: String
        },
        url: {
            type: String
        }
    }],
    videos: [{
        public_id: {
            type: String
        },
        url: {
            type: String
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
}
)

postSchema.pre('remove', async function (next) {
    await this.model('Comments').deleteMany({ post: this._id });
    await this.model('Likes').deleteMany({ post: this._id });

    if (this.photos.length > 0) {
        for (let i = 0; i < this.photos.length; i++) {
            await cloudinary.uploader.destroy(this.photos[i].public_id);
        }
    }

    if (this.videos.length > 0) {
        for (let i = 0; i < this.videos.length; i++) {
            await cloudinary.uploader.destroy(this.videos[i].public_id, { resource_type: 'video' });
        }
    }

    next();
})

postSchema.virtual('comments', {
    ref: 'Comments',
    localField: '_id',
    foreignField: 'post',
    justOne: false
})

postSchema.virtual('likes', {
    ref: 'Likes',
    localField: '_id',
    foreignField: 'post',
    justOne: false
})

module.exports = mongoose.model('Posts', postSchema);