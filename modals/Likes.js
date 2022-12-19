const mongoose=require('mongoose');

const likes=new mongoose.Schema({
    likes:[{
        type:mongoose.Schema.ObjectId
    }],
    post:[{
        type:mongoose.Schema.ObjectId,
        ref:'Posts',
        required:true
    }]
})

module.exports=mongoose.model('Likes',likes);