const formidable = require("formidable");
const { google } = require("googleapis");
const fs = require("fs");

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("❌ Formidable error:", err);
      return res.status(500).json({ success: false, error: "Form parse error" });
    }

    const file = files.file;
    if (!file) {
      console.error("❌ No file found in request.");
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    try {
      const fileStream = fs.createReadStream(file.filepath);

      const auth = new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET
      );
      auth.setCredentials({
        refresh_token: process.env.REFRESH_TOKEN,
      });

      const drive = google.drive({ version: "v3", auth });

      const driveResponse = await drive.files.create({
        requestBody: {
          name: file.originalFilename,
          parents: [process.env.FOLDER_ID],
        },
        media: {
          mimeType: file.mimetype,
          body: fileStream,
        },
      });

      console.log("✅ Uploaded:", driveResponse.data.id);
      return res.status(200).json({ success: true, fileId: driveResponse.data.id });

    } catch (uploadErr) {
      console.error("❌ Upload failed:", uploadErr);
      return res.status(500).json({ success: false, error: uploadErr.message });
    }
  });
}
