"use strict";

const { models, generateId } = require("../db");

const { Image } = models;

/**
 * Create a new image
 * @param {string} base64Data - base64 encoded image data
 * @param {string} mimeType - MIME type (e.g., "image/jpeg")
 * @param {string} userId - ID of user uploading the image
 * @returns {Object} { id, mimeType, url }
 */
exports.createImage = async (base64Data, mimeType, userId) => {
  if (!base64Data || typeof base64Data !== "string") {
    throw new Error("Invalid image data");
  }

  if (!userId) {
    throw new Error("User ID is required");
  }

  // Validate it's real base64
  try {
    Buffer.from(base64Data, "base64");
  } catch (e) {
    throw new Error("Invalid base64 data");
  }

  const imageId = generateId();

  await Image.create({
    _id: imageId,
    data: base64Data,
    mimeType: mimeType || "image/jpeg",
    userId: String(userId),
    uploadedAt: new Date().toISOString()
  });

  return {
    id: imageId,
    mimeType: mimeType,
    url: `/api/images/${imageId}`
  };
};

/**
 * Get image by ID
 * @param {string} imageId
 * @returns {Object|null} image object or null if not found
 */
exports.getImageById = async (imageId) => {
  return await Image.findById(String(imageId)).lean();
};

/**
 * Delete image by ID
 * @param {string} imageId
 * @param {string} userId - ID of user attempting deletion
 * @returns {boolean} true if deleted, false if not found
 * @throws {Error} if user doesn't own the image
 */
exports.deleteImage = async (imageId, userId) => {
  const image = await Image.findById(String(imageId)).lean();
  
  if (!image) {
    return false;
  }

  // Check ownership
  if (String(image.userId) !== String(userId)) {
    const err = new Error("forbidden");
    err.status = 403;
    throw err;
  }

  await Image.deleteOne({ _id: String(imageId) });
  return true;
};

/**
 * Get all images for a user
 * @param {string} userId
 * @returns {Array} array of image objects
 */
exports.getImagesByUserId = async (userId) => {
  return await Image.find({ userId: String(userId) }).lean();
};

/**
 * Get image metadata (without binary data)
 * @param {string} imageId
 * @param {string} userId - ID of user requesting info
 * @returns {Object|null} metadata object or null
 * @throws {Error} if user doesn't own the image
 */
exports.getImageInfo = async (imageId, userId) => {
  const image = await Image.findById(String(imageId)).lean();
  
  if (!image) {
    return null;
  }

  // Check ownership
  if (String(image.userId) !== String(userId)) {
    const err = new Error("forbidden");
    err.status = 403;
    throw err;
  }

  return {
    id: image._id,
    mimeType: image.mimeType,
    uploadedAt: image.uploadedAt,
    url: `/api/images/${imageId}`
  };
};
