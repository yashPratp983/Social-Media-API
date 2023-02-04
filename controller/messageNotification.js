const messageNotification = require('../modals/messageNotification');
const asyncHandler = require('../middleware/asyncHandler');

exports.getMessageNotification = asyncHandler(async (req, res, next) => {
    const messageNotification1 = await messageNotification.find({ receiver: req.user._id });
    res.status(200).json({
        success: true,
        data: messageNotification1
    });
});

exports.deleteMessageNotification = asyncHandler(async (req, res, next) => {
    const messageNotification1 = await messageNotification.deleteMany({ receiver: req.user._id, sender: req.params.id });

    res.status(200).json({
        success: true,
        data: {}
    });
});