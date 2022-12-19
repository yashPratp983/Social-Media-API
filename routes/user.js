const express=require('express');
const router=express.Router();

const {login,register}=require('../controller/auth');
const {follow,unfollow,getProfile}=require('../controller/user');
const {protect,authorisation}=require('../middleware/auth');


router.get('/',protect,getProfile);
router.post('/login',login);
router.post('/register',register);
router.route('/follow/:id').put(protect,follow)
router.route('/unfollow/:id').put(protect,unfollow)


module.exports=router;