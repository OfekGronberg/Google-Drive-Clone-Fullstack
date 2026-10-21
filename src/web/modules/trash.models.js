"use strict";

const { models } = require("../db");

const { File, Permission } = models;

/**
 * Get all trashed files for a user (filtered by permissions)
 * @param {string} userId - The user ID
 * @returns {Array} - Array of trashed file objects
 */
exports.getTrashedFiles = async (userId) => {
  const allFiles = await File.find({ deletedAt: { $ne: null } }).lean();

  const result = [];
  for (const file of allFiles) {
    const perms = await Permission.find({ fileId: String(file._id), userId: String(userId) }).lean();
    if (!perms.length) continue;

    const { ex2Name, _id, ...pub } = file;
    result.push({
      id: _id,
      ...pub,
      starred: pub.starred || false,
      deletedAt: pub.deletedAt
    });
  }

  return result;
};
