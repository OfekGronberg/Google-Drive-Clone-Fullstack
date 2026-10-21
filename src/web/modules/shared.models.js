"use strict";

const { models, generateId } = require("../db");

const { File, User } = models;

/**
 * Get all files in the user's Shared with me folder (shortcuts to shared files)
 * @param {string} userId - The user ID
 * @returns {Array} - Array of shortcut objects pointing to shared files
 */
exports.getSharedFiles = async (userId) => {
  const user = await User.findById(String(userId)).lean();
  if (!user || !user.sharedFolderId) return [];

  const shortcuts = await File.find({ parentId: String(user.sharedFolderId), type: "shortcut" }).lean();
  const result = [];

  for (const shortcut of shortcuts) {
    if (!shortcut.targetId) continue;
    const target = await File.findById(String(shortcut.targetId)).lean();
    if (!target || target.deletedAt) continue;

    result.push({
      id: shortcut._id,
      name: target.name,
      type: target.type,
      starred: target.starred || false,
      targetId: shortcut.targetId
    });
  }

  return result;
};

/**
 * Create a shortcut to a file in the user's Shared with me folder
 * @param {string} targetFileId - The ID of the file being shared
 * @param {string} userId - The user ID to share with
 * @returns {object|null} - The created shortcut, or null if failed
 */
exports.createShortcutInShared = async (targetFileId, userId) => {
  const user = await User.findById(String(userId)).lean();
  if (!user || !user.sharedFolderId) return null;

  const originalFile = await File.findById(String(targetFileId)).lean();
  if (!originalFile) return null;

  const sharedFolder = await File.findById(String(user.sharedFolderId)).lean();
  if (!sharedFolder || sharedFolder.type !== "folder") return null;

  const shortcutExists = await File.findOne({
    parentId: String(user.sharedFolderId),
    type: "shortcut",
    targetId: String(targetFileId)
  }).lean();

  if (shortcutExists) return null;

  const shortcutId = generateId();
  const shortcut = {
    _id: shortcutId,
    name: originalFile.name,
    type: "shortcut",
    targetId: String(targetFileId),
    parentId: String(user.sharedFolderId),
    starred: false
  };

  await File.create(shortcut);

  const permissionsModel = require("./permissions.models");
  await permissionsModel.create(shortcutId, userId, "owner");

  return { id: shortcutId, ...shortcut };
};

/**
 * Remove shortcut from user's Shared with me folder
 * @param {string} targetFileId - The ID of the file being unshared
 * @param {string} userId - The user ID
 * @returns {boolean} - True if removed, false if not found
 */
exports.removeShortcutFromShared = async (targetFileId, userId) => {
  const user = await User.findById(String(userId)).lean();
  if (!user || !user.sharedFolderId) return false;

  const result = await File.deleteMany({
    parentId: String(user.sharedFolderId),
    type: "shortcut",
    targetId: String(targetFileId)
  });

  return result.deletedCount > 0;
};
