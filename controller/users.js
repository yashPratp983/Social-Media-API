const User = require('../modals/users');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorHandler');
const emailValidator = require('email-validator');

exports.getUsers=asyncHandler(async(req,res,next)=>{
    if(req.params.id){
        const user=await User.findById(req.params.id);

        if(!user){
          return next(new ErrorResponse(`No user exist with id ${req.params.id}`,401));
        }
        res.status(200).send({success:true,data:user});
    }
    else{
        const user=await User.find();
        res.status(200).send({success:true,data:user});
    }
    
})

exports.createUser=asyncHandler(async(req,res,next)=>{
    const {name,email,password,role}=req.body;

    if(!emailValidator.validate(email)){
        return next(new ErrorResponse('Please provide a valid email',400));
    }
    
    const user=await User.create({name,email,password,role});

    res.status(200).send({success:true,data:user});
})

exports.updateUser=asyncHandler(async(req,res,next)=>{
    let user=await User.findById(req.params.id);

    if(!user){
        return next(new ErrorResponse(`No user exist with id ${req.params.id}`,401));
    }

    user=await User.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true});

    res.status(200).send({success:true,data:user});
})

exports.deleteUser=asyncHandler(async(req,res,next)=>{
    const user=await User.findById(req.params.id);

    if(!user){
        return next(new ErrorResponse(`No user exist with id ${req.params.id}`,401));
    }

    if(user.role==='admin'){
        return next(new ErrorResponse(`Admin can't be deleted`,401));
    }

    await user.remove();

    res.status(200).send({success:true,data:{}});
})

