const express = require('express');
const router = express.Router();

const { protect, authorisation } = require('../middleware/auth');

const { getMessageNotification, deleteMessageNotification } = require('../controller/messageNotification')


router.route('/').get(protect, getMessageNotification)
router.route('/:id').delete(protect, deleteMessageNotification)

module.exports = router