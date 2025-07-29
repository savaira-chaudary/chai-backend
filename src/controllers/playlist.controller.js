import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist
    if (!name) {
        throw new ApiError(400, "Playlist name is required")
    }
    if (!description) {
        throw new ApiError(400, "Playlist description is required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        user: req.user._id // Associate with authenticated user
    })
    if (!playlist) {
        throw new ApiError(500, "Failed to create playlist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, "Playlist created successfully", {playlist}))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    // Find all playlists for the user with populated data
    const playlists = await Playlist.find({user: userId})
        .populate("videos", "title thumbnailUrl")
        .populate("user", "name email")
    if (!playlists || playlists.length === 0) {
        throw new ApiError(404, "No playlists found for this user")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "User playlists retrieved successfully", {playlists}))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    // Find the playlist by ID and populate videos and user details
    const playlist = await Playlist.findById(playlistId)
        .populate("videos", "title thumbnailUrl")
        .populate("user", "name email")
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Playlist retrieved successfully", { playlist }))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!mongoose.isValidObjectId(playlistId) || !mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID")   
    }

    // Check if the playlist exists and belongs to the user
    if (playlist.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized to modify this playlist");
   }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    // Prevent duplicate videos in playlist
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video already exists in the playlist")
    }

    playlist.videos.push(videoId)
    await playlist.save()

    return res
        .status(200)
        .json(new ApiResponse(200, "Video added to playlist successfully", {
            playlist
        }))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (!playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video not found in the playlist")
    }
    // Remove video from the playlist
    playlist.videos = playlist.videos.filter(id => id.toString() !== videoId)
    await playlist.save()

    return res
        .status(200)
        .json(new ApiResponse(200, "Video removed from playlist successfully", {
            playlist
        }))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }
    const playlist = await Playlist.findByIdAndDelete(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }
    if (!name && !description) {
        throw new ApiError(400, "At least one field (name or description) is required to update the playlist")
    }
    const updateData = {}
    if (name) updateData.name = name
    if (description) updateData.description = description

    const playlist = await Playlist.findByIdAndUpdate(playlistId, updateData, {new: true})
        .populate("videos", "title thumbnailUrl")
        .populate("user", "name email")

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Playlist updated successfully", {
            playlist
        }))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}