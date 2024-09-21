import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken, updateAvatar, updateUser, updateCoverImage } from "../contollers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js"
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router()

router.route("/register", registerUser).post(
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

router.route("/update-coverImage").patch(verifyJWT, upload.single("coverImage"),updateCoverImage )
router.route("/update-user").patch(verifyJWT, updateUser);

export default router