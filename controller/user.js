const User = require('../modals/users');
const errorResponse = require('../utils/ErrorHandler');
const asyncHandler = require('../middleware/asyncHandler')
const cloudinary = require('../utils/cloudinary');
const Notifications = require('../modals/Notificaton');
const client = require('../config/redis');


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

    let redisUsers = await client.lRange('users', 0, -1);
    redisUsers = redisUsers.map(user => JSON.parse(user));

    let user2 = redisUsers.find(user => user._id == req.user._id);
    let user3 = redisUsers.find(user => user._id == user1._id);

    if (!user2) {
        user2 = req.user.map(user => {
            return {
                _id: user._id,
                name: user.name,
                profilePic: user.profilePic,
                followers: user.followers,
                following: user.following,
                bio: user.bio,
                email: user.email,
            }
        });
        await client.rPush('users', JSON.stringify(user2));
    }

    if (!user3) {
        user3 = user1.map(user => {
            return {
                _id: user._id,
                name: user.name,
                profilePic: user.profilePic,
                followers: user.followers,
                following: user.following,
                bio: user.bio,
                password: user.password
            }
        });
        await client.rPush('users', JSON.stringify(user3));
    }

    user2.following = req.user.following;
    user3.followers = user1.followers;

    redisUsers.forEach(async (user) => {
        if (user._id == user2._id) {
            await client.lRem('users', 0, JSON.stringify(user));
            await client.rPush('users', JSON.stringify(user2));
        }
        if (user._id == user3._id) {
            await client.lRem('users', 0, JSON.stringify(user));
            await client.rPush('users', JSON.stringify(user3));
        }
    })


    res.status(202).send({ success: true, data: req.user });
})

exports.getAllUsers = asyncHandler(async (req, res, next) => {
    const length = await client.lLen('users');
    if (length > 0) {
        let redisUsers = await client.lRange('users', 0, -1);
        redisUsers = redisUsers.map(user => JSON.parse(user));
        let users1 = redisUsers.map(user => {
            return {
                _id: user._id,
                name: user.name,
                profilePic: user.profilePic,
                followers: user.followers.length,
                following: user.following.length,
                bio: user.bio
            }
        })
        return res.status(200).send({ success: true, data: users1 });
    }
    else {
        let users = await User.find().select('+password');
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

        users.forEach(async (use) => {
            let user2 = { _id: use._id, name: use.name, profilePic: use.profilePic, followers: use.followers, following: use.following, bio: use.bio, email: use.email, password: use.password, blocklist: use.blocklist, isVerified: use.isVerified, createdAt: use.createdAt }
            if (use.resetPasswordToken) {
                user2 = { ...user2, resetPasswordToken: use.resetPasswordToken, resetPasswordExpire: use.resetPasswordExpire }
            }
            if (use.verificationToken) {
                user2 = { ...user2, verificationToken: use.verificationToken, verificationTokenExpire: use.verificationTokenExpire }
            }
            if (use.unverifiedEmail) {
                user2 = { ...user2, unverifiedEmail: use.unverifiedEmail }
            }
            await client.rPush('users', JSON.stringify(user2));
        })



        res.status(200).send({ success: true, data: users1 });
    }
});


exports.getAUser = asyncHandler(async (req, res, next) => {

    let redisUsers = await client.lRange('users', 0, -1);

    redisUsers = redisUsers.map(user => JSON.parse(user));



    let searchedUser = redisUsers.find(user => user._id == req.params.id);

    if (searchedUser) {
        console.log("from redis");
        delete searchedUser.password;
        delete searchedUser.email;
        delete searchedUser.blocklist
        searchedUser.followers = searchedUser.followers.length;
        searchedUser.following = searchedUser.following.length;
        return res.status(200).send({ success: true, data: searchedUser });
    }

    const user = await User.findById(req.params.id).select('+password');

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

    const redisData = { _id: user._id, name: user.name, profilePic: user.profilePic, followers: user.followers, following: user.following, bio: user.bio, email: user.email, password: user.password, blocklist: user.blocklist, isVerified: user.isVerified, createdAt: user.createdAt }

    if (user.resetPasswordToken) {
        redisData = { ...redisData, resetPasswordToken: user.resetPasswordToken, resetPasswordExpire: user.resetPasswordExpire }
    }

    if (user.verificationToken) {
        redisData = { ...redisData, verificationToken: user.verificationToken, verificationTokenExpire: user, verificationTokenExpire }
    }
    if (user.unverifiedEmail) {
        redisData = { ...redisData, unverifiedEmail: user.unverifiedEmail }
    }
    await client.rPush('users', JSON.stringify(redisData));

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

    const users = await User.find().select('+password');
    await client.del('users');
    users.forEach(async (use) => {
        let user2 = { _id: use._id, name: use.name, profilePic: use.profilePic, followers: use.followers, following: use.following, bio: use.bio, email: use.email, password: use.password, blocklist: use.blocklist, isVerified: use.isVerified, createdAt: use.createdAt }
        if (use.resetPasswordToken) {
            user2 = { ...user2, resetPasswordToken: use.resetPasswordToken, resetPasswordExpire: use.resetPasswordExpire }
        }
        if (use.verificationToken) {
            user2 = { ...user2, verificationToken: use.verificationToken, verificationTokenExpire: use.verificationTokenExpire }
        }
        if (use.unverifiedEmail) {
            user2 = { ...user2, unverifiedEmail: use.unverifiedEmail }
        }
        await client.rPush('users', JSON.stringify(user2));
    })

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

    const users = await User.find().select('+password');
    await client.del('users');
    users.forEach(async (use) => {
        let user2 = { _id: use._id, name: use.name, profilePic: use.profilePic, followers: use.followers, following: use.following, bio: use.bio, email: use.email, password: use.password, blocklist: use.blocklist, isVerified: use.isVerified, createdAt: use.createdAt }
        if (use.resetPasswordToken) {
            user2 = { ...user2, resetPasswordToken: use.resetPasswordToken, resetPasswordExpire: use.resetPasswordExpire }
        }
        if (use.verificationToken) {
            user2 = { ...user2, verificationToken: use.verificationToken, verificationTokenExpire: use.verificationTokenExpire }
        }
        if (use.unverifiedEmail) {
            user2 = { ...user2, unverifiedEmail: use.unverifiedEmail }
        }
        await client.rPush('users', JSON.stringify(user2));
    })
    delete req.user.password;
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

    await client.del('users');

    const users = await User.find().select('+password');
    users.forEach(async (use) => {
        let user2 = { _id: use._id, name: use.name, profilePic: use.profilePic, followers: use.followers, following: use.following, bio: use.bio, email: use.email, password: use.password, blocklist: use.blocklist, isVerified: use.isVerified, createdAt: use.createdAt }
        if (use.resetPasswordToken) {
            user2 = { ...user2, resetPasswordToken: use.resetPasswordToken, resetPasswordExpire: use.resetPasswordExpire }
        }
        if (use.verificationToken) {
            user2 = { ...user2, verificationToken: use.verificationToken, verificationTokenExpire: use.verificationTokenExpire }
        }
        if (use.unverifiedEmail) {
            user2 = { ...user2, unverifiedEmail: use.unverifiedEmail }
        }
        await client.rPush('users', JSON.stringify(user2));
    })

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

    await client.del('users');

    const users = await User.find().select('+password');
    users.forEach(async (use) => {
        let user2 = { _id: use._id, name: use.name, profilePic: use.profilePic, followers: use.followers, following: use.following, bio: use.bio, email: use.email, password: use.password, blocklist: use.blocklist, isVerified: use.isVerified, createdAt: use.createdAt }
        if (use.resetPasswordToken) {
            user2 = { ...user2, resetPasswordToken: use.resetPasswordToken, resetPasswordExpire: use.resetPasswordExpire }
        }
        if (use.verificationToken) {
            user2 = { ...user2, verificationToken: use.verificationToken, verificationTokenExpire: use.verificationTokenExpire }
        }
        if (use.unverifiedEmail) {
            user2 = { ...user2, unverifiedEmail: use.unverifiedEmail }
        }
        await client.rPush('users', JSON.stringify(user2));
    })


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

    await client.del('users');
    const users = await User.find().select('+password');
    users.forEach(async (use) => {
        let user2 = { _id: use._id, name: use.name, profilePic: use.profilePic, followers: use.followers, following: use.following, bio: use.bio, email: use.email, password: use.password, blocklist: use.blocklist, isVerified: use.isVerified, createdAt: use.createdAt }
        if (use.resetPasswordToken) {
            user2 = { ...user2, resetPasswordToken: use.resetPasswordToken, resetPasswordExpire: use.resetPasswordExpire }
        }
        if (use.verificationToken) {
            user2 = { ...user2, verificationToken: use.verificationToken, verificationTokenExpire: use.verificationTokenExpire }
        }
        if (use.unverifiedEmail) {
            user2 = { ...user2, unverifiedEmail: use.unverifiedEmail }
        }
        await client.rPush('users', JSON.stringify(user2));
    })

    res.status(200).send({ success: true, data: user });
})

exports.getFollows = asyncHandler(async (req, res, next) => {
    const length = await client.lLen('users');
    let users = [];
    const redisUsers = await client.lRange('users', 0, -1);
    redisUsers.forEach((user) => {
        users.push(JSON.parse(user));
    })

    const use = users.find((user) => user._id == req.params.id);

    if (length > 0 && use) {
        console.log(use)
        if (!(use.followers.includes(String(req.user._id))) && req.user._id != req.params.id) {

            return next(new errorResponse(`Not authorised for the information`, 401));
        }

        let follower = [];
        let following = [];

        for (let i = 0; i < use.followers.length; i++) {
            let user = users.find((user) => user._id == use.followers[i]);
            delete user.password;
            delete user.blocklist;
            delete user.isVerified;
            delete user.createdAt;
            delete user.verificationToken;
            delete user.verificationTokenExpire;
            delete user.unverifiedEmail;
            delete user.resetPasswordToken;
            delete user.resetPasswordExpire;
            follower.push(user);
        }

        for (let i = 0; i < use.following.length; i++) {
            let user = users.find((user) => user._id == use.following[i]);
            delete user.password;
            delete user.blocklist;
            delete user.isVerified;
            delete user.createdAt;
            delete user.verificationToken;
            delete user.verificationTokenExpire;
            delete user.unverifiedEmail;
            delete user.resetPasswordToken;
            delete user.resetPasswordExpire;
            following.push(user);
        }


        return res.status(200).send({ success: true, data: { followers: follower, following: following } });

    }
    else {
        console.log("here")
        const user = await User.findById(req.params.id);
        console.log(user.followers.includes(req.params.id))
        if (!user) {
            return next(new errorResponse(`User not found with given id`, 401));
        }

        if (!(user.followers.includes(req.user._id)) && req.user._id != req.params.id) {
            return next(new errorResponse(`Not authorised for the information`, 401));
        }

        let followers = await User.find({ _id: { $in: user.followers } });

        let following = await User.find({ _id: { $in: user.following } });

        await client.del('users');
        const users1 = await User.find().select('+password');
        users1.forEach(async (use) => {
            let user2 = { _id: use._id, name: use.name, profilePic: use.profilePic, followers: use.followers, following: use.following, bio: use.bio, email: use.email, password: use.password, blocklist: use.blocklist, isVerified: use.isVerified, createdAt: use.createdAt }
            if (use.resetPasswordToken) {
                user2 = { ...user2, resetPasswordToken: use.resetPasswordToken, resetPasswordExpire: use.resetPasswordExpire }
            }
            if (use.verificationToken) {
                user2 = { ...user2, verificationToken: use.verificationToken, verificationTokenExpire: use.verificationTokenExpire }
            }
            if (use.unverifiedEmail) {
                user2 = { ...user2, unverifiedEmail: use.unverifiedEmail }
            }
            await client.rPush('users', JSON.stringify(user2));
        })

        followers.forEach((followe) => {
            delete followe.password;
            delete followe.blocklist;
            delete followe.createdAt;
            delete followe.isVerified;
            if (followe.resetPasswordToken) {
                delete followe.resetPasswordToken;
                delete followe.resetPasswordExpire
            }
            if (followe.verificationToken) {
                delete followe.verificationToken;
                delete followe.verificationTokenExpire
            }
            if (followe.unverifiedEmail) {
                delete followe.unverifiedEmail;
            }

        })

        following.forEach((follow) => {
            delete follow.password;
            delete follow.blocklist;
            delete follow.createdAt;
            delete follow.isVerified;
            if (follow.resetPasswordToken) {
                delete follow.resetPasswordToken;
                delete follow.resetPasswordExpire
            }
            if (follow.verificationToken) {
                delete follow.verificationToken;
                delete follow.verificationTokenExpire
            }
            if (follow.unverifiedEmail) {
                delete follow.unverifiedEmail;
            }
        })

        res.status(200).send({ success: true, data: { followers: followers, following: following } });
    }
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

    await client.del('users');
    const users = await User.find().select('+password');
    users.forEach(async (use) => {
        let user2 = { _id: use._id, name: use.name, profilePic: use.profilePic, followers: use.followers, following: use.following, bio: use.bio, email: use.email, password: use.password, blocklist: use.blocklist, isVerified: use.isVerified, createdAt: use.createdAt }
        if (use.resetPasswordToken) {
            user2 = { ...user2, resetPasswordToken: use.resetPasswordToken, resetPasswordExpire: use.resetPasswordExpire }
        }
        if (use.verificationToken) {
            user2 = { ...user2, verificationToken: use.verificationToken, verificationTokenExpire: use.verificationTokenExpire }
        }
        await client.rPush('users', JSON.stringify(user2));
    })

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

    const users = await User.find().select('+password');
    users.forEach(async (use) => {
        let user2 = { _id: use._id, name: use.name, profilePic: use.profilePic, followers: use.followers, following: use.following, bio: use.bio, email: use.email, password: use.password, blocklist: use.blocklist, isVerified: use.isVerified, createdAt: use.createdAt }
        if (use.resetPasswordToken) {
            user2 = { ...user2, resetPasswordToken: use.resetPasswordToken, resetPasswordExpire: use.resetPasswordExpire }
        }
        if (use.verificationToken) {
            user2 = { ...user2, verificationToken: use.verificationToken, verificationTokenExpire: use.verificationTokenExpire }
        }
        await client.rPush('users', JSON.stringify(user2));
    })

    res.status(200).send({ success: true, data: user2 });
})

