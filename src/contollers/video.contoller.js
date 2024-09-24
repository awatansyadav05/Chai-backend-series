import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import { ApiError } from "../utiles/errorAPI.js"
import { ApiResponse } from "../utiles/responseAPI.js"
import { asyncHandler } from "../utiles/asyncHandler.js"
import { uploadOnCloudinary } from "../utiles/cloudinary.js"
import { User } from "../models/user.model.js"



const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

})
//first  the user must be login in the postman 
//write contoller for the publishAvideo and create router for it and make sure that the router must be imported in the app.js
// we'll take the userId from the req.user.id and videofilepath from the req.file as well as  the thumbnail 
//use of uploadcloudianry function

//we are testing api for publish a video
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    //in this task we have to publish the video on cloudinary
    const userId =  req.user?.id;
    const videoLocalPath=   req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPAth =req.files?.thumbnail?.[0]?.path;
    //console.log( req.files)

    if(!title || !description)
    {
      throw new ApiError(400,"All files are required")
    }
    if(!videoLocalPath){
      throw new ApiError(400,"Video is required");
    }
    if(!thumbnailLocalPAth)
    {
      throw new ApiError(400,"Thumbnail  is required")
    }

    const videoUpload = await uploadOnCloudinary(videoLocalPath);
    const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPAth)
    if(!videoUpload)
    {
      throw new ApiError(400,"File is required")
    }
    if(!thumbnailUpload)
    {
      throw new ApiError(400, "thumbanil file is required")
    }


    //use of create method to create the video

    const video = await Video.create(
      {
        videoFile: videoUpload.url,
        thumbnail: thumbnailUpload.url,
        title,
        description,
       duration: videoLocalPath.duration,
        owner: userId,
        isPublished: true,

      }
    )
    if(!video)
    {
      throw new ApiError(500, "Error while uploading files")
    }

    return res.status(200)
    .json(new ApiResponse(200,"Video upload successfully"))


})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}