import express from "express";
import cors from 'cors';
import cookieParser from "cookie-parser";

const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    Credential:true
}))
app.use(express.json({limit:"20kb"}))
app.use(express.urlencoded({extends:true,limit:"20kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// routes import
import userRouter from './models/routes/user.routes.js';


// router declarations 
app.use("/api/v1/users",userRouter)



export { app }