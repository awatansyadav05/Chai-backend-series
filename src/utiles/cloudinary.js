
import cloudinary from "cloudinary";
import fs from "fs";
import { ApiError } from "./errorAPI.js";
import { getPublicIdFromUrl } from "./getPublicId.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localfilePath) => {
  try {
    if (!localfilePath) return null;

    const response = await cloudinary.v2.uploader.upload(localfilePath, {
      resource_type: "auto"
    });

    console.log("File uploaded to Cloudinary:", response.url);
    fs.unlinkSync(localfilePath); // Remove local file after upload
    return response;

  } catch (error) {
    console.error("Error uploading file to Cloudinary:", error.message);
    fs.unlinkSync(localfilePath); // Remove local file even if upload fails
    return null;
  }
};

const deleteFromCloudinary = async (imagePath) => {
  try {
    if (!imagePath) {
      throw new ApiError(402, "Image not found");
    }

    //trim the public id from the url of both avatar and coverImage 
    //now use the both public id as for matching and the delete the image and update the file
    const publicId = getPublicIdFromUrl(imagePath);
    //console.log("publicId is: ", publicId);

    const response = await cloudinary.v2.uploader.destroy(publicId, {
      resource_type: "image"
    });

    return response;
  } catch (err) {
    //console.error("Error deleting file from Cloudinary:", err.message);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
