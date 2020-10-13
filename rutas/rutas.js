const express = require("express");
const rutas = express.Router();
const mm = require("music-metadata");
const util = require("util");
const path = require("path");
const multer = require("multer");
const pool = require("../conexion");
const jwt = require("jsonwebtoken");
const secret = require("../rutas/secret")
const verify = require("../rutas/verify");
const { v4: uuidv4 } = require('uuid');
const { Console } = require("console");

rutas.get("/", (req,res)=>{
    res.send("hola")
})

rutas.post("/inicio",async (req,res)=>{
    const user = req.body.user
   let datos ={
       username:req.body.user,
       email:req.body.email,
       password:req.body.password
   }
   
  
const search = await pool.query("Select * From user where username = ' " + datos.username +"' or email ='" + datos.email + "'")
console.log(search.length)
if(search.length == 0){
    datos.password =await  verify.encript(datos.password);

    const insert = await pool.query("insert into user  set ?", datos)
const id = insert.insertId
    var token =  jwt.sign({id},secret,{ expiresIn: "1y" });

    res.json({token:token})
}else{
    res.send("error")
}

 
    

})

rutas.post("/login", async (req,res)=>{
    const search = await pool.query("Select * From user where email = ?", req.body.email)
    if(search.length > 0){
  const passwordDB =req.body.password;
  const passwordEncript = search[0].password;
    const hash = await verify.verifyPassword(passwordDB,passwordEncript)
    console.log(hash)
    if(hash == true){
        var id = search[0].id;
        var token =  jwt.sign({id},secret,{ expiresIn: "1y" });

    res.json({token:token})

    }else{
       res.send( "errorPassword")
    }
    
    }else{
       
        res.send("errorEmail")

    }
   
})

rutas.get("/forgetPassword",async (req,res)=>{
    var newPassword = `user${Math.floor(Math.random()* 100000)}`;
res.json({password:newPassword})
})

rutas.get("/home",verify.token,async (req,res)=>{
    try {
        const search = await pool.query("Select * From user where id =  ?",req.id);
        res.json({user:search})
    
        
    } catch (error) {
        res.send("error")
    }
    

})




const storage = multer.diskStorage({
    destination: "rutas/uploads/",
    filename:(req,file,cb)=>{
        req.name = uuidv4()+ path.extname(file.originalname).toLocaleLowerCase()
        cb(null,req.name);
    }
})


const upload = multer({
    storage,
    dest:"rutas/uploads/",
    fileFilter:(req,file,cb)=>{
        console.log(file)
        
        const fileType = /mp3|aac|wav|flac|alac|3gp|aaa|aax|aac|act|ape|m4a|wma/
        const extname = fileType.test(path.extname(file.originalname))

        if(extname){
            req.success = true;
            req.name = file.filename;
            return cb(null,true)

        }
     cb(new Error("error"))
    }
})



rutas.post("/upload", upload.single('music') ,async (req,res,error)=> {
   
   
    if(req.success == true){
        
         
      var metas = await  mm.parseFile(path.join(__dirname+ "/uploads/"+ req.name));
      const cover = mm.selectCover(metas.common.picture)
      
      const search = await pool.query("Select * From music where name = ?", metas.common.title)
      console.log(search.length)

      if(search.length > 0){
          res.json({error:"ya existe"})
      }else{
        

      let datos = {
            name : metas.common.title,
            autor : metas.common.artist,
            album : metas.common.album,
            picture : "",
            ruta: req.name
        }
     const response = await pool.query("Insert into music Set ?", datos) 
     res.json({message:"subido"})
     
    }

    }else{
        res.send("error")
    }

           
        }
    )


    rutas.get("/music/:music", (req,res)=>{
        console.log(req.params.music) 
        const music = req.params.music
        const tmp = path.join(__dirname+ "/uploads/"+music)
        res.sendFile(tmp)
    })


    //Playlist public
    rutas.get("/playlistPublicAll/", async  (req,res)=>{
        

        const response = await pool.query(`Select * From playlist where type = 'public' ` );
 
        if(response.length > 0){

            res.json({music: response})

        }else{ 

            res.json({music:"vacio"})
        }

    })

    rutas.post("/buscarPlaylist",async(req,res)=>{
  let response;
       if(req.body.id == "null"){
        response = await pool.query(`Select * From playlist where name like  '%${req.body.value}%' and type = '${req.body.type}' `);
       }else{

        response = await pool.query(`Select * From playlist where name like  '%${req.body.value}%' and id_user = '${req.body.id}' `);
       }

  
     res.json({music:response})
    
 
   
    })

    rutas.get("/musicAll",async ( req,res)=>{
        const find = await pool.query("Select * From music order by fecha DESC")
        res.json({search :find })
    })

    //Playlist user
    rutas.get("/playlistUser/:id", async  (req,res)=>{
        const response = await pool.query(`Select * From playlist where id_user = ${req.params.id} limit 4`);

        if(response.length > 0){

            res.json({music: response})

        }else{ 

            res.json({music:"vacio"})
        }

    })

  

    rutas.post("/searchMusic",verify.token,async (req,res)=>{
        const search = req.body.search;
       
        const response = await pool.query("Select * From music where name like  '%" + search + "%' or autor like  '%"+ search + "%' or ruta like '%" + search + "%'");
        res.json({search:response})
    })


    rutas.post("/crearPlaylist",async (req,res)=>{
        const search = await pool.query(`Select * From playlist where name = ? `, req.body.name);
        if(search.length > 0){
            res.json({playlist:"Exist Playlist"})
        }else{

       const playlist = await pool.query("Insert Into playlist Set ?",req.body);
       res.json({playlist:playlist})

        }
    })

    rutas.post("/addMusicPlaylist",async  (req,res)=>{
        console.log(req.body)
        const search = await pool.query(`Select * From playlist_muisic where id_playlist = ${req.body.id_playlist} and id_song = ${req.body.id_song}`);

        if(search.length > 0){
            res.json({playlist: "exist"})
        }else{
         const playlist = await pool.query("Insert Into playlist_muisic Set ?", req.body); 

        
         res.json({playlist:"add"})
        }

    })

    rutas.post("/selectPlaylistFav/",async (req,res)=>{
        let select;
        if(req.body.id_playlist != null){
            select = await pool.query(`Select * From playlist_save where id_user = ${req.body.id_user} and id_playlist = ${req.body.id_playlist} `);

        }else{
            select = await pool.query(`Select * From playlist_save where id_user = ${req.body.id_user}  `);
        }
      

        if(select.length > 0 ){
            res.json({playlist:select})
        }else{
            res.json({playlist:"vacio"})
        }

    })

    rutas.post("/addPlaylistFav",async  (req,res)=>{
        console.log(req.body)
        const search = await pool.query(`Select * From playlist_save where id_user = ${req.body.id_user} and id_playlist = ${req.body.id_playlist}`);

        if(search.length > 0){
            res.json({playlist: "exist"})
        }else{
         const playlist = await pool.query("Insert Into playlist_save Set ?", req.body); 

        
         res.json({playlist:"add"})
        }

    })

    rutas.post("/deletePlaylistFav/",async  (req,res)=>{
        
        const search = await pool.query(`Select * From playlist_save where id_user = ${req.body.id_user} and id_playlist = ${req.body.id_playlist}`);

        if(search.length == 0){
            res.json({playlist: " no exist"})
        }else{
         const playlist = await pool.query(`Delete From playlist_save where id_playlist = ${req.body.id_playlist} and id_user = ${req.body.id_user} `); 

        
         res.json({playlist:"delete"})
        }

    })

    rutas.get("/musicFindPlaylist/:id",async (req,res)=>{
        
    
let datos = [];
        const search = await pool.query("Select * From playlist_muisic where id_playlist = ?", req.params.id)
        if(search.length > 0){
        
      for (let i = 0; i < search.length; i++) {
        const music  = await pool.query("Select * From music where id = ?", search[i].id_song)
           
        datos[i] =music;
        
      
          
      }
      res.json({datos})
     

     
        }else{
            res.json({music:"no hay"})
        }
     

    })

    rutas.delete('/deleteMusicPlaylist/:id',async (req,res)=>{
        console.log(req.params.id)
       const deleteMusicPlaylist = await pool.query("Delete From playlist_muisic where id_song = ?", req.params.id)

       res.json({
           music:"eliminado"
       })
    }) 
    


     rutas.delete('/deletePlaylist/:id',async (req,res)=>{
        const deleteMusicPlaylist = await pool.query("Delete From playlist where id = ?", req.params.id)
 
        res.json({
            music:"eliminado"
        })
     })

     

     rutas.post("/updatePlaylistType/",async (req,res)=>{
         console.log(req.body.id);

        const select = await pool.query("Select * From playlist where id = ?", req.body.id)
        if(select.length> 0){


        const update = await pool.query(`Update playlist Set type = '${req.body.type}' where id = '${req.body.id}' `);
       
        if(update){
            res.json({message:"update"})
        }else{
            res.json({message:"error"})
        }

    }else{
        res.json({message:"error"})
    }
         
     })


 


module.exports = rutas;