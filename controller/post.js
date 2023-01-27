const asyncHandler = require('../middleware/asyncHandler');
const Post = require('../modals/posts');
const Likes = require('../modals/Likes')
const Comment = require('../modals/Comment')
const errorResponse = require('../utils/ErrorHandler')
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../utils/cloudinary');

exports.createNewPost = asyncHandler(async (req, res, next) => {
    req.body.user = req.user._id;

    let newPost = await Post.create(req.body);
    const postDetails = await Likes.create({ post: newPost._id })
    const comments = await Comment.create({ post: newPost._id })
    newPost.user = req.user._id;
    newPost = await newPost.save();

    res.status(200).send({ success: true, data: newPost })
})

exports.updatePost = asyncHandler(async (req, res, next) => {
    const updatePost = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    if (!updatePost) {
        return next(new errorResponse(`Post not found with id ${req.params.id}`, 401));
    }

    if (!(updatePost.user != req.user._id) && !(req.user.role === 'admin')) {
        return next(new errorResponse('Not authorized to update the post', 404));
    }

    res.status(200).send({ success: true, data: updatePost })
})

exports.deletePost = asyncHandler(async (req, res, next) => {
    const delpost = await Post.findById(req.params.id);

    if (!delpost) {
        return next(new errorResponse(`Post not found with id ${req.params.id}`, 401));
    }

    if (!(delpost.user != req.user._id) && !(req.user.role === 'admin')) {
        return next(new errorResponse('Not authorized to delete the post', 404));
    }

    // for(let i=0;i<delpost.photos.length;i++){
    //     fs.unlinkSync(`./public/images/${delpost.photos[i]}`);
    // }

    // for(let i=0;i<delpost.videos.length;i++){
    //     fs.unlinkSync(`../public/videos/${delpost.videos[i]}`);
    // }

    delpost.remove();

    res.status(200).send({ success: true, data: delpost })
})

exports.like = asyncHandler(async (req, res, next) => {
    const details = await Likes.findOne({ post: req.params.id });

    if (!details) {
        next(new errorResponse(`No post found with id ${req.params.id}`, 401));
    }

    if (!details.likes.includes(req.user._id)) {
        details.likes.push(req.user._id);
    }
    details.save();


    res.status(200).send({ success: true, data: { like: details.likes.length, likes: details.likes } });

})

exports.unlike = asyncHandler(async (req, res, next) => {
    const details = await Likes.findOne({ post: req.params.id });

    if (!details) {
        next(new errorResponse(`No post found with id ${req.params.id}`, 401));
    }

    if (details.likes.includes(req.user._id)) {
        details.likes.remove(req.user._id);
    }
    details.save();


    res.status(200).send({ success: true, data: { like: details.likes.length, likes: details.likes } });

})

exports.comment = asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.postId);

    if (!post) {

        next(new errorResponse(`No post found with id ${req.params.postId}`, 401));
    }
    const comment = await Comment.findOne({ post: req.params.postId });
    comment.content.push({ user: req.user._id, comment: req.body.comment, profilePic: req.user.profilePic, name: req.user.name });

    comment.save();

    res.status(200).send({ success: true, data: comment });
})




exports.editComment = asyncHandler(async (req, res, next) => {
    const comment = await Comment.findOne({ post: req.params.postId });


    if (!comment) {
        next(new errorResponse(`No post found with id ${req.params.id}`, 401));
    }

    const commentIndex = comment.content.findIndex((item) => item._id == req.params.commentId);

    if (commentIndex == -1) {
        next(new errorResponse(`No comments found with id ${req.params.commentId}`, 401));
    }

    if (comment.content[commentIndex].user != req.user.id && req.user.role !== 'admin') {
        next(new errorResponse(`Not authorized to edit the comment`, 401));
    }

    comment.content[commentIndex].comment = req.body.comment;
    comment.save();

    res.status(200).send({ success: true, data: comment });
})

exports.deleteComment = asyncHandler(async (req, res, next) => {
    const comment = await Comment.findOne({ post: req.params.postId });

    if (!comment) {
        return next(new errorResponse(`No post found with id ${req.params.id}`, 401));
    }

    const commentIndex = comment.content.findIndex((item) => item._id == req.params.commentId);

    if (commentIndex == -1) {
        return next(new errorResponse(`No comments found with id ${req.params.commentId}`, 401));
    }

    if (comment.content[commentIndex].user != req.user.id && req.user.role !== 'admin') {
        return next(new errorResponse(`Not authorized to delete the comment`, 401));
    }

    comment.content.splice(commentIndex, 1);
    comment.save();

    res.status(200).send({ success: true, data: comment });
})

exports.getPostDetails = asyncHandler(async (req, res, next) => {
    let post = await Post.findById(req.params.id);

    if (!post) {
        next(new errorResponse(`No post found with id ${req.params.id}`, 401));
    }

    post = Post.findById(req.params.id).populate([
        { path: 'comments', select: 'content' },
        { path: 'likes', select: 'likes' }

    ]);

    let data = await post;

    console.log(data);
    const com = data.comments.map((item) => {
        return item.content.map((item) => {
            return item.comment;
        })
    })

    const likesLength = data.likes.map((item) => {
        return item.likes.length;
    })

    console.log(likesLength)

    res.status(200).send({ success: true, data: { title: data.title, description: data.description, created_at: data.createdAt, comments: com, likes: likesLength } });
})

exports.getAllPosts = asyncHandler(async (req, res, next) => {
    let posts = await Post.find({ user: req.user.id }).populate([
        { path: 'comments', select: 'content' },
        { path: 'likes', select: 'likes' }

    ]);

    const data = posts.map((item) => {
        return {
            title: item.title,
            description: item.description,
            photos: item.photos,
            videos: item.videos,
            user: item.user,

            id: item._id,

            created_at: item.createdAt,
            comments: item.comments.map((item) => {
                return item.content.map((item) => {
                    return item.comment;
                })
            }),
            likes: item.likes.map((item) => {
                return item.likes.length;
            })
        }
    })


    res.status(200).send({ success: true, data });

})

exports.getEveryPosts = asyncHandler(async (req, res, next) => {
    let posts = await Post.find().populate([
        { path: 'comments', select: 'content' },
        { path: 'likes', select: 'likes' },
        { path: 'user', select: 'name profilePic' }
    ]);

    const data = posts.map((item) => {
        return {
            title: item.title,
            description: item.description,
            photos: item.photos,
            videos: item.videos,
            created_at: item.createdAt,

            id: item._id,
            user: item.user,

            comments: item.comments.map((item) => {
                return item.content.map((item) => {
                    return item;
                })
            }),
            likes: item.likes.map((item) => {
                return item.likes.length;
            }),
            likedUser: item.likes.map((item) => {
                return item.likes;
            })
        }
    })


    res.status(200).send({ success: true, data });

})

exports.uploadImages = asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id);
    // console.log(post,'post');
    if (!post) {
        next(new errorResponse(`No post found with id ${req.params.id}`, 401));
    }

    if (post.user != req.user.id && req.user.role !== 'admin') {
        next(new errorResponse(`Not authorized to upload images`, 401));
    }


    if (!req.files) {
        next(new errorResponse(`Please upload a file`, 401));
    }

    let images = [];
    console.log(req.files.files.length);
    if (req.files.files.length) {
        for (let i = 0; i < req.files.files.length; i++) {
            const file = req.files.files[i];
            // console.log(file);

            if (!file.mimetype.startsWith('image')) {
                next(new errorResponse(`Please upload an image file`, 401));
            }

            if (file.size > process.env.MAX_FILE_UPLOAD) {
                next(new errorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`, 401));
            }

            // file.name=`${Date.now()}photo_${post._id}_${i}${path.parse(file.name).ext}`;
            let result;
            try {
                result = await cloudinary.uploader.upload(file.tempFilePath, {
                    folder: 'images'
                })
                post.photos.push({ public_id: result.public_id, url: result.secure_url });
            } catch (err) {
                console.log(err);
            }

            // file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`,async err=>{
            //     if(err){
            //         console.log(err);
            //         next(new errorResponse(`Problem with file upload`,500));
            //     }


            // })
        }

        post.save();
        res.status(200).send({ success: true, data: post });
    } else {
        const file = req.files.files;
        if (!file.mimetype.startsWith('image')) {
            next(new errorResponse(`Please upload an image file`, 401));
        }


        if (file.size > process.env.MAX_FILE_UPLOAD) {
            next(new errorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`, 401));
        }

        // file.name=`${Date.now()}photo_${post._id}_${i}${path.parse(file.name).ext}`;
        let result;
        try {
            result = await cloudinary.uploader.upload(file.tempFilePath, {
                folder: 'images'
            })
            post.photos.push({ public_id: result.public_id, url: result.secure_url });
        } catch (err) {
            console.log(err);
        }

        // file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`,async err=>{
        //     if(err){
        //         console.log(err);
        //         next(new errorResponse(`Problem with file upload`,500));
        //     }

        post.save();
        res.status(200).send({ success: true, data: post });
    }
})

exports.uploadVideo = asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id);
    // console.log(post,'post');
    if (!post) {
        next(new errorResponse(`No post found with id ${req.params.id}`, 401));
    }

    if (post.user != req.user.id && req.user.role !== 'admin') {
        next(new errorResponse(`Not authorized to upload video`, 401));
    }


    if (!req.files) {
        next(new errorResponse(`Please upload a file`, 401));
    }
    // console.log(req.files);
    let videos = [];
    if (req.files.files.length) {
        for (let i = 0; i < req.files.files.length; i++) {
            const file = req.files.files[i];
            // console.log(file);
            if (!file.mimetype.startsWith('video')) {
                next(new errorResponse(`Please upload a video file`, 401));
            }

            if (file.size > '1000000000000000') {
                next(new errorResponse(`Please upload a video less than 1000000000000000`, 401));
            }

            // file.name=`${Date.now()}video_${post._id}_${i}${path.parse(file.name).ext}`;
            // file.mv(`./public/videos/${file.name}`,async err=>{
            //     if(err){
            //         console.log(err);
            //         next(new errorResponse(`Problem with file upload`,500));
            //     }


            // })
            let result;
            try {
                result = await cloudinary.uploader.upload(file.tempFilePath, {
                    resource_type: 'video',
                    folder: 'videos'
                })
                console.log(result);
                post.videos.push({ public_id: result.public_id, url: result.secure_url });
                // console.log(video);
                // // console.log(result);
            } catch (err) {
                console.log(err, 6465);
            }

        }

        post.save();
        res.status(200).send({ success: true, data: post });
    }
    else {
        const file = req.files.files;
        // console.log(file);
        if (!file.mimetype.startsWith('video')) {
            next(new errorResponse(`Please upload a video file`, 401));
        }

        if (file.size > '100000000000000000') {
            next(new errorResponse(`Please upload a video less than 1000000000000000`, 401));
        }


        // file.name=`${Date.now()}video_${post._id}_${i}${path.parse(file.name).ext}`;
        // file.mv(`./public/videos/${file.name}`,async err=>{
        //     if(err){
        //         console.log(err);
        //         next(new errorResponse(`Problem with file upload`,500));
        //     }

        // })
        let result;
        try {
            result = await cloudinary.uploader.upload(file.tempFilePath, {
                resource_type: 'video',
                folder: 'videos'
            })
            console.log(result);
            const video = {
                public_id: result.public_id,
                url: result.secure_url
            }

            post.videos.push({ public_id: result.public_id, url: result.secure_url });
            // console.log(result);
            // post.videos=video;
        } catch (err) {
            console.log(err, 6465);
        }

        post.save();
        res.status(200).send({ success: true, data: post });
    }
})

exports.deleteImage = asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        next(new errorResponse(`No post found with id ${req.params.id}`, 401));
    }

    if (post.user != req.user.id && req.user.role !== 'admin') {
        next(new errorResponse(`Not authorized to delete image`, 401));
    }
    let c = 0;
    for (let i = 0; i < post.photos.length; i++) {
        if (post.photos[i].public_id == req.body.image) {
            try {
                post.photos.splice(i, 1);
                await post.save();
                await cloudinary.uploader.destroy(req.body.image)
            } catch (err) {
                console.log(err);
            }
            c++;
            break;
        }
    }

    // try {
    //     fs.unlinkSync(`./public/videos/${req.body.video}`)
    //     //file removed
    // } catch(err) {
    //     console.error(err)
    // }

    if (c == 0) {
        next(new errorResponse(`No image found with id ${req.body.image}`, 401));
    }
    post.save();
    res.status(200).send({ success: true, data: post });
})

exports.deleteVideo = asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        next(new errorResponse(`No post found with id ${req.params.id}`, 401));
    }

    if (post.user != req.user.id && req.user.role !== 'admin') {
        next(new errorResponse(`Not authorized to delete video`, 401));
    }

    if (!req.body.video) {
        next(new errorResponse(`Please provide video id`, 401));
    }
    let c = 0;
    for (let i = 0; i < post.videos.length; i++) {
        if (post.videos[i].public_id === req.body.video) {
            try {
                post.videos.splice(i, 1);
                await post.save();
                await cloudinary.uploader.destroy(req.body.video, { resource_type: 'video' })
            } catch (err) {
                console.log(err);
            }

            c++;
            break;
        }
    }
    // try {
    //     fs.unlinkSync(`./public/videos/${req.body.video}`)
    //     //file removed
    // } catch(err) {
    //     console.error(err)
    // }
    if (c === 0) {
        next(new errorResponse(`No video found with id ${req.body.video}`, 401));
    }

    post.save();
    res.status(200).send({ success: true, data: post });
})