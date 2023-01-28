const express = require('express');
const router = express.Router();
const { protect, authorisation } = require('../middleware/auth');
const { createNewPost, deletePost, like, unlike, comment, getPostDetails, getAllPosts, getEveryPosts } = require('../controller/post');

router.route('/profile/:id').get(protect, getAllPosts);
router.route('/every').get(protect, getEveryPosts);

module.exports = router;