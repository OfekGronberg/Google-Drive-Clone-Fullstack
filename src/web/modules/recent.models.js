"use strict";

const { models } = require("../db");

const { Recent, File, Permission } = models;

/**
 * Get all recent files for a user
 * Returns files from the recent access queue in order (deduplicated, most recent first)
 */
exports.getRecentFiles = async (userId, limit = 50) => {
  const filter = userId ? { userId: String(userId) } : {};
  const recentDocs = await Recent.find(filter).sort({ accessedAt: -1 }).lean();

  const seen = new Set();
  const orderedIds = [];

  for (const doc of recentDocs) {
    const fileId = String(doc.fileId);
    if (seen.has(fileId)) continue;
    seen.add(fileId);
    orderedIds.push(fileId);
    if (orderedIds.length >= limit) break;
  }

  if (!orderedIds.length) return [];

  const files = await File.find({ _id: { $in: orderedIds } }).lean();
  const fileMap = new Map(files.map(f => [String(f._id), f]));

  const result = [];
  for (const fileId of orderedIds) {
    const file = fileMap.get(String(fileId));
    if (!file) continue;
    if (file.isSystem) continue;
    if (file.deletedAt) continue;

    const perms = await Permission.find({ fileId: String(fileId), userId: String(userId) }).lean();
    if (!perms.length) continue;

    result.push({
      id: file._id,
      name: file.name,
      type: file.type,
      starred: file.starred || false
    });
  }

  return result;
};
