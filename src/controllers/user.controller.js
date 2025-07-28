import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import { uploadonCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'
import mongoose, { skipMiddlewareFunction } from 'mongoose'

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
     // get user details from frontend
     // validation
     // check if user already exists
     // check for images,check for avatar
     // upload items to cloudinary ,avatar
     // create user object, create entryin db
     // remove password and refresh token field from response
     // check for user creation
     // return response

     const {fullName, username,email,password} = req.body
     // console.log("email", email);

     if (
        [fullName,email,username,password].some((field) => field?.trim() === "")//check if given fields are not empty
     ) {
        throw new ApiError(400, "All fields are required")
     }

    const existedUser = await User.findOne({
        $or: [{ username },{ email }]
     })

     if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
     }

     const avatarLocalPath = req.files?.avatar[0]?.path; //because it is now on local server(local path for avatar)
     // const coverImageLocalPath = req.files?.coverImage[0]?.path;
 
     let coverImageLocalPath;
     if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path
     }

     if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
     }
    
     const avatar = await uploadonCloudinary(avatarLocalPath)
     const coverImage = await uploadonCloudinary(coverImageLocalPath)

     if (!avatar) {
         throw new ApiError(400, "Avatar file is required")
     }

     // object creation
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
     })

     const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
     )

     if (!createdUser) {
        throw new ApiError(500, "something went wrong while registering the user")
     }

     return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
     )
})

// login user
const loginUser = asyncHandler(async (req,res) => {
// req.body -> data
// password or email
// find the user
// password check
// access and refresh token
// send cookie
 
const {email,username, password} = req.body
console.log(email);

if (!username && !email) {
   throw new ApiError(400, "username or email is required")
}

// find the user
const user = await User.findOne({
 $or: [{ username }, { email }]
})

if (!user) {
   throw new ApiError(404, "user does not exist")
}

// if user is find and then password check bcrypt help us to check password by comparing given and saved password in database
const isPasswordValid = await user.isPasswordCorrect(password)

if (!isPasswordValid) {
   throw new ApiError(401, "Invalid user credentials")
}

const {accessToken, refreshToken}= await generateAccessAndRefereshTokens(user._id)

const loggedInUser = await User.findById(user._id).select(" -password -refreshToken")

//send cookies

const options = {
   httpOnly: true,
   secure: true
}

return res
.status(200)
.cookie("accessToken", accessToken, options)
.cookie("refreshToken", refreshToken,options)
.json(
   new ApiResponse(
      200,
      {
         user: loggedInUser, accessToken, refreshToken
      },
      "User Logged In Successfully "
   )
)

})

// log out user
const logOutUser = asyncHandler(async(req, res) => {
await User.findByIdAndUpdate(
   req.user._id,
   {
      $unset: {
         refreshToken: 1 // this will remove the field from the user document
      }
   },
   {
      new: true
   }
)

    const options = {
   httpOnly: true,
   secure: true
}

   return res
   .status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(new ApiResponse(200, {}, "user Logged out"))
})

//refresh access token endpoint
const refreshAccessToken = asyncHandler(async(req,res) =>{
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

   if (!incomingRefreshToken) {
      throw new ApiError(401, "unauthorized request")
   }

   try {
      const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.ACCESS_TOKEN_SECRET
      )
   
      const user = await User.findById(decodedToken?._id)
   
      if (!user) {
         throw new ApiError(401, "invalid refresh token")
      }
   
      if (incomingRefreshToken !== user?.refreshToken) {
         throw new ApiError(401, "refresh token is expired or used")
      }
      
      const options = {
         httpOnly: true,
         secure: true
      }
   
      const {accessToken, newRefreshToken}= await generateAccessAndRefereshTokens(user._id)
    
      return res
      .status(200)
      .cookie("accessToken", accessToken,options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
         new ApiResponse(
            200,
            {accessToken, refreshToken: newRefreshToken},
            "Access Token Refreshed"
         )
      )    
   } catch (error) {
      throw new ApiError(401, error?.message || "Invalid refresh token")
   }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
   const {oldPassword, newPassword} = req.body

   const user = await User.findById(req.user?._id)
   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

   if (!isPasswordCorrect) {
      throw new ApiError("400", "invalid old passsword")
   }

   user.password = newPassword
   await user.save({ validateBeforeSave: false})
   return res
   .status(200)
   .json(new ApiResponse(200, {}, "password changed successfully"))
})

const getCurrentuser = asyncHandler(async (req, res) => {
   return res
   .status(200)
   .json (new ApiResponse( 200, req.user, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
   const {fullName, email} = req.body

   if (!fullName || !email) {
      throw new ApiError(400, "all fields are required")
   }

   const user = await User.findByIdAndUpdate(
      req.user._id,
      {
         $set: {
            fullName,
            email
         }
      },
      { new: true}
   ).select("-password")

   return res
   .status(200)
   .json(new ApiResponse(200, user, "account details updated successfully"))

})

const updateUserAvatar = asyncHandler(async (req, res) =>{
   const avatarLocalPath = req.file?.path

   if (!avatarLocalPath) {
      throw new ApiError(400, "avatar file is missing")
   }

   const avatar = await uploadonCloudinary(avatarLocalPath)

   if (!avatar.url) {
      throw new ApiError(400, "error while uploading avatar")
   }

   const user = User.findByIdAndUpdate(
      req.useer?._id,
      {
         $set: {
            avatar: avatar.url
         }
      },
      { new: true}
   ).select("-password")

   return res
   .status(200)
   .json(new ApiResponse(200, user, "avatar updated successfully"))

})

const updateUserCoverImage = asyncHandler(async (req, res) =>{
   const coverImageLocalPath = req.file?.path

   if (!coverImageLocalPath) {
      throw new ApiError(400, "cover image file is missing")
   }

   const coverImage = await uploadonCloudinary(coverImageLocalPath)

   if (!coverImage.url) {
      throw new ApiError(400, "error while uploading cover image")
   }

   const user = User.findByIdAndUpdate(
      req.useer?._id,
      {
         $set: {
            coverImage: coverImage.url
         }
      },
      { new: true}
   ).select("-password")

   return res
   .status(200)
   .json(new ApiResponse(200, user, "cover image updated successfully"))

})

const getUserChannelProfile = asyncHandler(async (req, res) => {
const {username} = req.params

if (!username?.trim()) {
   throw new ApiError(400, "username is missing")
}

const channel = await User.aggregate([
   {
      $match:{
         username: username.toLowerCase()
      }
   },
   {
      $lookup:{
         from: "subscriptions",
         localField: "_id",
         foreignField:"channel",
         as: "subscribers"
      }
   },
    {
      $lookup:{
         from: "subscriptions",
         localField: "_id",
         foreignField:"subscriber",
         as: "subscribedTo"
      }
   },
   {
      $addFields:{
         subscriberCount:{ 
            $size: "$subscribers" 
         }, //count of subscribers
         channelsSubscribedToCount: {
            $size: "$subscribedTo" //count for channels subscribes to
         },
         isSubscribed:{
            $cond:{
               if:{$in: [req.user?._id, "$subscribedTo.subscriber"]}
            }
         }
      }
   },
   {
      $project:{
         fullName: 1,
         username: 1,
         avatar: 1,
         coverImage: 1,
         subscriberCount: 1,
         channelsSubscribedToCount: 1,
         isSubscribed: 1,
         email: 1,
      }

   }
])
  
if (!channel?.length) {
   throw new ApiError(404, "channel does not exist")
}

return res
.status(200)
.json(
   new ApiResponse(200, channel[0], "user channel profile fetched successfully")
)
})

const getWatchHistory = asyncHandler(async (req, res)=>{
   const user = await User.aggregate([
      {
         $match:{
            _id: new mongoose.Types.ObjectId(req.user._id)
         }
      },
      {
         $lookup:{
            from: "videos",
            localField:"watchHistory",
            foreignField: "_id",
            as: "watchHistory",
            pipeline:[
               {
                  $lookup:{
                     from: "users",
                     localField: "owner",
                     foreignField:"_id",
                     as: "owner",
                     pipeline:[
                        {
                           $project:{
                              fullName: 1,
                              username: 1,
                              avatar: 1
                           }
                        }
                     ]
                  }
               }
            ]
         }
      },
      {
         $addFields:{
            owner: {
               $first: "$owner"
            }
         }
      }
   ])
   if (!user?.length) {
      throw new ApiError(404, "user not found")
   }

   return res
   .status(200)
   .json(
      new ApiResponse(200, user[0].getWatchHistory, "watch history fetched successfully")
   )
})

export {
   registerUser,
   loginUser,
   logOutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentuser,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage,
   getUserChannelProfile,
   getWatchHistory
}