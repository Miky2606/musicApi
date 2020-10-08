const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const path = require("path");
const rutas = require("./rutas/rutas")
const conexion = require("./conexion");
const cors = require("cors");

 app.use(express.urlencoded({extended: false}))
app.use(express.json()) 
app.use(cors())
app.use(rutas);
app.listen(port,(req,res)=>{
   console.log("yes")
    
})
