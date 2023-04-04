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
    let redisUsers = await client.lRange('users', 0, -1);
    redisUsers = redisUsers.map(user => JSON.parse(user));
    // Get users from MongoDB
    let users = await User.find().select('+password');


    // Map users to new array
    let users1 = users.map(user => {
        return {
            _id: user._id,
            name: user.name,
            profilePic: user.profilePic,
            followers: user.followers.length,
            following: user.following.length,
            bio: user.bio
        }
    });

    let users2 = users.map(user => {
        return {
            _id: user._id,
            name: user.name,
            profilePic: user.profilePic,
            followers: user.followers,
            following: user.following,
            bio: user.bio,
            email: user.email,
            password: user.password
        }
    });


    // Save users to Redis if they are  not already there
    users2.forEach(async (user) => {
        try {
            let c = 0;
            redisUsers.forEach(async (redisUser) => {
                if (redisUser._id == user._id) {
                    c++;
                }
            })
            if (c == 0) {
                await client.rPush('users', JSON.stringify(user));
            }
        } catch (err) {
            console.log(err, "err");
        }
    });



    // Send response to client
    res.status(200).send({ success: true, data: users1 });

});


exports.getAUser = asyncHandler(async (req, res, next) => {

    let redisUsers = await client.lRange('users', 0, -1);

    redisUsers = redisUsers.map(user => JSON.parse(user));



    let searchedUser = redisUsers.find(user => user._id == req.params.id);

    if (searchedUser) {
        console.log("from redis");
        delete searchedUser.password;
        delete searchedUser.email;
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

    const redisData = {
        _id: user._id,
        name: user.name,
        profilePic: user.profilePic,
        followers: user.followers,
        following: user.following,
        bio: user.bio,
        email: user.email,
        password: user.password
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
    const length = await client.lLen('users');
    if (length == 0) {
        const users = await User.find().select('+password');
        users.forEach(async (user) => {
            let user1 = {
                _id: user._id,
                name: user.name,
                profilePic: user.profilePic,
                followers: user.followers,
                following: user.following,
                bio: user.bio,
                email: user.email,
                password: user.password
            }
            await client.rPush('users', JSON.stringify(user1));
        })
    }
    else {

        let redisUsers = await client.lRange('users', 0, -1);
        redisUsers = redisUsers.map(user => JSON.parse(user));

        let user2 = redisUsers.find(user => user._id == req.user._id);
        let user3 = redisUsers.find(user => user._id == user1._id);



        if (!user2) {
            console.log("not found")
            user2 = {
                _id: req.user._id,
                name: req.user.name,
                profilePic: req.user.profilePic,
                followers: req.user.followers,
                following: req.user.following,
                bio: req.user.bio,
                email: req.user.email,
            }

            await client.rPush('users', JSON.stringify(user2));
        }

        if (!user3) {
            console.log("not found")
            user3 = {
                _id: user1._id,
                name: user1.name,
                profilePic: user1.profilePic,
                followers: user1.followers,
                following: user1.following,
                bio: user1.bio,
                password: user1.password
            }
            await client.rPush('users', JSON.stringify(user3));
        }

        user2.following = req.user.following;
        user3.followers = user1.followers;

        redisUsers.forEach(async (user) => {
            if (user._id == user2._id) {
                user = user2;
            }
            if (user._id == user3._id) {
                user = user3;
            }
        })

        await client.del('users');
        redisUsers.forEach(async (user) => {
            await client.rPush('users', JSON.stringify(user));
        })
    }

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

    const length = await client.lLen('users');

    if (length == 0) {
        const users = await User.find().select('+password');
        users.forEach(async (use) => {
            let user1 = { _id: use._id, name: use.name, profilePic: use.profilePic, followers: use.followers, following: use.following, bio: use.bio, email: use.email, password: use.password }
            await client.rPush('users', JSON.stringify(user1));
        })
    }
    else {
        const redisUsers = await client.lRange('users', 0, -1);

        redisUsers.forEach(async (use) => {
            use = JSON.parse(use);
            if (use._id == user._id) {
                console.log("found")
                // use = { _id: user._id, name: user.name, profilePic: user.profilePic, followers: user.followers, following: user.following, bio: user.bio, email: user.email, password: use.password }
            }
        })

        await client.del('users');
        redisUsers.forEach(async (use) => {
            await client.rPush('users', JSON.stringify(use));
        }
        )

    }

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

