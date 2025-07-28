import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }
    const userId = req.user._id

    // Check if subscription already exists
    const existingSubscription = await Subscription.findOne({ subscriber: userId, channel: channelId})
    if (existingSubscription) {
        // Unsubscribe
        await Subscription.deleteOne({ subscriber: userId, channel: channelId })
        return res.status(200).json(new ApiResponse("Unsubscribed successfully"))
    } else {
        // Subscribe
        const newSubscription = new Subscription({ subscriber: userId, channel: channelId })
        await newSubscription.save()
        return res.status(201).json(new ApiResponse("Subscribed successfully"))
    }

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }
    const subscribers = await Subscription.find({ channel: channelId })
        .populate('subscriber', 'name email') // Populate subscriber details
        .exec()
    if (!subscribers || subscribers.length === 0) {
        return res.status(404).json(new ApiResponse("No subscribers found for this channel"))
    }
    return res
    .status(200)
    .json(new ApiResponse(200, "Subscribers retrieved successfully", subscribers))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID")
    }

    // Fetch all subscriptions of the user
    const subscriptions = await Subscription.find({ subscriber: subscriberId })
        .populate('channel', 'name description') // Populate channel details
        .exec()
    if (!subscriptions || subscriptions.length === 0) {
        throw new ApiError(400, "no subscriptions found for this user")
    }
    
    return res
    .status(200)
    .json(new ApiResponse(200, "Subscribed channels retrieved successfully", subscriptions.map(sub => sub.channel)))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}