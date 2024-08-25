const asyncHandlear =(requestHandlear)=>{
    (req,res,next)=>{
        Promise.resolve(requestHandlear(req,res,next))
        .catch((err)=>next(err))
    }

} 








// ,=middleware

// const asyncHandlear =(fn)=>async(req,res,next)=>{}
// try {
//     await fn(req,res,next)
    
// } catch (error) {
//     res.status(err.code || 500).json({
//         success:false,
//         message:err.message
//     })
// }



export {asyncHandlear}