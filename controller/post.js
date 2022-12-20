const asyncHandler = require('../middleware/asyncHandler');
const Post=require('../modals/posts');
const Likes=require('../modals/Likes')
const Comment=require('../modals/Comment')
const errorResponse=require('../utils/ErrorHandler')

exports.createNewPost=asyncHandler(async(req,res,next)=>{
    req.body.user=req.user._id;
    const newPost=await Post.create(req.body);
    const postDetails=await Likes.create({post:newPost._id})
    const comments=await Comment.create({post:newPost._id})
    res.status(200).send({success:true,data:newPost})
})

exports.updatePost=asyncHandler(async(req,res,next)=>{
    const updatePost=await Post.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true});

    if(!updatePost){
        return next(new errorResponse(`Post not found with id ${req.params.id}`,401));
    }

    if(!(updatePost.user!=req.user._id)){
        return next(new errorResponse('Not authorized to update the post',404));
    }

    res.status(200).send({success:true,data:updatePost})
})

exports.deletePost=asyncHandler(async(req,res,next)=>{
    const delpost=await Post.findById(req.params.id);

    if(!delpost){
        return next(new errorResponse(`Post not found with id ${req.params.id}`,401));
    }

    if(!(delpost.user!=req.user._id)){
        return next(new errorResponse('Not authorized to delete the post',404));
    }
    delpost.remove();

    res.status(200).send({success:true,data:delpost})
})

exports.like=asyncHandler(async(req,res,next)=>{
    const details=await Likes.findOne({post:req.params.id});

    if(!details){
        next(new errorResponse(`No post found with id ${req.params.id}`,401));
    }

    if(!details.likes.includes(req.user._id)){
        details.likes.push(req.user._id);
    }
    details.save();

    res.status(200).send({success:true,data:{like:details.likes.length}});
})

exports.unlike=asyncHandler(async(req,res,next)=>{
    const details=await Likes.findOne({post:req.params.id});

    if(!details){
        next(new errorResponse(`No post found with id ${req.params.id}`,401));
    }

    if(details.likes.includes(req.user._id)){
        details.likes.remove(req.user._id);
    }
    details.save();

    res.status(200).send({success:true,data:{like:details.likes.length}});
})

exports.comment=asyncHandler(async(req,res,next)=>{
    const post=await Post.findById(req.params.postId);

    if(!post){
        next(new errorResponse(`No post found with id ${req.params.id}`,401));
    }
    const comment=await Comment.findOne({post:req.params.postId});
    comment.content.push({user:req.user._id,comment:req.body.comment});
    comment.save();

    res.status(200).send({success:true,data:comment});
})

exports.editComment=asyncHandler(async(req,res,next)=>{
    const comment=await Comment.findOne({post:req.params.postId});

    if(!comment){
        next(new errorResponse(`No post found with id ${req.params.id}`,401));
    }

    const commentIndex=comment.content.findIndex((item)=>item._id==req.params.commentId);

    if(commentIndex==-1){
        next(new errorResponse(`No comments found with id ${req.params.commentId}`,401));
    }
    
    if(comment.content[commentIndex].user!=req.user.id){
        next(new errorResponse(`Not authorized to edit the comment`,401));
    }

    comment.content[commentIndex].comment=req.body.comment;
    comment.save();

    res.status(200).send({success:true,data:comment});
})

exports.deleteComment=asyncHandler(async(req,res,next)=>{
    const comment=await Comment.findOne({post:req.params.postId});

    if(!comment){
       return next(new errorResponse(`No post found with id ${req.params.id}`,401));
    }

    const commentIndex=comment.content.findIndex((item)=>item._id==req.params.commentId);

    if(commentIndex==-1){
       return next(new errorResponse(`No comments found with id ${req.params.commentId}`,401));
    }
    
    if(comment.content[commentIndex].user!=req.user.id){
       return next(new errorResponse(`Not authorized to delete the comment`,401));
    }

    comment.content.splice(commentIndex,1);
    comment.save();

    res.status(200).send({success:true,data:comment});
})

exports.getPostDetails=asyncHandler(async(req,res,next)=>{
    let post=await Post.findById(req.params.id);

    if(!post){
        next(new errorResponse(`No post found with id ${req.params.id}`,401));
    }

    post=Post.findById(req.params.id).populate([
        {path:'comments',select:'content'},
        {path:'likes',select:'likes'}

    ]);

    let data=await post;
   
    console.log(data);
    const com=data.comments.map((item)=>{
        return item.content.map((item)=>{
            return item.comment;
        })
    })
    
    const likesLength=data.likes.map((item)=>{
        return item.likes.length;
    })

    console.log(likesLength)

    res.status(200).send({success:true,data:{title:data.title,description:data.description,created_at:data.createdAt,comments:com,likes:likesLength}});
})

exports.getAllPosts=asyncHandler(async (req,res,next)=>{
    let posts=await Post.find({user:req.user.id}).populate([
        {path:'comments',select:'content'},
        {path:'likes',select:'likes'}

    ]);

    const data=posts.map((item)=>{
        return {
            title:item.title,
            description:item.description,
            created_at:item.createdAt,
            comments:item.comments.map((item)=>{
                return item.content.map((item)=>{
                    return item.comment;
                })
            }),
            likes:item.likes.map((item)=>{
                return item.likes.length;
            })
        }
    })

    
    res.status(200).send({success:true,data});

})
