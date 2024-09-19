

import cloudinary from "cloudinary";
import fs from "fs";

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

export { uploadOnCloudinary };
