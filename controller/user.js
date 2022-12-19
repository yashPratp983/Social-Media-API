const User=require('../modals/users');
const ErrorHandler=require('../utils/ErrorHandler');
const asyncHandler=require('../middleware/asyncHandler')

exports.follow=asyncHandler(async (req,res,next)=>{
const user1=await User.findOne({_id:req.params.id});

if(!user1){
next(`User not found with id ${req.params.id}`,401);
}
if(!user1.followers.includes(req.user._id)){
user1.followers.push(req.user._id);
}
if(!req.user.following.includes(user1._id)){
req.user.following.push(user1._id);
}
user1.save();
req.user.save();

res.status(202).send({success:true,data:req.user});
})

exports.unfollow=asyncHandler(async (req,res,next)=>{
    const user1=await User.findOne({_id:req.params.id});
    
    if(!user1){
    next(`User not found with id ${req.params.id}`,401);
    }
    if(user1.followers.includes(req.user._id)){
    user1.followers.remove(req.user._id);
    }
    if(req.user.following.includes(user1._id)){
    req.user.following.remove(user1._id);
    }
    user1.save();
    req.user.save();
    
    res.status(202).send({success:true,data:req.user});
})

exports.getProfile=asyncHandler(async (req,res,next)=>{
    const followingLength=req.user.following.length;
    const followersLength=req.user.followers.length;

    res.status(200).send({success:true,data:{name:req.user.name,following:followingLength,followers:followersLength}})
})