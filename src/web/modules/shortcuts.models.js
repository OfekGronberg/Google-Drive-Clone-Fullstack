"use strict";

const { models, generateId } = require("../db");

const { File } = models;

/**
 * Get or create system folders for a user (Starred, Trash, Recent)
 * These folders are hidden from normal navigation (isSystemFolder: true)
 * @param {string} userId - The user ID
 * @returns {Object} - { starred, trash, recent } folder objects
 */
exports.getOrCreateSystemFolders = async (userId) => {
  const userId_str = String(userId);
  
  // Helper to find or create a system folder
  const getOrCreateFolder = async (name, type = "system-folder") => {
    const existing = await File.findOne({
      isSystemFolder: true,
      ownerId: userId_str,
      name,
      type: "folder"
    }).lean();

    if (existing) return existing;

    const id = generateId();
    const folder = {
      _id: id,
      name,
      type: "folder",
      ownerId: userId_str,
      isSystemFolder: true,
      parentId: null
    };

    await File.create(folder);

    const permissionsModel = require("./permissions.models");
    await permissionsModel.create(id, userId_str, "owner");

    return { id, ...folder };
  };
  
  return {
    starred: await getOrCreateFolder("Starred"),
    trash: await getOrCreateFolder("Trash"),
    recent: await getOrCreateFolder("Recent")
  };
};

/**
 * Create a shortcut to a file in a target folder
 * @param {string} targetId - ID of file being linked to
 * @param {string} parentId - ID of folder to create shortcut in
 * @returns {Object} - The shortcut object
 */
exports.createShortcut = async (targetId, parentId) => {
  const targetId_str = String(targetId);
  const parentId_str = String(parentId);
  
  const target = await File.findById(targetId_str).lean();
  if (!target) {
    const err = new Error("Target file not found");
    err.status = 404;
    throw err;
  }
  
  const parent = await File.findById(parentId_str).lean();
  if (!parent || parent.type !== "folder") {
    const err = new Error("Parent must be a folder");
    err.status = 400;
    throw err;
  }
  
  const id = generateId();
  const shortcut = {
    _id: id,
    name: target.name,
    type: "shortcut",
    targetId: targetId_str,
    parentId: parentId_str
  };

  await File.create(shortcut);

  return { id, ...shortcut };
};

/**
 * Resolve a shortcut or return the file as-is
 * If file is a shortcut, returns the target file
 * @param {string} fileId - ID of file (could be shortcut or regular file)
 * @returns {Object|null} - The resolved file or null
 */
exports.resolveFile = async (fileId) => {
  const file = await File.findById(String(fileId)).lean();
  if (!file) return null;
  
  if (file.type === "shortcut" && file.targetId) {
    return await File.findById(String(file.targetId)).lean();
  }
  
  return file;
};

/**
 * Get all shortcuts pointing to a target
 * @param {string} targetId - ID of target file
 * @returns {Array} - Array of shortcut objects
 */
exports.getShortcutsTo = async (targetId) => {
  const targetId_str = String(targetId);
  return await File.find({ type: "shortcut", targetId: targetId_str }).lean();
};

/**
 * Delete shortcut by ID
 * @param {string} shortcutId - ID of shortcut to delete
 * @returns {boolean} - Success
 */
exports.deleteShortcut = async (shortcutId) => {
  const res = await File.deleteOne({ _id: String(shortcutId) });
  return res.deletedCount > 0;
};
