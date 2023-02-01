const asyncHandler = require('../middleware/asyncHandler');
const Post = require('../modals/posts');
const message = require('../modals/message');
const errorResponse = require('../utils/ErrorHandler')
const User = require('../modals/users');

exports.getMessage = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new errorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    const messageSent = await message.find({ sender: req.user.id, receiver: req.params.id });
    const messageReceived = await message.find({ sender: req.params.id, receiver: req.user.id });

    res.status(200).json({
        success: true,
        data: { messageSent, messageReceived }
    });
});

exports.postMessage = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new errorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    const mess = await message.create({
        message: req.body.message,
        sender: req.user.id,
        receiver: req.params.id
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