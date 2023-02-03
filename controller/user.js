const User = require('../modals/users');
const errorResponse = require('../utils/ErrorHandler');
const asyncHandler = require('../middleware/asyncHandler')
const cloudinary = require('../utils/cloudinary');
const Notifications = require('../modals/Notificaton');

exports.follow = asyncHandler(async (req, res, next) => {
    const user1 = await User.findOne({ _id: req.params.id });

    if (!user1) {
        next(`User not found with id ${req.params.id}`, 401);
    }
    if (!user1.followers.includes(req.user._id)) {
        user1.followers.push(req.user._id);
    }
    if (!req.user.following.includes(user1._id)) {
        req.user.following.push(user1._id);
    }
    user1.save();
    req.user.save();

    res.status(202).send({ success: true, data: req.user });
})

exports.getAllUsers = asyncHandler(async (req, res, next) => {
    let users = await User.find();
    let users1 = users.map(user => {
        return {
            _id: user._id,
            name: user.name,
            profilePic: user.profilePic,
            followers: user.followers.length,
            following: user.following.length,
            bio: user.bio
        }
    })

    res.status(200).send({ success: true, data: users1 });
})


exports.getAUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        next(`User not found with id ${req.params.id}`, 401);
    }

    const data = {
        _id: user._id,
        name: user.name,
        profilePic: user.profilePic,
        followers: user.followers.length,
        following: user.following.length,
        bio: user.bio

    }

    res.status(200).send({ success: true, data: data });
})

exports.unfollow = asyncHandler(async (req, res, next) => {
    const user1 = await User.findOne({ _id: req.params.id });

    if (!user1) {
        next(new errorResponse(`User not found with id ${req.params._id}`, 401));
    }
    if (user1.followers.includes(req.user._id)) {
        user1.followers.remove(req.user._id);
    }
    if (req.user.following.includes(user1._id)) {
        req.user.following.remove(user1._id);
    }
    user1.save();
    req.user.save();

    res.status(202).send({ success: true, data: req.user });
})

exports.block = asyncHandler(async (req, res, next) => {
    const user1 = await User.findOne({ _id: req.params.id });

    if (!user1) {
        next(new errorResponse(`User not found with id ${req.params._id}`, 401));
    }
    if (user1.following.includes(req.user._id)) {
        user1.following.remove(req.user._id);
    }
    if (req.user.followers.includes(user1._id)) {
        req.user.followers.remove(user1._id);
    }
    await user1.save();
    await req.user.save();

    res.status(202).send({ success: true, data: req.user });
})

exports.getProfile = asyncHandler(async (req, res, next) => {
    const followingLength = req.user.following.length;
    const followersLength = req.user.followers.length;

    res.status(200).send({ success: true, data: { user: req.user, following: followingLength, followers: followersLength } })
})

exports.uploadProfilePic = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        next(new errorResponse(`User not found with id ${req.params._id}`, 401));
    }

    const file = req.files.files;
    console.log(file);
    if (!file.mimetype.startsWith('image')) {
        next(new errorResponse(`Please upload an image file`, 401));
    }

    if (file.size > process.env.MAX_FILE_UPLOAD) {
        next(new errorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`, 401));
    }

    // file.name=`${Date.now()}photo_${post._id}_${i}${path.parse(file.name).ext}`;
    let result;
    let profilePic;
    try {
        result = await cloudinary.uploader.upload(file.tempFilePath, {
            folder: 'profilePic'
        })
        profilePic = { public_id: result.public_id, url: result.secure_url }
    } catch (err) {
        console.log(err);
    }

    try {
        if (user.profilePic.public_id != "profilePic/defaultMentor_aucyyg") {
            await cloudinary.uploader.destroy(user.profilePic.public_id);
        }
    } catch (err) {
        console.log(err);
    }

    user.profilePic = profilePic;
    await user.save();
    res.status(200).send({ success: true, data: user });
})

exports.deleteProfilePic = asyncHandler(async (req, res, next) => {
    let user = await User.findById(req.user._id);
    if (!user) {
        next(new errorResponse(`User not found with id ${req.params._id}`, 401));
    }

    // file.name=`${Date.now()}photo_${post._id}_${i}${path.parse(file.name).ext}`;
    let result;


    const profilePic = {
        public_id: 'profilePic/defaultMentor_aucyyg',
        url: 'https://res.cloudinary.com/dbatsdukp/image/upload/v1673782839/profilePic/defaultMentor_aucyyg.jpg'
    }

    try {
        if (user.profilePic.public_id != "profilePic/defaultMentor_aucyyg") {
            await cloudinary.uploader.destroy(user.profilePic.public_id);
        }
    } catch (err) {
        console.log(err);
    }

    user.profilePic = profilePic;
    await user.save();
    res.status(200).send({ success: true, data: user });
})

exports.addBio = asyncHandler(async (req, res, next) => {
    let user = await User.findById(req.user._id);
    if (!user) {
        next(new errorResponse(`User not found with given id`, 401));
    }

    user.bio = req.body.bio;
    await user.save();
    user = await User.findById(req.user._id);
    res.status(200).send({ success: true, data: user });
})

exports.getFollows = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    console.log(user.followers.includes(req.params.id))
    if (!user) {
        next(new errorResponse(`User not found with given id`, 401));
    }

    if (!(user.followers.includes(req.user._id)) && req.user._id != req.params.id) {
        next(new errorResponse(`Not authorised for the information`, 401));
    }

    const followers = await User.find({ _id: { $in: user.followers } });

    const following = await User.find({ _id: { $in: user.following } });

    res.status(200).send({ success: true, data: { followers: followers, following: following } });
})

exports.blockUser = asyncHandler(async (req, res, next) => {
    const user1 = await User.findById(req.params.id);
    const user2 = await User.findById(req.user._id);
    if (!user1) {
        next(new errorResponse(`User not found with given id`, 401));
    }
    if (user2.blocklist.includes(req.user._id)) {
        next(new errorResponse(`User already blocked`, 401));
    }
    user2.blocklist.push(req.params.id);
    await user1.save();
    await user2.save();
    res.status(200).send({ success: true, data: user2 });
})

exports.unblockUser = asyncHandler(async (req, res, next) => {
    const user1 = await User.findById(req.params.id);
    const user2 = await User.findById(req.user._id);
    console.log(user2)
    if (!user1) {
        next(new errorResponse(`User not found with given id`, 401));
    }
    if (!user2.blocklist.includes(req.params.id)) {
        next(new errorResponse(`User not blocked`, 401));
    }
    user2.blocklist.remove(req.params.id);
    await user1.save();
    await user2.save();
    res.status(200).send({ success: true, data: user2 });
})

