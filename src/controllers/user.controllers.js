import { asyncHandler } from "../utils/asyncHandler.js";
import {apiError} from '../utils/apiError.js'
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


 const generateAccessAndRefreshTokens = async (userId)=>{
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken() 

    user.refreshToken=refreshToken
    await user.save({validateBeforeSave:false})

    return {accessToken,refreshToken}





  } catch (error) {
    throw new apiError(500,"Something went wrong while generating refresh and access token")
  }
 }
const registerUser = asyncHandler( async (req,res)=>{

   // get user details from frontend
   // validation - not empty 
   // check if user already exist : username,email
   // check for images, check for avatar 
   // upload them cloudinary, avatar
   // create user object - create entry in db
   // remove password and refresh token from response
   // check for creation 
   // return response
   
   
  const {fullName,Email,username,password}=req.body
  console.log('Email',Email);

if(
  [fullName,Email,username,password].some((field)=>
            field?.trim() === "")
   ){
    throw new apiError(400, "All field are required")
}
const existedUser = await User.findOne({
$or: [{username},{Email}]
})


if(existedUser){
   throw new apiError(409,"User with email or username already exists")
}

console.log(req.files)
//  const avatarLocalP?ath = req.files?.avatar[0]?.path;
 const coverImageLocalPath= req.files?.coverImage[0]?.path;

 let coverImageLocalPaths;
 if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
  coverImageLocalPaths = req.files.coverImage[0].path
 }
 
 if(!avatarLocalPaths){
   throw new apiError(400,"Avatar file is required")
 }


 const avatar = await uploadOnCloudinary(avatarLocalPath)
 const coverImage =await uploadOnCloudinary(coverImageLocalPath)

 if (!avatar){
   throw new apiError(409,"Avatar file is required")

 }
 const user = await User.create({
   fullName,
   avatar: avatar.url,
   coverImage: coverImage?.url || "",
   Email,
   password,
   username: username.toLowerCase()

 })
 const createdUser = await User.findById(user._id).select(
   "-password -refreshToken"
 )
 if(!createdUser){
   throw new apiError(500,"Something went wrong while register")
 }


return res.status(201).json(
   new ApiResponse(200,createdUser,"userRegistered Successfully")
)
})
const loginUser = asyncHandler(async (req,res)=>{
    // req body data 
    // user name or email
    // find the user 
    // password check
    //access and refresh token
    //send cookie 
  

  const {Email,username,password } = req.body
    if (!username || !Email){
      throw apiError(400,"username or Email is required")
    }

  const user = await User.findOne({
      $or:[{username},{Email}]
    })

    if(!user){
      throw new apiError(404,"User does not exits")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)


    if(!isPasswordValid){
      throw new apiError(401,"Invalid user credentials")
    }
    const {accessToken,refreshToken}= await generateAccessAndRefreshTokens(user._id)

     const loggedInUser = await User.findById(user._id)
     select("-password -refreshToken")

     const options = {
      httpOnly: true,
      secure: true
     }
     return res
     .status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",refreshToken,options)
     .json(
      new ApiResponse(
        200,
        {
          user:loggedInUser,accessToken,refreshToken
        },
        "user logged In Successfully"
      )
     )
})
const logoutUser = asyncHandler(async(req,res)=>{
 await User.findByIdAndUpdate(
  req.user._id,
  {
    $set:{
      refreshToken:undefined
    }
    },
      {
        new:true
      }
)
const options = {
  httpOnly: true,
  secure: true
 }
 return res
 .status(200)
 .clearCookie("accessToken",options)
 .clearCookie("refreshToken",options)
 .json(new ApiResponse(200,{},"user LoggedIn"))
})
const refreshAccessToken = asyncHandler(async (req,res)=>{
  const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken){
    throw new apiError(401,"UnAuthorized Application")
     }
    try {
      const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
  
       )
       const user = await User.findById(decodedToken?._id)
        if (!user){
          throw new apiError(401,"Invalid refresh Token")
           }
           if (incomingRefreshToken !==user?.refreshToken){
            throw new apiError(401,"Refresh Token is expired or used")
           }
        const options = {
          httpOnly:true,
          secure:true
        }
         const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
         return res
         .status(200)
         .cookie("accessToken",accessToken,options)
         .cookie("refreshToken",newRefreshToken,options)
         .json(
          new ApiResponse(
            200,
            {accessToken,refreshToken:newRefreshToken}
  
          )
         )
    } catch (error) {
      throw new apiError(401,error?.message || "Invalid RefreshToken")
    }

      })
const changeCurrentPassword = asyncHandler(async (req,res)=>{
  const {oldPassword,newPassword}=req.body
  
  const user = await User.findById(req.user?._id)
 const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

 if (!isPasswordCorrect){
  throw new apiError(400,"Invalid old Password")
 }
 user.password = newPassword
 await user.save({
  validateBeforeSave:false
 })
 return res
 .status(200)
 .json(new ApiResponse(200,{},"password changed"))
})
const getCurrentUser = asyncHandler(async (req,res)=>{
  return res
  .status(200)
  .json(200,req.user,"current user fetched SuccessFully")
})
const updateAccountDetails = asyncHandler(async (req,res)=>{

    const {fullName,Email}=req.body

    if (!fullName || !Email){
      throw new apiError(400,"All fields are required")
    }
 const user = await User.findByIdAndUpdate(
  req.user?._id,
  {
    $set:{
      fullName,
      Email,

    }
  },
  {new:true}
).select("-password")
  return res
  .status(200)
  .json(new ApiResponse(200,user,"Account details updated successfully"))
})
const updateUserAvatar = asyncHandler(async (req,res)=>{
 const avatarLocalPath =  req.file?.path
 if (!avatarLocalPath){
  throw new apiError(400,"Avatar file is missing")
 }
 const avatar = await uploadOnCloudinary(avatarLocalPath)
 if (!avatar.url){
  throw new apiError(400,"Error while uploading on avatar")
 }
 const user = await User.findByIdAndUpdate(
  req.user?._id,
  {
    $set:{
      avatar:avatar.url
    }
  },
  {
    new:true
  }
 ).select("-password")
 return res
 .status(200)
 .json(new ApiResponse(200,user,"avatar file  updated"))
})
const updateUserCoverImage = asyncHandler(async (req,res)=>{
  const coverLocalPath =  req.file?.path
  if (!coverLocalPath){
   throw new apiError(400,"cover image is missing")
  }
  const coverImage = await uploadOnCloudinary(coverLocalPath)
  if (!coverImage.url){
   throw new apiError(400,"Error while uploading on coverImage")
  }
 const user =  await User.findByIdAndUpdate(
   req.user?._id,
   {
     $set:{
      coverImage:coverImage.url
     }
   },
   {
     new:true
   }
  ).select("-password")
  return res
  .status(200)
  .json(new ApiResponse(200,user,"cover images updated"))
 })
 const getUserChannelProfile = asyncHandler(async (rwq,res)=>{
  const {username} = req.params
  if(!username?.trim()){
    throw new apiError(400,"username is missing ")

  }
  const channel = await User.aggregate([
    {
      $match:{
        username:username?.toLowerCase()
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedTo"
      }
    },
    {
      $addFields:{
        subscribersCount:{
          $size:"$subscribers",
        },
        channelsSubscribedToCount:{
          $size:"$subscribedTo"
        },
        isSubscribed:{
          $cond:{
            if: {$in:[req.user?._id,"$subscribers.subscriber"]},
            then:true,
            else:false
          }
        }
      }
    },
    {
      $project:{
        fullName:1,
        username:1,
        subscribersCount:1,
        channelsSubscribedToCount:1,
        isSubscribed:1,
        avatar:1,
        coverImage:1,
        Email:1

        

      }
    }
  ])

  if (!channel?.length){
    throw new apiError(404,"channel does not exists")
  }
  return res.status(200).json(new ApiResponse(200,channel[0],"User channel fetched Successfully"))

 })
 const getWatchHistory = asyncHandler(async (req,res)=>{
 const user = await User.aggregate([
  {
    $match:{
     _id: new mongoose.Types.ObjectId(req.user._id)
    }
  },
  {
    $lookup:{
      from:"videos",
      localField:"watchHistory",
      foreignField:"_id",
      as:"watchHistory",
      pipeline:[
        {
          $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"owner",
            pipeline:[
              {
                $project:{
                  fullName:1,
                  username:1,
                  avatar:1
                }
              }
            ]
          }
        },
        {
          $addFields:{
            owner:{
              $first:"$owner"
            }
          }
        }
      ]
    }
  }
 ])
 return res
 .status(200)
 .json(new ApiResponse(200,user[0],watchHistory,"Watch history fetche successfully"))
 })


export {
     registerUser,
     loginUser,
     logoutUser,
     refreshAccessToken,
     changeCurrentPassword,
     getCurrentUser,
     updateAccountDetails,
     updateUserAvatar,
     updateUserCoverImage,
     getUserChannelProfile,
     getWatchHistory,
    }


