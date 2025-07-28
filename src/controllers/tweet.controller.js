import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required");
    }

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
     // Create and save tweet
    const tweet = new Tweet({
        content,
        user: userId
    });
    await tweet.save();

    // Push tweet to user's tweets array
    user.tweets.push(tweet._id);
    await user.save();

    return res
    .status(200)
    .json(new ApiResponse(200, "Tweet created successfully", tweet));

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const userId = req.user._id;
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const tweets = await Tweet.find({ user: userId })
        .populate('user', 'username profilePicture')
        .sort({ createdAt: -1 });

    if (!tweets || tweets.length === 0) {
        throw new ApiError(404, "no tweets found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, tweets, "tweets founded successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const userId = req.user._id;
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }
    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Validate tweet ID
    const { tweetId, content } = req.body;
    if (!tweetId || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    // Validate updated content
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }
    if (tweet.user.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to update this tweet");
    }

    tweet.content = content;
    await tweet.save();

    return res
    .status(200)
    .json(new ApiResponse(200, "Tweet updated successfully", tweet));

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const userId = req.user._id;
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const { tweetId } = req.body;
    if (!tweetId || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.user.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to delete this tweet");
    }

    // Delete the tweet
    await tweet.remove();

    // Remove tweet from user's tweets array
    user.tweets = user.tweets.filter(t => t.toString() !== tweetId);
    await user.save();

    return res.status(200).json(new ApiResponse(200, "Tweet deleted successfully", tweet));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}