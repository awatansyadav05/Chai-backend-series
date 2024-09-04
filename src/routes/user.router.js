  import { Router } from "express";
  import { regsiterUser } from "../contollers/user.controller.js";

  const router = Router()

  router.route("/register").post(regsiterUser)

  export default router