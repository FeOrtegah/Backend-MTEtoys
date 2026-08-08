import cloudinary from "../config/cloudinary.js";

const streamUpload = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "mtetoys" },
      (error, result) => (result ? resolve(result) : reject(error))
    );
    stream.end(buffer);
  });

export const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No se enviaron archivos" });
    }

    const uploads = await Promise.all(req.files.map((f) => streamUpload(f.buffer)));
    const urls = uploads.map((r) => r.secure_url);

    res.status(201).json({ urls });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};