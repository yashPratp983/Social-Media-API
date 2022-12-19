const express=require('express');
const router=express.Router();
const {protect,authorisation}=require('../middleware/auth');
const {createNewPost,deletePost,like,unlike,comment,getPostDetails,getAllPosts}=require('../controller/post');

router.route('/').get(protect,getAllPosts);

module.exports=router;