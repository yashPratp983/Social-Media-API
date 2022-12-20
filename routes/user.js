const express=require('express');
const router=express.Router();

const {login,register,updatePassword,updateUserCrediantials,forgotPasswordToken,resetPassword}=require('../controller/auth');
const {follow,unfollow,getProfile}=require('../controller/user');
const {protect,authorisation}=require('../middleware/auth');


router.get('/',protect,getProfile);
router.put('/generateResetToken',forgotPasswordToken);
router.post('/resetPassword/:resetToken',resetPassword);
router.post('/login',login);
router.post('/register',register);
router.route('/follow/:id').put(protect,follow)
router.route('/unfollow/:id').put(protect,unfollow)
router.route('/update').put(protect,updateUserCrediantials)
router.route('/updatePassword').put(protect,updatePassword)


module.exports=router;