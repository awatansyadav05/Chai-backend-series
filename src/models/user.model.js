import mongoose, {Schema} from "mongoose";
import {bcrypt} from "bcrypt";
import { JsonWebTokenError } from "jsonwebtoken";  //ek chabi jaisa hia jo tkone send krega use data send kr denge

const userSchema = new Schema ({
  username: {
    type:String, 
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  email: {
    type:String, 
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  avatar: {
    type:String,   //cloudriary avatar
    required: true,
    
  },
  fullName: {
    type:String,   //cloudriary avatar
    required: true,

  },
  coverImage: {
    type: String,
  },
  watchHistory: {
    type: Schema.Types.ObjectId,
    ref: "Video"
  },
  password: {
    type: String,
    required: true
  },
  
    refreshToken: {
        type: String
    }
  

},{
  timestamps: true
})

userSchema.pre("save", async function (next){
  if(!this.ismodified("password", )) return next();

  this.password = bcrypt.hash (this.password, 10)
  next()
})

userSchema.methods.isPasswordCorrect = async function (password)
{
  return await bcrypt.compare(password, this.password )
}

userSchema.methods.generateAccessToken = function(){
  JsonWebTokenError.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,{
      expiresin:process.env.ACCESS_TOKEN_EXPIRY
    }
  )

}

userSchema.methods.generateRefreshToken = function(){
  JsonWebTokenError.sign(
    {
      _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,{
      expiresin:process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

export const User= mongoose.model("User", userSchema)