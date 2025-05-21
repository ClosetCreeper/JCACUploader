import formidable from "formidable";
import { google } from "googleapis";

// Disable default bodyParser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const form = new formidable.IncomingForm({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Formidable error:", err);
      res.status(500).send("Form parse error");
      return;
    }

    const file = files.file;
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

    try {
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

      res.status(200).json({ success: true, fileId: response.data.id });
    } catch (error) {
      console.error("Google Drive upload error:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}
