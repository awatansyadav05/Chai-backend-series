import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js"
import { verifyJWT } from "../middleware/auth.middleware.js";
import { publishAVideo } from "../contollers/video.contoller.js";
//import multer from "multer";

const router = Router();
router.use(verifyJWT);

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

