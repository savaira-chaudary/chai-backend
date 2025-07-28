import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadonCloudinary} from "../utils/cloudinary.js"
import fs from "fs"


const getAllVideos = asyncHandler(async (req, res) => {
    //     const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
//     //TODO: get all videos based on query, sort, pagination
    const {
        page = 1,  // Get page number from query string, default is 1
        limit = 10, // Get number of items per page, default is 10
        query,
        sortBy = 'createdAt', // Field to sort by, default is 'createdAt'
        sortType = 'desc', // Sort order: 'asc' or 'desc', default is 'desc'
        userId
    } = req.query;

    const filter = {
        isPublished: true,
    };

    if (query) {
        filter.title = { $regex: query, $options: 'i' }; // case-insensitive search
    }
     
    // If userId is provided and valid, add it to the filter to fetch videos from that user
    if (userId && isValidObjectId(userId) && userId !== 'undefined') {
        filter.userId = userId;
    }

    const sort = {
        [sortBy]: sortType === 'desc' ? -1 : 1,
    };

    try {
        // Fetch videos from the database based on filters
        const videos = await Video.find(filter)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .populate('userId', 'name profilePicture');

        if (!videos.length) {
            throw new ApiError(404, 'No videos found');
        }

        return res
            .status(200)
            .json(new ApiResponse(200, videos, 'Videos found successfully'));
    } catch (err) {
        throw new ApiError(500, 'Internal server error', err);
    }
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const { videoFile } = req.files || {};

    // Validate required fields
    if (!videoFile) {
        throw new ApiError(400, "Video file is required");
    }
    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }
    if (!req.user || !req.user._id) {
        throw new ApiError(401, "Unauthorized, user not found");
    }

    // Find the user
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Upload video to Cloudinary
    const videoUrl = await uploadonCloudinary(videoFile.tempFilePath, "Videos");
    if (!videoUrl) {
        throw new ApiError(500, "Video upload failed");
    }

    // Create new video document
    const video = await Video.create({
        title,
        description,
        videoUrl,
        userId: user._id,
    });

    if (!video) {
        throw new ApiError(500, "Video creation failed");
    }

    // Optional: delete temp file (Cloudinary SDK may already do this)
     fs.unlinkSync(videoFile.tempFilePath); // If needed and safe

    return res
        .status(201)
        .json(new ApiResponse(201, video, "Video published successfully"));
});


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!isValidObjectId(videoId)){
         throw new ApiError(400, "invalid video id")
    }
    const video = await Video.findById(videoId).populate('userId', 'name profilePicture')
    if (!video) {
        throw new ApiError(404, "video not found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, video, "video found successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "video id is required")
    }
    const {title, description , thumbnail} = req.body
    if (!title || !description || !thumbnail) {
        throw new ApiError(400, "title, description and thumbnail arerequired")
    }
    const video = await Video.findByIdAndUpdate(videoId, {
        title,
        description,
        thumbnail
    },
     { new: true } // Return the updated document
)
    if (!video) {
        throw new ApiError(404, "video not found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, video, "video updated successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "video Id is required")
    }
    const video = await Video.findByIdAndDelete(videoId)
    if (!video){
        throw new ApiError(404, "video not found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, null, "video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "video id is required")
    }
    // find video by id
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "video not found")
    }
    video.isPublished = !video.isPublished // toggle the publish status
    await video.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, video, `video ${video.isPublished ? 'published' : 'unpublished'} successfully`))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}