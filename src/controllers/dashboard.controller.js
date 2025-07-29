import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channelId = req.params.channelId;

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const channelVideos = await Video.find({ channel: channelId });

    if (!channelVideos) {
        throw new ApiError(404, "Channel not found or has no videos");
    }

    // Calculate total views by summing up views from all videos
    const totalViews = channelVideos.reduce((acc, video) => acc + video.views, 0);
        // Count total subscribers for the channel
    const totalSubscribers = await Subscription.countDocuments({ channel: channelId });
    // Get total number of videos (already have this from channelVideos.length)
    const totalVideos = channelVideos.length;
    // Count total likes across all channel videos
    const totalLikes = await Like.countDocuments
    ({ video:
         { $in: channelVideos.map(video => video._id) }
     });

    return res.status(200).json(new ApiResponse(200, {
        message: "Channel stats retrieved successfully",
        data: {
            totalViews,
            totalSubscribers,
            totalVideos,
            totalLikes
        }
    }));
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const channelId = req.params.channelId;

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Find all videos for the channel and populate basic channel info
    const channelVideos = await Video.find({ channel: channelId })
    .populate('channel', 'name');

    if (!channelVideos || channelVideos.length === 0) {
        throw new ApiError(404, "Channel not found or has no videos");
    }
   
    return res
    .status(200)
    .json(new ApiResponse(200,{
        message: "Channel videos retrieved successfully",
        data: channelVideos
    }));
})

export {
    getChannelStats, 
    getChannelVideos
    }