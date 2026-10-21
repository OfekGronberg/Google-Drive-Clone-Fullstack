"use strict";

const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth.middleware");

const imagesController = require("../controllers/images.controller");

// /api/images
// POST - Upload image (requires auth)
router.post("/", requireAuth, imagesController.uploadImage);

// /api/images/:id
// GET - Retrieve image binary (no auth required for public images)
router.get("/:id", imagesController.getImage);

// /api/images/:id/info
// GET - Get image metadata (requires auth)
router.get("/:id/info", requireAuth, imagesController.getImageInfo);

// /api/images/:id
// DELETE - Delete image (requires auth)
router.delete("/:id", requireAuth, imagesController.deleteImage);

module.exports = router;
