"use strict";

const trashModel = require("../modules/trash.models");

// GET /api/trash - Get all trashed files for the authenticated user
exports.getTrashedFiles = async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    const files = await trashModel.getTrashedFiles(userId);
    return res.status(200).json(files);
  } catch (e) {
    return res.status(500).json({ error: "internal server error" });
  }
};
