const User=require('../modals/users');
const mongoose=require('mongoose');
const errorResponse=require('../utils/ErrorHandler');
const asyncHandler=require('../middleware/asyncHandler');
const bcrypt=require('bcrypt');
const jwt=require('json-web-token');
const sendEmail=require('../utils/emailHandler');
const crypto=require('crypto');
const emailValidator=require('email-validator');

exports.login=asyncHandler(async (req,res,next)=>{
    const {email,password}=req.body;

    if(!email || !password){
        return next(new errorResponse('Please provide an email and password',400));
    }

    const user=await User.findOne({email:req.body.email}).select('+password')

    if(!user){
       return next(new errorResponse('Invalid Input',404));
    }
    const matchPassword=await user.matchPassword(req.body.password);

    if(!matchPassword){
      return  next(new errorResponse('Invalid Input',404));
    }
    
    sendTokenResponse(user,200,res)
})

exports.register=asyncHandler(async (req,res,next)=>{
    const {name,email,password}=req.body;

    if(!emailValidator.validate(email)){
        return next(new errorResponse('Please provide a valid email',400));
    }
    
    const user=await User.create(req.body);

    sendTokenResponse(user,200,res);
})

const sendTokenResponse=(user,statusCode,res)=>{
const token=user.getSignedJwtToken();

const options={
    expires:new Date(
        Date.now()+process.env.JWT_COOKIE_EXPIRE*24*60*60*1000
    ),
    httpOnly:true,
}

res.status(statusCode).cookie('token',token,options).send({status:true,token:token});
}

exports.updatePassword=asyncHandler(async (req,res,next)=>{
    const user=await User.findOne({email:req.user.email}).select('+password');

    if(!user){
        return next(new errorResponse('Invalid Input',404));
    }

    const matchPassword=await user.matchPassword(req.body.currentPassword);
    if(!matchPassword){
        return next(new errorResponse('Invalid Input',404));
    }

    user.password=req.body.newPassword;
    await user.save();

    sendTokenResponse(user,200,res);
})

exports.updateUserCrediantials=asyncHandler(async (req,res,next)=>{
    if(req.body.password){
        return next(new errorResponse('Not authorized to change password',404));
    }

    const user=await User.findByIdAndUpdate(req.user._id,req.body,{new:true,runValidators:true});

    res.status(200).json({status:true,data:user});
})

exports.forgotPasswordToken=asyncHandler(async (req,res,next)=>{
    const user=await User.findOne({email:req.body.email});

    if(!user){
        return next(new errorResponse('User.not found with given email',404));
    }

    const resetToken=user.getResetPasswordToken();
    const resetUrl = `${req.protocol}://${req.get(
        'host',
      )}/api/v1/user/resetpassword/${resetToken}`;

    await user.save({validateBeforeSave:false});

    const options={
        email:req.body.email,
        subject:'Reset Password',
        message:`You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`
    }

    try {
        await sendEmail(options);
    
        res.status(200).json({ success: true, data: 'Email sent' });
      } catch (err) {
        console.log(err);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
    
        await user.save({ validateBeforeSave: false });
    
        return next(new errorResponse('Email could not be sent', 500));
      }

})

exports.resetPassword=asyncHandler(async (req,res,next)=>{
    const resetPasswordToken=crypto.createHash('sha256').update(req.params.resetToken).digest('hex');

    const user=await User.findOne({resetPasswordToken:resetPasswordToken,resetPasswordExpire:{$gt:Date.now()}});

    if(!user){
        return next(new errorResponse('Invalid Token',404));
    }

    user.password=req.body.password;
    user.resetPasswordToken=undefined;
    user.resetPasswordExpire=undefined;

    await user.save();

    sendTokenResponse(user,200,res);
})
