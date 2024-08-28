import dotenv from "dotenv"
import connectDB from "./db/index.js"
import {app} from './app.js'
dotenv.config({
    path: './env'
})



connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000,()=> {
        console.log(`⚙️  Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})

























/*
(async()=>{
    try {
       await mongoose.connect(`${process.env.sample.MONGODB_URI}/
        ${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("ERROR: ",error);
            throw error
        })
        app.listen(process.env.sample.PORT,()=>{
            console.log(`App is listing on port${process.env.sample.PORT}`)
        })
        
    } catch (error) {
        console.log("ERROR :",error)
        throw err

    }
})()
*/