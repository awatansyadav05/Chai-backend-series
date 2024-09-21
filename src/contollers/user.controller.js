import { asyncHandler } from "../utiles/asyncHandler.js";
import { ApiError } from "../utiles/errorAPI.js";
import { User } from "../models/user.model.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utiles/cloudinary.js";
import { ApiResponse } from "../utiles/responseAPI.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";



//for registering user through the postman
//first create the logic of registering the user to db
//now go to the postman and there fill the same entries as same the you created in const register
//Click send and register to the db_name

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, username } = req.body;

  console.log("email:", email);

  if ([fullName, email, password, username].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // Fix: Use User.findOne instead of user.findone
  const existeduser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existeduser) {
    throw new ApiError(409, "User with same username or email already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file upload failed");
  }

  // Fix: Use User.create instead of user.create
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully")
  );
});

//this is the code of gererating the accesstoken and refreshtoken as required when our user exits and password is also verify

const generateAccessandRefreshToken = async (userId) => {
  console.log("User id in method: ", userId);
  try {
    const user = await User.findById(userId);
    const accesstoken = user.generateAccessToken()

    const refreshtoken = user.generateRefreshToken()


    user.refreshToken = refreshtoken;
    console.log("user refrshtoken: ", user.refreshToken)
    await user.save({ validateBeforeSave: false }, { new: true })
    return { accesstoken, refreshtoken }

  } catch (error) {
    throw new ApiError(500, "something went wrong")
  }
}

//STEPS TO LOGIN USER LOGIC
//1.) we'll request the req.body from the data
// 2.) username or email must exists in the DB_NAME
// 3.)if not exist throw error
// but if exists the check the password
// 4.) verify---> password got verify then we will generate the access token and refresh token and we'll save the refresh token in our mongodb db and save the access token and refreshtoken to cookies//
//


//What is the need of generating accesstoken and refreshtoken
//as login the securing authorization is required that's why creating is required
// Access Token (Short-Lived): lived for the hours and particualr mins
// Refresh Token (long-lived): lived for the days and weeks 
//benefits is for creating the secure, efficiency, and sepration of concerns


const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body

  if (!username && !email) {
    throw new ApiError(400, "username and email not found")

  }
  const user = await User.findOne({
    $or: [{ username }, { email }]
  })

  //console.log("User is: ", user);
  if (!user) {
    throw new ApiError(404, "user not exists")

  }
  //console.log("Password is: ", password);
  const ispasswordValid = await user.isPasswordCorrect(password)
  if (!ispasswordValid) {
    throw new ApiError(401, "password not match with login creadentilas")
  }
  const { accesstoken, refreshtoken: newRefreshToken } = await generateAccessandRefreshToken(user?._id);


  const options = {
    httpOnly: true,
    secure: true
  }

  return res.status(200)
    .cookie("accessToken", accesstoken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(200, {
        user: loginUser, accesstoken, newRefreshToken
      }, "User logged in successfully"
      )
    )

});

//coming to logout user
//1.) firstly we will clear the refresh token 
//?????????? what is the need of clearing refresh token from db
//---------- becoz to ensure that the user session is fully terminated and this is due to security reason



const logoutUser = asyncHandler(async (req, res) => {
  //console.log("Logout called")
  // console.log("User id in logout: ", req.user?._id);
  const user = await User.findByIdAndUpdate(
    req.user?._id, {
    $unset: {
      refreshToken: ""
    }

  },
    {
      new: true
    }
  )

  //console.log("User in logout: ", user);
  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logout successfully"))

})


//now we will create the refreshtoken endpoint
//???? what is need?
//A refresh token endpoint allows users to get a new access token without logging in again, extending their session securely


//??? How it accessed 
//user sends the request of login and hence the refrshtoken got expired
//the server receives the request and check the refrsh token is valid and hence the valid is found it ensures  the token hasn't expired 
//valid server create the new access token for user
// the client receives the new access token and uses it for further API request without login again.

//where it can we access ? we can access it from cookiess 
//and then move to the jwt verify because we will get the access token in encoded from but we want it in decoded form that's why jwt.verify is required

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshtoken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshtoken) {
    throw new ApiError(401, "Unauthorized access")
  }

  //we have access the refreshtoken and now well decode

  try {
    const decodedToken = jwt.verify(
      incomingRefreshtoken,
      process.env.REFRESH_TOKEN_SECRET
    )
    const user = User.findById(decodedToken?._id)

    if (!user) {
      throw new ApiError(401, "Invalid Access Token")
    }

    //Now we will match the both tokens of incomingRefreshToken and user refrshtoken
    if (incomingRefreshtoken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used")

    }

    //now we will generateAccesstokenRefreshtoken 

    const options = {
      httpOnly: true,
      secure: true
    }
    const { accessToken, newRefreshToken } = await generateAccessandRefreshToken(user._id)

    return res
      .status(200)
      .cookie("access Token", accessToken, options)
      .cookie("Refresh Token", newRefreshToken, options)
      .json(
        new ApiResponse(
          200, {
          accessToken, refreshToken: newRefreshToken
        }, "Access Token refreshed Successfully "
        )
      )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh")
  }
})


// we will create another controller for checking the password and update to the db 
// {
//! we will the change the password and then update the password from current password and then save the password and change the password to the db

// }

const changeUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body
  //which user password we are changing so user must be there
  const user = User.findById(req.user?._id)

  const isPasswordValid = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordValid) {
    throw new ApiError(400, "old Password is invalid")
  }

  user.password = newPassword
  //user change password must be save
  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password is changed successfully"))


})

//now we will get the current user HOW?
// if user is logged in then we will get the current user by this method

const currentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User data fetched successfully"))

  //? req.user kyu kra?
  // because we have already injected the req.user in our database so we had accessed it.

})

// now well update the account details 
// >> first access the data from the user data like what parameters should be updated like youtube not allowed to change the username 
//>> use the findByIdAndUpdate to update the user
//>> use set operator by mongoose ------->In simple terms, $set is just a way to change or update a specific field in your data without affecting the other fields.

//>> minus the password because we dont want to use it otherwise it will create another refreshtoken and accesstoken so we will delete the cookie, hence by using select method we will not include the password
///>> last and least return the res 

const updateUser = asyncHandler(async (req, res) => {
  console.log("body object: ", req.body)
  const { fullName, email } = req.body
  console.log("fullname: ", fullName, " email: ", email)

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required")
  }

  // update by the mongoose operator so
  const user = await User.findByIdAndUpdate(req.user?._id, {
    $set: {
      fullName: fullName,
      email: email
    }



  }, { new: true }
  ).select("-password")

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))



})



//ky krenge?
// first we will match the oldavatar to our req.file?.path from files -- using multer middleware 
//not match throw error

//match so we'll upload the file on cloudinary
// and same for the update file
const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path

  if (!avatarLocalPath) {
    throw new ApiError(400, " Avatar file is missing ")
  }

  //delete the avatar file being uploaded on cloudinary
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  //console.log("Reuested Id: ", userId);

  const requestedUser = await User.findById(userId);
  // console.log("Reuested user: ", requestedUser);
  if (!requestedUser) {
    throw new ApiError(404, "User not found");
  }

  // console.log("Reuested user avatar: ", requestedUser?.avatar);
  const response = await deleteFromCloudinary(requestedUser?.avatar);
  if (!response) {
    throw new ApiError(402, "Unable to delete avatar from cloudinary");
  }

  // console.log("Response of delete in controller: ", response);


  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading file")
  }
  //update

  const user = await User.findByIdAndUpdate(
    req.user?._id, {
    $set: {
      avatar: avatar.url


    }
  }, { new: true }
  ).select("-password")

  return res.status(200)
    .json(new ApiResponse(200, user, "Avatar image uploded successfully"))
})

//same as avatar file updation we will do the same as coverImage
// create the updatecoverimage
// first accuqire the imagelocalpath from req?.file.path by using multer middleware
// now check the image exits or not
// now upload on cloudinary
// if not able to upload throw error
// update the coverimage by using findByIdandUpdate
// req.user?._id and update the image using set operation
// remove {password} by select 
// and now return res.

const updateCoverImage = asyncHandler(async (req, res) => {
  const imageLocalpath = req.file.path
  if (!imageLocalpath) {
    throw new ApiError(400, "Cover Image not found")
  }

  //delete coverimage uploaded before
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  // console.log("Reuested Id: ", userId);

  const requestedUser = await User.findById(userId);
  // console.log("Requested user: ", requestedUser);
  if (!requestedUser) {
    throw new ApiError(404, "User not found");
  }

  // console.log("Reuested user avatar: ", requestedUser?.avatar);
  const response = await deleteFromCloudinary(requestedUser?.coverImage);
  if (!response) {
    throw new ApiError(402, "Unable to delete avatar from cloudinary");
  }

  //console.log("Response of delete in controller: ", response);




  const coverImage = await uploadOnCloudinary(imageLocalpath)
  if (!coverImage) {
    throw new ApiError(400, "Failed in uploading on cloudinary")
  }
  // updation part
  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    }, { new: true }
  )
    .select("-password")
  return res.status(200)
    .json(new ApiError(200, user, "Cover Image uploaded successfully"))

})

// IN this we are going to write the aggregation and pipelines
// we will create the deatils of userchannelprofile 
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params //this extracts the username parameter from the url parameter of incoming request. example::
  // /profile/:username. If a client requests /profile/johndoe, username will be johndoe.


  //this checks the either the username is undefined or null
  //use of trim() -- to clear the whitespaces in the string like, " john doe " so it will automatically do "john doe" to workin with clear string.
  if (!username?.trim()) {
    throw new ApiError(400, "username is missing")
  }

  const channel = await User.aggregate([
    //depends on you how much pipelines you create
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      //count kia kitne subscriber hai
      //this is our first pipeline where we find there subscriber
      $lookup: {
        from: "subscriptions",   //kha se lia jaega
        // jo lookup mai ayega wo ek to smaller form ho jaega and plural ho jaega
        localField: "_id",  //field where we get from details
        foreignField: "channel", //kha se lena hai
        as: "subscribers" // as -- means kya rkha jaega

      }

    },
    {
      //kitne channel subscribe ko kra hai
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",   //maine kisko subscribe kra hai
        as: "subscribeTo"

      }
    },
    {
      //*refer to notes*//
      $addFields: {
        subscriberCount: {
          $size: "$subscibers"
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscibers.subsciber"] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullName: 1,
        email: 1,
        username: 1,
        channelsSubscribedToCount: 1,
        subscriberCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1
      }
    }

  ])
  //checks whether the channel is either null or undefined orr empty 
  // .length checks its string is not empty 
  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exits")
  }

  return res.status(200)
    .json(
      new ApiResponse(200, "User channel fetched successfully")
    )

})

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        //refer above for the context
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              //pipeline ke andar pipeline means that we are creating the pipeline will reflect only owner field. 
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1
                    //there the all work of pipeline work is compelted!!

                  }
                }
              ]


            }
          }

        ]
      }
    }
  ])
})


export {
  registerUser, loginUser, logoutUser, refreshAccessToken
  ,
  changeUserPassword, currentUser, updateUser, updateAvatar, updateCoverImage,
  getUserChannelProfile, getWatchHistory
}
