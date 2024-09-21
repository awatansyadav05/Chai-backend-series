import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

//{DB_NAME is the name database to which you want to connect }


const connectDB = async () =>{
  //mongoose.connect() porvides connection between mongodb_uri and db_name
  try{
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    )
    console.log(`\n MongoDB connected !! DB host: ${connectionInstance.connection.host}`);
    
  }
  catch (error) {
    console.log("MONGODB connection failed", error);
    process.exit(1);
  }
}

export default connectDB;