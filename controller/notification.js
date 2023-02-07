const User = require('../modals/users');
const ErrorHandler = require('../utils/ErrorHandler');
const asyncHandler = require('../middleware/asyncHandler')

const Notifications = require('../modals/Notificaton');

exports.createNotification = asyncHandler(async (req, res, next) => {
    let notification = await Notifications.findOne({
        user: req.user._id,
    })

    let notification2 = await Notifications.findOne({
        user: req.body.user,
    })

    if (!notification) {
        notification = await Notifications.create({
            user: req.user._id,
            status: [req.body.user],
            request: []
        })
    }
    else {
        if (!notification.status.includes(req.body.user)) {
            notification.status.push(req.body.user);
        }
        await notification.save();

    }

    if (!notification2) {
        notification2 = await Notifications.create({
            user: req.body.user,
            request: [req.user._id],
            status: []
        })

    }
    else {
        if (!notification2.request.includes(req.user._id)) {
            notification2.request.push(req.user._id);
        }
        await notification2.save();
    }
    res.status(200).send({ success: true, data: { notification, notification2 } });
})

exports.getNotifications = asyncHandler(async (req, res, next) => {
    let notification = await Notifications.findOne({
        user: req.user._id,
    })
    if (!notification) {
        const newNotification = await Notifications.create({
            user: req.user._id,
            request: [],
            status: []
        })
        res.status(200).send({ success: true, data: newNotification });
    }
    else {
        res.status(200).send({ success: true, data: notification });
    }

})

exports.deleteNotification = asyncHandler(async (req, res, next) => {
    const notification = await Notifications.findOne({
        user: req.user._id,
    })
    if (!notification) {
        next(new errorResponse(`Notification not found with id ${req.user._id}`, 401));
    }
    notification.request.remove(req.params.id);
    await notification.save();

    const notification2 = await Notifications.findOne({
        user: req.params.id,
    })
    if (!notification2) {
        next(new errorResponse(`Notification not found with id ${req.params.id}`, 401));
    }

    notification2.status.remove(req.user._id);
    await notification2.save();

    res.status(200).send({ success: true, data: { notification, notification2 } });

})

exports.acceptNotification = asyncHandler(async (req, res, next) => {
    let notification = await Notifications.findOne({
        user: req.user._id,
    })
    if (!notification) {
        next(new errorResponse(`Notification not found with id ${req.user._id}`, 401));
    }

    let notification2 = await Notifications.findOne({
        user: req.params.id,
    })

    if (!notification2) {
        next(new errorResponse(`Notification not found with id ${req.params.id}`, 401));
    }
    if (notification.request.includes(req.params.id) && notification2.status.includes(req.user._id)) {
        notification.request.remove(req.params.id);
        notification2.status.remove(req.user._id);
        await notification.save();
        await notification2.save();

        const user1 = await User.findById(req.user._id);
        const user2 = await User.findById(req.params.id);

        if (!user1.followers.includes(req.params.id)) {
            user1.followers.push(req.params.id);
        }
        if (!user2.following.includes(req.user._id)) {
            user2.following.push(req.user._id);
        }
        await user1.save();
        await user2.save();
    }



    res.status(200).send({ success: true, data: { notification, notification2 } });

})

exports.deleteNotification2 = asyncHandler(async (req, res, next) => {
    const notification = await Notifications.findOne({
        user: req.params.id,
    })
    if (!notification) {
        next(new errorResponse(`Notification not found with id ${req.user._id}`, 401));
    }
    notification.request.remove(req.user._id);
    await notification.save();

    const notification2 = await Notifications.findOne({
        user: req.user._id,
    })
    if (!notification2) {
        next(new errorResponse(`Notification not found with id ${req.params.id}`, 401));
    }

    notification2.status.remove(req.params.id);
    await notification2.save();

    res.status(200).send({ success: true, data: { notification, notification2 } });

})