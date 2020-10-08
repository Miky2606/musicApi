const mysql = require("mysql");
const db = require("./db");
const {promisify} = require("util");


const pool = mysql.createPool(db);

pool.getConnection((err,conection)=>{
    if(err){
        console.log("error: "+ err)
    }else{
        conection.release();
        console.log("conected")
    }
})

pool.query = promisify(pool.query);

module.exports = pool;