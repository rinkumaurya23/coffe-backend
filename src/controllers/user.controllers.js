import { asyncHandlear } from "../utils/asyncHandlear.js";



const registerUser = asyncHandlear(async (req,res)=>{

   res.status(200).json({
        message:"OK"
    })
})


export {
     registerUser,
    }