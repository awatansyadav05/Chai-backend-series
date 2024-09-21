import multer from "multer";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp")
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

export const upload = multer({
  storage,
})

//.diskStorage -- used for the saving files directly to disk, allowing for custom file name changing and direectory changing.

//destination and filename are the functions that determine how and where files are uploded files are stored and how they are manage. 
//--destination, where file is finally stored. 