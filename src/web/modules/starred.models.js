"use strict";

const { models, generateId } = require("../db");

const { File, User } = models;

/**
 * Toggle starred status of a file
 * @param {string} fileId - The file ID to toggle
 * @returns {boolean|null} - New starred status, or null if file not found
 */
exports.toggleStarred = async (fileId) => {
  const item = await File.findById(String(fileId));
  if (!item) return null;

  item.starred = !item.starred;
  await item.save();
  
  return item.starred;
};

/**
 * Set starred status of a file and create/remove shortcut in Starred folder
 * @param {string} fileId - The file ID
 * @param {boolean} starred - The starred status to set
 * @param {string} userId - The user ID to create shortcut for
 * @returns {boolean|null} - New starred status, or null if file not found
 */
exports.setStarred = async (fileId, starred, userId = null) => {
  const item = await File.findById(String(fileId));
  if (!item) return null;

  // Set the starred flag on the file itself
  item.starred = Boolean(starred);
  await item.save();

  // If userId provided, create/remove shortcut in user's Starred folder
  if (userId) {
    const user = await User.findById(String(userId)).lean();
    if (user && user.starredFolderId) {
      if (starred) {
        await createShortcutInStarred(fileId, user.starredFolderId, userId);
      } else {
        await removeShortcutFromStarred(fileId, user.starredFolderId);
      }
    }
  }
  
  return item.starred;
};

// Helper: Create a shortcut to a file in the Starred folder
const createShortcutInStarred = async (targetFileId, starredFolderId, userId) => {
  const originalFile = await File.findById(String(targetFileId)).lean();
  if (!originalFile) return;

  const starredFolder = await File.findById(String(starredFolderId)).lean();
  if (!starredFolder || starredFolder.type !== "folder") return;

  const shortcutExists = await File.findOne({
    parentId: String(starredFolderId),
    type: "shortcut",
    targetId: String(targetFileId)
  }).lean();

  if (shortcutExists) return;

  const shortcutId = generateId();
  const shortcut = {
    _id: shortcutId,
    name: originalFile.name,
    type: "shortcut",
    targetId: String(targetFileId),
    parentId: String(starredFolderId),
    starred: false
  };

  await File.create(shortcut);

  const permissionsModel = require("./permissions.models");
  await permissionsModel.create(shortcutId, userId, "owner");
};

// Helper: Remove shortcut from Starred folder
const removeShortcutFromStarred = async (targetFileId, starredFolderId) => {
  try {
    const starredFolder = await File.findById(String(starredFolderId)).lean();
    if (!starredFolder || starredFolder.type !== "folder") return;

    await File.deleteMany({
      parentId: String(starredFolderId),
      type: "shortcut",
      targetId: String(targetFileId)
    });
  } catch (err) {
    console.error("removeShortcutFromStarred error:", err);
  }
};

/**
 * Get all starred files for a user (shortcuts in their Starred folder)
 * @param {string} userId - The user ID
 * @returns {Array} - Array of starred file objects (shortcuts and their targets)
 */
exports.getStarredFiles = async (userId) => {
  const user = await User.findById(String(userId)).lean();
  if (!user || !user.starredFolderId) return [];

  const shortcuts = await File.find({ parentId: String(user.starredFolderId), type: "shortcut" }).lean();

  const result = [];
  for (const shortcut of shortcuts) {
    if (!shortcut.targetId) continue;
    const target = await File.findById(String(shortcut.targetId)).lean();
    if (!target || target.deletedAt) continue;
    result.push({
      id: shortcut._id,
      name: target.name,
      type: target.type,
      starred: true,
      targetId: shortcut.targetId
    });
  }

  return result;
};
