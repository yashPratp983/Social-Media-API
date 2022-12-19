const mongoose=require('mongoose');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken')

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please add a name"],
        unique:true,
        trim:true,
        maxlength:[50,'Name can not be more than 50 characters']
    },
    email:{
        type:String,
        required:[true,"Please add an email"],
        unique:true,
        match:[
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password:{
        type:String,
        required:[true,"Please add a password"],
        minlength:[6,'Password must be of length more than 6'],
        select:false
    },
    role:{
        type:String,
        enum:['user'],
        default:'user'
    },
    following:[{
        type:mongoose.Schema.ObjectId,
    }],
    followers:[{
        type:mongoose.Schema.ObjectId,
    }]
})

userSchema.pre('save',async function(next){
    if(!this.isModified('password')){
        next();
    }
    const salt=bcrypt.genSaltSync(10);
    this.password=await bcrypt.hash(this.password,salt);
})


userSchema.methods.matchPassword=function(password){
    return bcrypt.compare(password,this.password);
}

userSchema.methods.getSignedJwtToken=function(){
    return jwt.sign({id:this._id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRE
    });
}

module.exports=mongoose.model('Users',userSchema);