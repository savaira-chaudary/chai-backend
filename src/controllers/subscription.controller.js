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
    const existingSubscription = await Subscription.findOne({ userId, channelId })

    if (existingSubscription) {
        // User is already subscribed, so we unsubscribe
        await Subscription.deleteOne({ userId, channelId })
        return res.status(200).json(new ApiResponse(200, "Unsubscribed successfully"))
    }
    // User is not subscribed, so we subscribe
    const newSubscription = new Subscription({ userId, channelId })
    await newSubscription.save()
    return res.status(201).json(new ApiResponse(200,"Subscribed successfully"))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    const subscribers = await Subscription.find({ channelId })
        .populate('userId', 'name email') // Assuming userId is populated with user details

    if (!subscribers || subscribers.length === 0) {
        throw new ApiError(404, "No subscribers found for this channel")
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

    const subscriptions = await Subscription.find({ userId: subscriberId })
        .populate('channelId', 'name description') // Assuming channelId is populated with channel details

    if (!subscriptions || subscriptions.length === 0) {
        return res.status(404).json(new ApiResponse("No subscribed channels found for this user"))
    }
    return res
        .status(200)
        .json(new ApiResponse(200, "Subscribed channels retrieved successfully", subscriptions))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}