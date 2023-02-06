const asyncHandler = require('../middleware/asyncHandler');
const Post = require('../modals/posts');
const message = require('../modals/message');
const errorResponse = require('../utils/ErrorHandler')
const User = require('../modals/users');
const messageNotification = require('../modals/messageNotification');

exports.getMessage = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new errorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    const messageSent = await message.find({ sender: req.user.id, receiver: req.params.id });
    const messageReceived = await message.find({ sender: req.params.id, receiver: req.user.id });
    const allmessages = messageSent.concat(messageReceived);
    allmessages.sort((a, b) => {
        return a.date - b.date;
    });

    res.status(200).json({
        success: true,
        data: allmessages
    });
});

exports.postMessage = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new errorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    if (user.blocklist.includes(req.user.id)) {
        return next(new errorResponse(`User has blocked you`, 401));
    }

    const user2 = await User.findById(req.user._id);
    if (user2.blocklist.includes(req.params.id)) {
        return next(new errorResponse(`You have blocked this user`, 401));
    }



    const mess = await message.create({
        message: req.body.message,
        sender: req.user.id,
        receiver: req.params.id
    });

    const messageNotification1 = await messageNotification.create({
        message: req.body.message,
        sender: req.user.id,
        receiver: req.params.id,
        messageId: mess._id
    });

    res.status(200).json({
        success: true,
        data: mess
    });
});

exports.deleteMessage = asyncHandler(async (req, res, next) => {
    const mess = await message.findById(req.params.messageId);
    if (!mess) {
        return next(new errorResponse(`Message not found with id of ${req.params.messageId}`, 404));
    }

    if (mess.sender.toString() !== req.user.id) {
        return next(new errorResponse(`User not authorized to delete this message`, 401));
    }

    await mess.remove();

    res.status(200).json({
        success: true,
        data: {}
    });
});