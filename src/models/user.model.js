// import mongoose, {Schema} from "mongoose";
// import { bcrypt }  from "bcrypt";
// import  { jwt }  from "jsonwebtoken";  //ek chabi jaisa hia jo tkone send krega use data send kr denge

// const userSchema = new Schema ({
//   username: {
//     type:String, 
//     required: true,
//     unique: true,
//     lowercase: true,
//     trim: true,
//     index: true
//   },
//   email: {
//     type:String, 
//     required: true,
//     unique: true,
//     lowercase: true,
//     trim: true,
//   },
//   avatar: {
//     type:String,   //cloudriary avatar
//     required: true,
    
//   },
//   fullName: {
//     type:String,   //cloudriary avatar
//     required: true,

//   },
//   coverImage: {
//     type: String,
//   },
//   watchHistory: {
//     type: Schema.Types.ObjectId,
//     ref: "Video"
//   },
//   password: {
//     type: String,
//     required: true
//   },
  
//     refreshToken: {
//         type: String
//     }
  

// },{
//   timestamps: true
// })

// userSchema.pre("save", async function (next){
//   if(!this.ismodified("password", )) return next();

//   this.password = bcrypt.hash (this.password, 10)
//   next()
// })

// userSchema.methods.isPasswordCorrect = async function (password)
// {
//   return await bcrypt.compare(password, this.password )
// }

// userSchema.methods.generateAccessToken = function(){
//   JsonWebTokenError.sign(
//     {
//       _id: this._id,
//       email: this.email,
//       username: this.username,
//       fullName: this.fullName
//     },
//     process.env.ACCESS_TOKEN_SECRET,{
//       expiresin:process.env.ACCESS_TOKEN_EXPIRY
//     }
//   )

// }

// userSchema.methods.generateRefreshToken = function(){
//   JsonWebTokenError.sign(
//     {
//       _id: this._id
//     },
//     process.env.REFRESH_TOKEN_SECRET,{
//       expiresin:process.env.REFRESH_TOKEN_EXPIRY
//     }
//   )
// }

// export const User= mongoose.model("User", userSchema)

// export { jwt }


import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt"; // Use default import
import jwt from "jsonwebtoken"; // Use default import

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  avatar: {
    type: String, // Cloudinary avatar
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  coverImage: {
    type: String,
  },
  watchHistory: {
    type: Schema.Types.ObjectId,
    ref: "Video",
  },
  password: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
  },
}, {
  timestamps: true,
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  this.password = await bcrypt.hash(this.password, 10); // Fix async hash
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY } // Fix expiresIn spelling
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

export const User = mongoose.model("User", userSchema);

export { jwt }; // Default import, now exported properly
