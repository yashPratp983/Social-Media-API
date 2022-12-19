const User=require('../modals/users');
const mongoose=require('mongoose');
const errorResponse=require('../utils/ErrorHandler');
const asyncHandler=require('../middleware/asyncHandler');
const bcrypt=require('bcrypt');
const jwt=require('json-web-token');

exports.login=asyncHandler(async (req,res,next)=>{
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