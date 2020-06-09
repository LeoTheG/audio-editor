import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import AWS from "aws-sdk";
import { resolve } from "path";
import { v4 as uuidv4 } from "uuid";
import Database from "./database";

//@ts-ignore
const port = process.env.PORT || 8000;

require("dotenv").config({ path: resolve(__dirname, "..", ".env") });

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

const upload = multer();

const app = express();

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(bodyParser.json());
app.use(express.static(resolve(__dirname, "..", "build")));

app.listen(port, () => {
  console.log("Listening on port ", port);
});

app.post("/upload-song", upload.any(), (req, res) => {
  const file = req.files[0];
  const { songName, authorName } = req.body;
  const base64data = Buffer.from(file.buffer, "binary");
  const fileId = uuidv4();
  console.log("received upload song request", req.body);

  const bucketParams: AWS.S3.PutObjectRequest = {
    Bucket: "audio-player-clips",
    Key: fileId,
    Body: base64data,
    ContentType: file.mimetype,
    ACL: "public-read",
  };

  s3.upload(bucketParams, function (err, data) {
    if (err) {
      res.status(400).end();
      throw err;
    }
    console.log(`File uploaded successfully. ${data.Location}`);
    Database.addUpload(fileId, data.Location, songName, authorName);
    res.status(200).send({ id: fileId });
  });
});

app.get("/user-uploads", async (req, res) => {
  const uploads = await Database.getUploads();
  res.status(200).send({ uploads });
});

app.get("*", (req, res) => {
  res.sendFile(resolve(__dirname, "..", "build", "index.html"));
});
