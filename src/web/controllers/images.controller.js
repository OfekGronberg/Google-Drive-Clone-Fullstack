"use strict";

const imagesModel = require("../modules/images.models");

/**
 * POST /api/images
 * Upload an image (base64 encoded)
 * Body: { "image": "data:image/jpeg;base64,...", "filename": "optional" }
 */
exports.uploadImage = async (req, res) => {
  try {
    const { image } = req.body || {};
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "image is required and must be a string" });
    }

    // Parse data URL format (e.g., "data:image/jpeg;base64,/9j/4AAQSkZJRg...")
    let data = image;
    let mimeType = "image/jpeg";

    if (image.startsWith("data:")) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        data = match[2];
      } else {
        return res.status(400).json({ error: "invalid image format" });
      }
    }

    // Create image via model
    const result = await imagesModel.createImage(data, mimeType, userId);

    return res.status(201).json(result);
  } catch (e) {
    console.error("Image upload error:", e);
    return res.status(500).json({ error: "internal server error" });
  }
};

/**
 * GET /api/images/:id
 * Retrieve an image by ID
 * Returns the image binary data with appropriate Content-Type header
 */
exports.getImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await imagesModel.getImageById(id);
    if (!image) {
      return res.status(404).json({ error: "image not found" });
    }

    // Set appropriate Content-Type
    res.set("Content-Type", image.mimeType);
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");

    // Return binary image data
    const buffer = Buffer.from(image.data, "base64");
    return res.status(200).end(buffer);
  } catch (e) {
    console.error("Image retrieval error:", e);
    return res.status(500).json({ error: "internal server error" });
  }
};

/**
 * GET /api/images/:id/info
 * Get image metadata (without binary data)
 */
exports.getImageInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const info = await imagesModel.getImageInfo(id, userId);
    if (!info) {
      return res.status(404).json({ error: "image not found" });
    }

    return res.status(200).json(info);
  } catch (e) {
    if (e.status === 403) {
      return res.status(403).json({ error: "forbidden" });
    }
    console.error("Image info error:", e);
    return res.status(500).json({ error: "internal server error" });
  }
};

/**
 * DELETE /api/images/:id
 * Delete an image
 */
exports.deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const deleted = await imagesModel.deleteImage(id, userId);
    if (!deleted) {
      return res.status(404).json({ error: "image not found" });
    }

    return res.status(204).end();
  } catch (e) {
    if (e.status === 403) {
      return res.status(403).json({ error: "forbidden" });
    }
    console.error("Image delete error:", e);
    return res.status(500).json({ error: "internal server error" });
  }
};