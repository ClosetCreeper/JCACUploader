import formidable from "formidable";
import { google } from "googleapis";

// Disable default bodyParser for file upload
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  const form = new formidable.IncomingForm({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ success: false, error: "Form parse error" });
    }

    const file = files.file;
    if (!file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    try {
      const fs = await import("fs/promises");
      const buffer = await fs.readFile(file.filepath);

      const auth = new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET
      );

      auth.setCredentials({
        refresh_token: process.env.REFRESH_TOKEN,
      });

      const drive = google.drive({ version: "v3", auth });

      const response = await drive.files.create({
        requestBody: {
          name: file.originalFilename,
          parents: [process.env.FOLDER_ID],
        },
        media: {
          mimeType: file.mimetype || "application/octet-stream",
          body: Buffer.from(buffer),
        },
      });

      return res.status(200).json({ success: true, fileId: response.data.id });

    } catch (error) {
      console.error("Upload error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  });
}
