const express = require("express");
const multer = require("multer");
const { google } = require("googleapis");
const fs = require("fs");
const cors = require("cors");
require("dotenv").config();

const app = express();
const upload = multer({ dest: "uploads/" });
app.use(cors());

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

const drive = google.drive({ version: "v3", auth: oauth2Client });

app.post("/upload", upload.single("file"), async (req, res) => {
  const fileMetadata = {
    name: req.file.originalname,
    parents: [process.env.FOLDER_ID]
  };
  const media = {
    mimeType: req.file.mimetype,
    body: fs.createReadStream(req.file.path)
  };

  try {
    await drive.files.create({
      resource: fileMetadata,
      media,
      fields: "id"
    });
    fs.unlinkSync(req.file.path); // Clean up
    res.status(200).json({ message: "File uploaded" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
