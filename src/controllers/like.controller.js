import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on video

     const {videoId} = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // Check if the video exists
    // Using mongoose.model to ensure the model is loaded
    const videoExists = await mongoose.model('Video').exists({_id: videoId})

    if (!videoExists) {
        throw new ApiError(404, "Video not found")
    }
    const userId = req.user._id

    const existingLike = await Like.findOne({video: videoId, user: userId})

    if (existingLike) {
        // If like exists, remove it
        await Like.deleteOne({video: videoId, user: userId})
        return res.status(200).json(new ApiResponse("Like removed successfully"))
    } else {
        // If like does not exist, create it
        const newLike = new Like({video: videoId, user: userId})
        await newLike.save()
        return res.status(201).json(new ApiResponse("Like added successfully", newLike))
    }

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    const commentExists = await mongoose.model('Comment').exists({_id: commentId})

    if (!commentExists) {
        throw new ApiError(404, "Comment not found")
    }

    const userId = req.user._id

    const existingLike = await Like.findOne({comment: commentId, user: userId})

    if (existingLike) {
        // If like exists, remove it
        await Like.deleteOne({comment: commentId, user: userId})
        return res.status(200).json(new ApiResponse("Like removed successfully"))
    } else {
        // If like does not exist, create it
        const newLike = new Like({comment: commentId, user: userId})
        await newLike.save()
        return res.status(201).json(new ApiResponse("Like added successfully", newLike))
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    const tweetExists = await mongoose.model('Tweet').exists({_id: tweetId})

    if (!tweetExists) {
        throw new ApiError(404, "Tweet not found")
    }

    const userId = req.user._id

    const existingLike = await Like.findOne({tweet: tweetId, user: userId})

    if (existingLike) {
        // If like exists, remove it
        await Like.deleteOne({tweet: tweetId, user: userId})
        return res.status(200).json(new ApiResponse("Like removed successfully"))
    } else {
        // If like does not exist, create it
        const newLike = new Like({tweet: tweetId, user: userId})
        await newLike.save()
        return res.status(201).json(new ApiResponse("Like added successfully", newLike))
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id

    const likedVideos = await Like.find({user: userId, video: { $exists: true }}).populate('video')
    
    if (!likedVideos || likedVideos.length === 0) {
        return res.status(404).json(new ApiResponse("No liked videos found"))
    }
    return res
    .status(200)
    .json(new ApiResponse(200, "Liked videos retrieved successfully", likedVideos))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}