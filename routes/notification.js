const express = require('express');
const router = express.Router();

const { protect, authorisation } = require('../middleware/auth');
const { createNotification, getNotifications, deleteNotification, acceptNotification, deleteNotification2 } = require('../controller/notification');

router.route('/').post(protect, createNotification).get(protect, getNotifications);
router.route('/delete/:id').put(protect, deleteNotification2);
router.route('/accept/:id').put(protect, acceptNotification);
router.route('/reject/:id').put(protect, deleteNotification);

module.exports = router;