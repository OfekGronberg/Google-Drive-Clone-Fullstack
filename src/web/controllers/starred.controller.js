"use strict";

const starredModel = require("../modules/starred.models");
const Permissions = require("../modules/permissions.models");

// PUT /api/files/:id/star - Star a file (creates a shortcut in Starred folder)
exports.starFile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    // Check if user is the owner of the file
    const userPermissions = await Permissions.findAll(id);
    const userPerm = userPermissions.find(p => String(p.userId) === String(userId));
    
    if (!userPerm || String(userPerm.role) !== "owner") {
      return res.status(403).json({ error: "Only the owner of this file can star it" });
    }

    const starred = await starredModel.setStarred(id, true, userId);
    if (starred === null) {
      return res.status(404).json({ error: "not found" });
    }

    return res.status(200).json({ starred });
  } catch (e) {
    return res.status(500).json({ error: "internal server error" });
  }
};

// DELETE /api/files/:id/star - Unstar a file (removes shortcut from Starred folder)
exports.unstarFile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    // Check if user is the owner of the file
    const userPermissions = await Permissions.findAll(id);
    const userPerm = userPermissions.find(p => String(p.userId) === String(userId));
    
    if (!userPerm || String(userPerm.role) !== "owner") {
      return res.status(403).json({ error: "Only the owner of this file can unstar it" });
    }

    const starred = await starredModel.setStarred(id, false, userId);
    if (starred === null) {
      return res.status(404).json({ error: "not found" });
    }

    res.status(200).json({ starred });
  } catch (e) {
    res.status(500).json({ error: "internal server error" });
  }
};

// GET /api/starred - Get all starred files for the authenticated user
exports.getStarredFiles = async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    const files = await starredModel.getStarredFiles(userId);
    return res.status(200).json(files);
  } catch (e) {
    return res.status(500).json({ error: "internal server error" });
  }
};
