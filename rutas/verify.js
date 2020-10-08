const jwt = require("jsonwebtoken")
const secret = require("./secret")
const pool = require("../conexion");
const mm = require("music-metadata");
const bcrypt = require("bcryptjs")
const verify = {};


 verify.token =  (req,res,next)=>{
    const token = req.headers.token
    
  
 try {

    
    const decode = jwt.verify(token, secret);
    
    
    req.id = decode.id;
    next()
    
 } catch (error) {
     console.log(error);
     switch (error.name) {
         case "TokenExpiredError":
            res.json({token:"expired"})
             
             break;

             case "JsonWebTokenError":
                res.json({token:null})
                
                break;
     
         
     }
    
     
 }
    

}

verify.encript= async(password)=>{
  
  passwordEncript = await bcrypt.hash(password,10);
  console.log(passwordEncript)
   
  return passwordEncript

}

verify.verifyPassword = async(passwordDB, passwordEncript)=>{
   
    var hash = bcrypt.compare(passwordDB,passwordEncript);
   return hash; 
}

module.exports = verify;