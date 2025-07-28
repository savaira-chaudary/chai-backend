import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video id")
    }

    const comments = await Comment.find({videoId})
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .populate('userId', 'name profilePicture')
            .sort({createdAt: -1}) // Sort by creation date, newest first

    if (!comments.length) {
        throw new ApiError(404, "No comments found for this video");
    }

    return res.status(200).json(new ApiResponse(200, comments, "Comments found successfully"));
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {content} = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "video is not found")
    }
    if (!content || content.trim() === "") {
        throw new ApiError(400, "content is required")
    }

    // Create and save new comment
    const comment = new Comment({
        userId: req.user._id,
        videoId,
        content
    })
    await comment.save({validateBeforeSave: false,
        new: true
    })
    return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment added successfully"))

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content} = req.body

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "invalid comment id")
    }
    if (!content || content.trim() === "") {
        throw new ApiError(400, "content is required")
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    if (comment.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to update this comment");
    }

    comment.content = content;
    await comment.save({validateBeforeSave: false}); // Save updated comment

    return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "invalid comment id")
    }

    const comment = await Comment.findByIdAndDelete(commentId)

    if (!comment) {
        throw new ApiError(404, "comment not found")
    }
    // Only the comment owner can delete
     if (comment.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to delete this comment");
    }

    await comment.deleteOne();

    return res
    .status(200),
    json(new ApiResponse(200, null, "Comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }