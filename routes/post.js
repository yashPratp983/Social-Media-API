const express=require('express');
const {createNewPost,deletePost,like,unlike,comment,getPostDetails,getAllPosts}=require('../controller/post');
const {protect}=require('../middleware/auth')

const router=express.Router();

router.route('/').post(protect,createNewPost)
router.route('/:id').delete(protect,deletePost).get(protect,getPostDetails)
router.route('/like/:id').put(protect,like);
router.route('/unlike/:id').put(protect,unlike);
router.route('/comment/:id').put(protect,comment);
router.route('/all').get(protect,getAllPosts);

module.exports=router;