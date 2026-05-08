// src/lib/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function ensureConfig() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET)
    throw new Error("Cloudinary env missing");
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
}

export async function uploadBuffer(
  buffer: Buffer,
  folder: string,
): Promise<string> {
  ensureConfig();
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder, format: "webp", transformation: [{ quality: "auto" }] },
        (err, result) => {
          if (err || !result) reject(err ?? new Error("Upload failed"));
          else resolve(result.secure_url);
        },
      )
      .end(buffer);
  });
}

export async function uploadBase64Image(base64: string): Promise<string> {
  ensureConfig();
  const mimeMatch = base64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  if (!mimeMatch) throw new Error("Invalid image data URL");
  if (!ALLOWED_MIME.includes(mimeMatch[1])) {
    throw new Error(`Invalid format: ${mimeMatch[1]}`);
  }
  const bytes = Buffer.from(
    base64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, ""),
    "base64",
  ).length;
  if (bytes > MAX_IMAGE_BYTES) throw new Error("Image exceeds 5 MB");

  ensureConfig();
  const result = await cloudinary.uploader.upload(base64, {
    folder: "projects",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    resource_type: "image",
  });
  return result.secure_url;
}

export async function deleteCloudinaryImage(url: string): Promise<void> {
  try {
    ensureConfig();
    const after = url.split("/upload/")[1];
    if (!after) return;
    const publicId = after.replace(/^v\d+\//, "").replace(/\.[^/.]+$/, "");
    await cloudinary.uploader.destroy(publicId);
  } catch (e) {
    console.error("[deleteCloudinaryImage]", e);
  }
}
