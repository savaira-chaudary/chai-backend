import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import { uploadonCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'

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
     console.log("email", email);

     if (
        [fullName,email,username,password].some((field) => field?.trim() === "")//check if given fields are not empty
     ) {
        throw new ApiError(400, "All fields are required")
     }

    const existedUser =  User.findOne({
        $or: [{ username },{ email }]
     })

     if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
     }

     const avatarLocalPath = req.files?.avatar[0]?.path; //because it is now on local server
     const coverImageLocalPath = req.files?.coverImage[0]?.path;

     if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
     }
    
     const avatar = await uploadonCloudinary(avatarLocalPath)
     const coverImage = await uploadonCloudinary(coverImageLocalPath)

     if (!avatar) {
         throw new ApiError(400, "Avatar file is required")
     }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.tolowerCase()
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

export {registerUser}