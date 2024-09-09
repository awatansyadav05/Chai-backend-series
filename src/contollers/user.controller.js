import { asyncHandler } from "../utiles/asyncHandler.js"
import { ApiError } from "../utiles/errorAPI.js"
import { User, user } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utiles/cloudinary.js"
import { ApiResponse } from "../utiles/responseAPI.js"
const regsiterUser = asyncHandler(async (req, res) => {
  // res.status(200).json({
  //   message: "ok"
  // })
  const { fullName, email, password, username } = req.body
  console.log("email:", email);
  if ([
    fullName, email, password, username
  ].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required")
  }
  const existeduser = user.findone({
    $or: [{ username }, { email }]

  })
  if (existeduser) {
    throw new ApiError(409, "user with same username already existed");

  }
  const avatarlocalpath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  if (!avatarlocalpath) {
    throw new ApiError(400, "avatar file is required")
  }

  const avatar = await uploadOnCloudinary(avatarlocalpath)
  const avatarImage = await uploadOnCloudinary(coverImageLocalPath)
  if (!avatar) {
    throw new ApiError(400, "avatar file is required")
  }
  //entry in db
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })
  const createduser = await User.findById(user._id).select(
    "-password -refreshToken"
  )
  if (!createduser) {
    throw new ApiError(500, "something went wrong while registering the user")

  }

  return res.status(201).json(
    new ApiResponse(200,createduser, "User registered successfully")
  )


})


export { regsiterUser }