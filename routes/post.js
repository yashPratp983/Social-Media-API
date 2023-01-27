const express = require('express');
const { createNewPost,
    deletePost,
    like,
    unlike,
    comment,
    getPostDetails,
    updatePost,
    deleteComment,
    editComment,
    uploadImages,
    uploadVideo,
    deleteImage,
    deleteVideo
} = require('../controller/post');
const { protect } = require('../middleware/auth')

const router = express.Router();

router.route('/').post(protect, createNewPost)
router.route('/:id').delete(protect, deletePost).get(protect, getPostDetails)
router.route('/images/:id').post(protect, uploadImages).delete(protect, deleteImage)
router.route('/videos/:id').post(protect, uploadVideo).delete(protect, deleteVideo)
router.route('/like/:id').put(protect, like);
router.route('/unlike/:id').put(protect, unlike);
router.route('/comment/:postId/:commentId').put(protect, editComment).delete(protect, deleteComment);
router.route('/comment/:postId').put(protect, comment)
router.route('/update/:id').put(protect, updatePost);


module.exports = router;