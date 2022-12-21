const mongoose=require('mongoose');

const postSchema=new mongoose.Schema({
    title:{
        type:String,
        required:[true,'Please add a title'],
        trim:true,
        maxlength:100
    },
    description:{
        type:String,
        required:[true,"Please add description"]
    },
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'Users',
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    }},{
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
)

postSchema.pre('remove',async function(next){
    await this.model('Comments').deleteMany({post:this._id});
    await this.model('Likes').deleteMany({post:this._id});
    next();
})

postSchema.virtual('comments',{
    ref:'Comments',
    localField:'_id',
    foreignField:'post',
    justOne:false
})

postSchema.virtual('likes',{
    ref:'Likes',
    localField:'_id',
    foreignField:'post',
    justOne:false
})

module.exports=mongoose.model('Posts',postSchema);