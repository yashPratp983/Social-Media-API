const express = require('express');
const router = express.Router();

const { protect, authorisation } = require('../middleware/auth');
const { getMessage, postMessage, deleteMessage } = require('../controller/message');

router.route('/:id').get(protect, getMessage).post(protect, postMessage);
router.route('/delete/:messageId').delete(protect, deleteMessage);

module.exports = router;