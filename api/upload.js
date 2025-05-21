import formidable from "formidable";
import { google } from "googleapis";
import fs from "fs/promises";

// Disable Next.js bodyParser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log("📡 Received request to /api/upload");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = new formidable.IncomingForm({ multiples: false });

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
      const buffer = await fs.readFile(file.filepath);

      const auth = new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET
      );

      auth.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

      const drive = google.drive({ version: "v3", auth });

      console.log("📤 Uploading to Google Drive...");

      const response = await drive.files.create({
        requestBody: {
          name: file.originalFilename,
          parents: [process.env.FOLDER_ID],
        },
        media: {
          mimeType: file.mimetype,
          body: Buffer.from(buffer),
        },
      });

      console.log("✅ Upload successful:", response.data.id);
      return res.status(200).json({ success: true, fileId: response.data.id });

    } catch (error) {
      console.error("❌ Upload error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  });
}
