import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js"
import { verifyJWT } from "../middleware/auth.middleware.js";
import { publishAVideo } from "../contollers/video.contoller.js";
//import multer from "multer";


//verifaction must be done from jwt.. for uploading video login user must be.
//if not the unaccess aunthorization will occur.
const router = Router();
router.use(verifyJWT);

//multer used--middleware

//for writing router the --> router.route("/publish") publish act as the prefix of the url. 
// Use of "POST" mehtod to uploading file to the "cloudinary" 
//we are using fields method for uploading the more than one file. 
// eg.. "/publish" the url will hit the publishAvideo contoller
router.route("/publish").post(
    upload.fields(
      [
        {
          name: "videoFile",
          maxCount: 1
        },
        {
          name: "thumbnail",
          maxCount: 1
        }
      ]
    ),
    publishAVideo
  )

  export default router

