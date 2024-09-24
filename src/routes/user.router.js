import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken, updateAvatar, updateUser, updateCoverImage, changeUserPassword, currentUser, getUserChannelProfile, getWatchHistory } from "../contollers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js"
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router()

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1
    },
    {
      name: "coverImage",
      maxCount: 1
    }
  ]),
  registerUser
)

router.route("/login").post(loginUser)

//jp bhi hum post or get likh rhe h wo hi same hum postman se request access krenge

router.route("/logout").post(verifyJWT, logoutUser)

//endpoint
//In this we didn't verifyjwt as because we have already verfiyjwt in the contoller
router.route("/refresh-token").post(refreshAccessToken);

router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar);

router.route("/update-coverImage").patch(verifyJWT, upload.single("coverImage"), updateCoverImage)
router.route("/update-user").patch(verifyJWT, updateUser);
router.route("/change-password").post(verifyJWT, changeUserPassword);
router.route("/current-user").get(verifyJWT, currentUser);

//we are writing diff because the username we are sending in params that's why we have written in this route
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/history").get(verifyJWT, getWatchHistory);
export default router