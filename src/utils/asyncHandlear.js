const asyncHandlear = (requestHandlear)=>
    {
    return (req,res,next)=>{
        Promise.resolve(requestHandlear(error,req,res,next))
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