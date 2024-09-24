import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
const app = express()

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())



//routes import
//we have given the production level routing, we have given the proper router using app.use()
import userRouter from './routes/user.router.js'
import router from './routes/video.router.js'

//routes decalaration
// use of express middleware
app.use("/api/v1/users", userRouter);
app.use("/api/v1/video", router) //there router must be  call or imported otherwise all files are requierd error will show

//http://localhost:8000/api/v1/users/register 

export { app }