import { asyncHandler } from "../utiles/asyncHandler.js";
import { ApiError } from "../utiles/errorAPI.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utiles/cloudinary.js";
import { ApiResponse } from "../utiles/responseAPI.js";
import jwt from "jsonwebtoken";
//import { auth } from "../middleware/auth.middleware.js"


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

  console.log("User is: ", user);
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
  console.log("User id in logout: ", req.user?._id);
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
//user sends the request the of login and hence the refrshtoken got expired
//the server receives the request and check the refrsh token is valid and hence the valid is found it ensures  the token hasn't expired 
//valid server create the new access token for user
// the client receives the new access token and uses it for further API request without login again.

//where it can we access ? we can access it from cookiess 
//and then move to the jwt verify because we will get the access token in encoded from but we want it in decoded form that's why jwt.verify is required

const refreshAccessToken = asyncHandler(async(req,res)=> {
    const incomingRefreshtoken  =req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshtoken)
    {
      throw new ApiError(401, "Unauthorized access")
    }

    //we have access the refreshtoken and now well decode

    try {
       const decodedToken=  jwt.verify(
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
       const {accessToken, newRefreshToken}=  await  generateAccessandRefreshToken(user._id)
  
       return res 
       .status(200)
       .cookie("access Token", accessToken, options)
       .cookie("Refresh Token", newRefreshToken , options )
       .json(
        new ApiResponse(
          200, {
            accessToken, refreshToken: newRefreshToken
          },"Access Token refreshed Successfully "
        )
       )
    } catch (error) {
      throw new ApiError(401, error?.message  || "Invalid refresh Token") 
    }
})




export { registerUser, loginUser, logoutUser,refreshAccessToken }
