import express from "express"
import multer from "multer"
import { v2 as cloudinary } from "cloudinary"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import { pipeline } from "stream"
import { createGzip } from "zlib"
import json2csv from "json2csv"

import { saveauthorsAvatars, writeauthors, getblogPostsReadableStream } from "../../lib/fs-tools.js"
import { getAuthors } from "../../lib/fs-tools.js"
import { getPDFReadableStream, generatePDFAsync } from "../../lib/pdf-tools.js"

const filesRouter = express.Router()

console.log("CLOUDINARY URL: ", process.env.CLOUDINARY_URL)

const cloudinaryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary, // search automatically for process.env.CLOUDINARY_URL
    params: {
      folder: "oct21",
    },
  }),
}).single("avatar")

filesRouter.post("/uploadSingle", multer().single("avatar"), async (req, res, next) => {
  // "avatar" does need to match exactly to the name used in FormData field in the frontend, otherwise Multer is not going to be able to find the file in the req.body
  try {
    console.log("FILE: ", req.file)
    await saveauthorsAvatars(req.file.originalname, req.file.buffer)
    res.send("Ok")
  } catch (error) {
    next(error)
  }
})

filesRouter.post("/uploadMultiple", multer().array("avatar"), async (req, res, next) => {
  try {
    console.log("FILES: ", req.files)

    const arrayOfPromises = req.files.map(file => saveauthorsAvatars(file.originalname, file.buffer))
    await Promise.all(arrayOfPromises)
    res.send("Ok")
  } catch (error) {
    next(error)
  }
})

filesRouter.post("/:userId/cloudinaryUpload", cloudinaryUploader, async (req, res, next) => {
  try {
    console.log(req.file)
    const authors = await getAuthors()

    const index = authors.findIndex(user => user.id === req.params.userId)

    const oldUser = authors[index]

    const updatedUser = { ...oldUser, avatar: req.file.path }

    authors[index] = updatedUser

    await writeauthors(authors)
    res.send("Uploaded on Cloudinary!")
  } catch (error) {
    next(error)
  }
})

filesRouter.get("/downloadJSON", (req, res, next) => {
  try {
    // SOURCE (file on disk, http requests,...) --> DESTINATION (file on disk, terminal, http responses,...)

    // In this example we are going to have: SOURCE (file on disk: blogPosts.json) --> DESTINATION (http response)

    res.setHeader("Content-Disposition", "attachment; filename=blogPosts.json.gz") // This header tells the browser to open the "Save file on Disk" dialog

    const source = getblogPostsReadableStream()
    const transform = createGzip()
    const destination = res

    pipeline(source, transform, destination, err => {
      if (err) next(err)
    })
  } catch (error) {
    next(error)
  }
})

filesRouter.get("/downloadPDF", (req, res, next) => {
  try {
    res.setHeader("Content-Disposition", "attachment; filename=test.pdf")

    const source = getPDFReadableStream("EXAMPLE TEXT")
    const destination = res
    pipeline(source, destination, err => {
      if (err) next(err)
    })
  } catch (error) {
    next(error)
  }
})

filesRouter.get("/downloadCSV", (req, res, next) => {
  try {
    // SOURCE (blogPosts.json) --> TRANSFORM (csv) --> DESTINATION (res)

    res.setHeader("Content-Disposition", "attachment; filename=blogPosts.csv")

    const source = getblogPostsReadableStream()
    const transform = new json2csv.Transform({ fields: ["asin", "title", "price", "category"] })
    const destination = res

    pipeline(source, transform, destination, err => {
      if (err) next(err)
    })
  } catch (error) {
    next(error)
  }
})

// 1. generate pdf with streams
// I would like to have something like await generatePDFAsync()
// 2. use pdf somehow (example --> send it as an attachment to an email)
// await sendEmail({attachment: path})

filesRouter.get("/asyncPDF", async (req, res, next) => {
  try {
    const path = await generatePDFAsync("SOME TEXT")
    // await sendEmail({ attachment: path }) // if generation of PDF is NOT async, I'm not sure that on this line here the PDF has been generated completely and correctly. If we do not await for the pdf to be generated and we send an email with that file, the result could be a corrupted PDF file
    res.send({ path })
  } catch (error) {
    next(error)
  }
})

export default filesRouter
