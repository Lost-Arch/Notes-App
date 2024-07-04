require("dotenv").config()

const config=require("./config.json")
const mongoose=require("mongoose")

mongoose.connect(process.env.CONNECTION_STRING)

const User=require("./models/user.model")
const Note= require("./models/note.model")

const express = require("express")
const cors = require("cors")
const app = express()


const jwt = require("jsonwebtoken")
const { authenticateToken } = require("./utilities");

app.use(express.json())
app.use(
    cors({
        origin: '*',

    })
)

//account creation 
app.post("/create-account", async(req,res) => {
    const {fullName, email, password}=req.body
    if(!fullName){
        return res
            .status(400).json({error: true, message: "Please enter Full Name... "})
    }
    if(!email){
        return res
            .status(400).json({error: true, message: "Please enter Email..."})
    }
    if(!password){
        return res
            .status(400).json({error: true, message: "Please enter password..."})
    }


    const isUser = await User.findOne({email: email});

    if(isUser){
        return res.json({
            error: true,
            message: "A user with this email already exist!"
        })
    }
    const user= new User({
        fullName, 
        email,
        password,
    })

    await user.save()

    const accessToken = jwt.sign({
        user}, process.env.ACCESS_TOKEN_SECRET,{
            expiresIn: "36000m"
        })

        return res.json({
            error: false,
            user,
            accessToken,
            message: "Registeration Successful"
        }) 
})
//Login
app.post("/login", async(req, res) => {
    const{email,password}=req.body
    if(!email){
        return res
            .status(400).json({message: "Please enter Email..."})
    }
    if(!password){
        return res
            .status(400).json({message: "Please enter password..."})
    }

    const userInfo= await User.findOne({email:email})
    if(!userInfo){
        return res.status(400).json({message: "User not found"})
    }
    if(userInfo.email==email && userInfo.password==password){
        const user = {user: userInfo}
        const accessToken= jwt.sign(user,process.env.ACCESS_TOKEN_SECRET, {expiresIn:"36000m"})
        return res.json({
            error: false,
            message: "Login Sucessful",
            email,
            accessToken
        })
    } else {
        return res.status(400).json({
            error: true,
            message: "Bad Credentials",
        })
    }
})
//Adding notes
app.post("/add-note", authenticateToken , async(req,res)=>{
    const {title, content, tags} =req.body;
    const {user} = req.user;

    if(!title){
        return res.status(400).json({error: true, message: "Title is required! "})
    }
    if(!content){
        return res.status(400).json({error: true, message: "Content is Empty! "})
    }
    
    try{
        const note= new Note({
            title,
            content,
            tags: tags || [],
            userId: user._id
        })
        await note.save()

        return res.json({
            error: false,
            note,
            message: "Note Added!"
        })
    } catch (error){
        return res.status(500).json({
            error:true,
            message:"Internal server error"
        })
    }

})

app.put("/edit-note/:noteId", authenticateToken , async(req,res)=>{ 
    const noteId = req.params.noteId
    const {title, content, tags, isPinned}= req.body
    const {user} =req.user

    if(!title && !content && !tags){
        return res.status(400).json({error:true, message: "No changes provided"})
    }

    try{
        const note = await Note.findOne({_id: noteId, userId: user._id})

        if(!note){
            return res.status(404).json({error:true, message:"Note not Found"})
        }
        if(title) note.title=title
        if(content) note.content=content
        if(tags) note.tags=tags
        if(isPinned) note.isPinned=isPinned

        await note.save()

        return res.json({
            error: false,
            note,
            message: "Note updated Successfully"
        })
    } catch(error) {
        return res.status(500).json({
            error: true,
            message:"Internal server Error"
        })
    }
})

app.get("/get-all-notes/", authenticateToken , async(req,res)=>{
    const {user} = req.user
    try{
        const notes = await Note.find({ userId: user._id
        }).sort({isPinned: -1})

        return res.json({
                error: false,
                notes,
                message: "Notes Retrieved"
            })

    } catch(error){
        return(
            res.status(500).json({
                error: true,
                message: "Unexpected Problem in retrieving Notes"
            })
        )

    }
})


app.delete("/delete-note/:noteId", authenticateToken , async(req,res)=>{
    const {user} = req.user
    const noteId = req.params.noteId
    try{
        const note = await Note.findOne({ _id: noteId, userId: user._id})
        if(!note){
            return res.status(404).json({
                error: true,
                message: "Note not found" 
            })
        }
        await Note.deleteOne({_id: noteId, userId: user._id})
        
        return res.status(200).json({
        error: false,
        message: "Note Deleted Successfully!"
        })
        
        

    } catch(error){
        return(
            res.status(500).json({
                error: true,
                message: "Internal Server error"
            })
        )

    }
})


app.listen(8000)
module.exports=app;