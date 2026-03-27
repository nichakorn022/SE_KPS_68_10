const crypto = require("crypto");
const path = require("path");
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const {
  R2_ENDPOINT,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_PUBLIC_BASE_URL
} = process.env;

function getClient() {
  if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    const error = new Error("R2 storage is not configured");
    error.statusCode = 500;
    throw error;
  }

  return new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY
    }
  });
}

function normalizeExtension(originalName, mimetype) {
  const ext = path.extname(originalName || "").toLowerCase();
  if (ext) return ext;

  switch (mimetype) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return "";
  }
}

function buildObjectKey(folder, entityId, originalName, mimetype) {
  const safeFolder = String(folder || "uploads").trim().toLowerCase();
  const safeEntityId = String(entityId || "misc").trim();
  const ext = normalizeExtension(originalName, mimetype);
  const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
  return `${safeFolder}/${safeEntityId}/${uniqueSuffix}${ext}`;
}

function buildPublicUrl(objectKey) {
  if (!R2_PUBLIC_BASE_URL) {
    const error = new Error("R2 public base URL is not configured");
    error.statusCode = 500;
    throw error;
  }

  return `${R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${objectKey}`;
}

async function uploadImageFile({ file, folder, entityId }) {
  if (!file) {
    const error = new Error("image file is required");
    error.statusCode = 400;
    throw error;
  }

  const client = getClient();
  const objectKey = buildObjectKey(folder, entityId, file.originalname, file.mimetype);

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      Body: file.buffer,
      ContentType: file.mimetype
    })
  );

  return {
    objectKey,
    imageUrl: buildPublicUrl(objectKey)
  };
}

function extractObjectKey(imagePath) {
  if (!imagePath || !R2_PUBLIC_BASE_URL) return null;

  const normalizedBase = R2_PUBLIC_BASE_URL.replace(/\/$/, "");
  if (!String(imagePath).startsWith(normalizedBase)) return null;

  return String(imagePath).slice(normalizedBase.length + 1);
}

async function deleteImageByPath(imagePath) {
  const objectKey = extractObjectKey(imagePath);
  if (!objectKey) return;

  const client = getClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey
    })
  );
}

module.exports = {
  uploadImageFile,
  deleteImageByPath
};
