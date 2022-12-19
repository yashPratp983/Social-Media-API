const errorResponse = require('../utils/ErrorHandler');
const errorHandler=(err,req,res,next)=>{
let error={...err};
error.message=err.message;
error=new errorResponse(error.message,error.statusCode);
res.status(error.statusCode|| 500).send({status:false,error:error.message|| 'Server Error'});

}

module.exports=errorHandler;