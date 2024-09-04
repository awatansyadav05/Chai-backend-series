import {asyncHandler} from "../utiles/asyncHandler.js"
const regsiterUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: "ok"
  })
})

export { regsiterUser }