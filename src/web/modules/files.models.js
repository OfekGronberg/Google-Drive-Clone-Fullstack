"use strict";

const { models, generateId } = require("../db");
const tcp = require("../lib/tcpConnector");
const permissionsModel = require("./permissions.models");

const { File, Permission, User, Recent } = models;

// Generate a filesystem-safe EX2 name from id + display name
const makeEx2Name = (id, name) => {
  const safeName = String(name || "").replace(/\s+/g, "_");
  return `${id}_${safeName}`;
};

// Helper: Check if user has permission to access a file
const hasPermission = async (fileId, userId) => {
  const perms = await Permission.find({ fileId: String(fileId), userId: String(userId) }).lean();
  return perms.length > 0;
};

// Helper: Check if user can edit a file (must be Owner or Editor)
const canEditFile = async (fileId, userId) => {
  if (!userId) return false;

  const item = await File.findById(String(fileId)).lean();
  if (item && item.ownerId && String(item.ownerId) === String(userId)) {
    return true;
  }

  const perms = await Permission.find({ fileId: String(fileId), userId: String(userId) }).lean();
  const userPerm = perms[0];
  if (userPerm) {
    const role = String(userPerm.role || "").toLowerCase();
    return role === "editor" || role === "owner";
  }

  return false;
};

// Helper: Check if moving a file to newParentId would create a circular dependency
const wouldCreateCircularMove = async (fileId, newParentId) => {
  if (!newParentId) return false;

  let currentId = newParentId;
  const visited = new Set();

  while (currentId) {
    if (currentId === fileId) {
      return true;
    }

    if (visited.has(currentId)) {
      break;
    }
    visited.add(currentId);

    const parent = await File.findById(String(currentId)).lean();
    currentId = parent?.parentId || null;
  }

  return false;
};

const addToRecent = async (fileId, userId = null) => {
  const recentId = generateId();
  const doc = {
    _id: recentId,
    fileId: String(fileId),
    accessedAt: new Date()
  };
  if (userId) doc.userId = String(userId);

  await Recent.create(doc);

  const filter = userId ? { userId: String(userId) } : { userId: { $exists: false } };
  const total = await Recent.countDocuments(filter);
  const maxSize = 50;
  if (total > maxSize) {
    const extra = total - maxSize;
    const old = await Recent.find(filter).sort({ accessedAt: 1 }).limit(extra).lean();
    const ids = old.map(r => r._id);
    if (ids.length) {
      await Recent.deleteMany({ _id: { $in: ids } });
    }
  }
};

const getChildrenOf = async (parentId) => {
  return await File.find({ parentId: String(parentId) }).lean();
};

const getTopLevel = async () => {
  return await File.find({ parentId: null }).lean();
};

const getAllFiles = async () => {
  return await File.find({}).lean();
};

const getDescendantsOf = async (id) => {
  const allFiles = await getAllFiles();
  const byParent = new Map();

  for (const file of allFiles) {
    const pid = file.parentId || null;
    if (!byParent.has(pid)) byParent.set(pid, []);
    byParent.get(pid).push(file);
  }

  const descendants = [];
  const stack = [String(id)];

  while (stack.length) {
    const current = stack.pop();
    const children = byParent.get(current) || [];
    for (const child of children) {
      descendants.push(child);
      stack.push(String(child._id));
    }
  }

  return descendants;
};

// Parse EX2 protocol response into { code, body }
const parseEx2 = (resp) => {
  const s = String(resp || "");
  const code = parseInt(s.split(/\s+/)[0], 10) || 500;
  const parts = s.split(/\r?\n\r?\n/);
  const body = parts.length >= 2 ? parts.slice(1).join("\n\n") : "";
  return { code, body };
};

// GET all top-level items (filtered by user permissions)
exports.listTopLevel = async (userId = null) => {
  const items = await getTopLevel();

  const filteredItems = userId
    ? (await Promise.all(items.map(async (item) => {
        if (item.deletedAt) return null;
        const allowed = await hasPermission(item._id, userId);
        return allowed ? item : null;
      }))).filter(Boolean)
    : items;

  return filteredItems.map(n => ({ id: n._id, name: n.name, type: n.type, starred: n.starred || false }));
};

exports.createFileOrFolder = async (name, type, ownerId = null, parentId = null, content = "") => {
  const id = generateId();

  const item = {
    _id: id,
    name,
    type,
    createdAt: Date.now(),
    lastViewed: Date.now(),
    lastChange: Date.now(),
    parentId: parentId ? String(parentId) : null,
    starred: false
  };

  if (ownerId) {
    item.ownerId = String(ownerId);
  }

  if (type === "file") {
    const ex2Name = makeEx2Name(id, name);
    item.ex2Name = ex2Name;

    const safeContent = (typeof content === "string") ? content : "";
    const resp = await tcp.postFile(ex2Name, safeContent);

    if (!String(resp).startsWith("201")) {
      const status = parseInt(String(resp).split(/\s+/)[0], 10) || 500;
      const err = new Error(`Ex2 post failed: ${resp}`);
      err.status = status;
      throw err;
    }
  }

  await File.create(item);

  if (ownerId) {
    await permissionsModel.create(id, ownerId, "owner");
  }

  const { ex2Name, parentId: _, _id, ...rest } = item;
  const pub = { id: _id, ...rest };

  await addToRecent(_id, ownerId);

  return pub;
};

// GET by id - returns metadata + content (for files) or children (for folders)
// If it's a shortcut, resolves to the target file
exports.getById = async (id, userId = null) => {
  let item = await File.findById(String(id)).lean();
  if (!item) return null;

  if (userId && !(await hasPermission(id, userId))) {
    const err = new Error("Permission denied");
    err.status = 403;
    throw err;
  }

  let targetItem = item;
  if (item.type === "shortcut" && item.targetId) {
    targetItem = await File.findById(String(item.targetId)).lean();
    if (!targetItem) return null;

    if (userId && !(await hasPermission(targetItem._id, userId))) {
      const err = new Error("Permission denied");
      err.status = 403;
      throw err;
    }
  }

  // Return previous lastViewed, then update it to now
  const previousLastViewed = targetItem.lastViewed ?? null;
  const now = new Date();
  await File.updateOne(
    { _id: String(targetItem._id) },
    { $set: { lastViewed: now } },
    { timestamps: false }
  );

  const pub = {
    id: item._id,
    name: targetItem.name,
    type: targetItem.type,
    parentId: item.parentId,
    createdAt: targetItem.createdAt,
    lastViewed: previousLastViewed,
    lastChange: targetItem.updatedAt,
    starred: targetItem.starred || false,
    targetId: item.type === "shortcut" ? item.targetId : undefined
  };

  await addToRecent(id, userId);

  if (targetItem.type === "file") {
    try {
      const physicalName = targetItem.ex2Name || targetItem.name;
      const resp = await tcp.getFile(physicalName);
      const { code, body } = parseEx2(resp);
      if (code === 200) pub.content = body;
      else if (code === 404) pub.content = null;
      else {
        const err = new Error(`Ex2 get failed: ${resp}`);
        err.status = code || 500;
        throw err;
      }
    } catch (e) {
      pub.content = null;
    }
  }

  if (targetItem.type === "folder") {
    let visibleChildren = [];

    if (userId) {
      const user = await User.findById(String(userId)).lean();
      const isTrashFolder = user && user.trashFolderId === targetItem._id;
      const isStarredFolder = user && user.starredFolderId === targetItem._id;
      const isRecentFolder = user && user.recentFolderId === targetItem._id;
      const isSharedFolder = user && user.sharedFolderId === targetItem._id;

      if (isTrashFolder) {
        const trashed = await File.find({ deletedAt: { $ne: null } }).lean();
        const filtered = [];
        for (const file of trashed) {
          const allowed = await hasPermission(file._id, userId);
          if (!allowed) continue;
          const { _id, ex2Name, ...pubFile } = file;
          filtered.push({ id: _id, ...pubFile, starred: pubFile.starred || false, deletedAt: pubFile.deletedAt });
        }
        visibleChildren = filtered;
      } else if (isStarredFolder) {
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
        visibleChildren = result;
      } else if (isRecentFolder) {
        const recentDocs = await Recent.find({ userId: String(userId) }).sort({ accessedAt: -1 }).lean();
        const seen = new Set();
        const orderedIds = [];
        for (const doc of recentDocs) {
          const fileId = String(doc.fileId);
          if (seen.has(fileId)) continue;
          seen.add(fileId);
          orderedIds.push(fileId);
        }
        if (orderedIds.length) {
          const files = await File.find({ _id: { $in: orderedIds } }).lean();
          const fileMap = new Map(files.map(f => [String(f._id), f]));
          const result = [];
          for (const fileId of orderedIds) {
            const file = fileMap.get(String(fileId));
            if (!file) continue;
            if (file.isSystem) continue;
            if (file.deletedAt) continue;
            const allowed = await hasPermission(file._id, userId);
            if (!allowed) continue;
            result.push({ id: file._id, name: file.name, type: file.type, starred: file.starred || false });
          }
          visibleChildren = result;
        }
      } else if (isSharedFolder) {
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
        visibleChildren = result;
      } else {
        const children = await getChildrenOf(targetItem._id);
        const filtered = [];
        for (const child of children) {
          if (child.deletedAt) continue;
          const allowed = await hasPermission(child._id, userId);
          if (!allowed) continue;
          filtered.push({
            id: child._id,
            name: child.name,
            type: child.type,
            starred: child.starred || false
          });
        }
        visibleChildren = filtered;
      }
    } else {
      const children = await getChildrenOf(targetItem._id);
      visibleChildren = children
        .filter(child => !child.deletedAt)
        .map(child => ({
          id: child._id,
          name: child.name,
          type: child.type,
          starred: child.starred || false
        }));
    }

    pub.content = visibleChildren;
  }

  return pub;
};


// PATCH update by id (supports name, starred, parentId for moving, and content for files)
exports.updateById = async (id, patch, userId = null) => {
  const item = await File.findById(String(id));
  if (!item) return null;

  if (userId && !(await hasPermission(id, userId))) {
    const err = new Error("Permission denied");
    err.status = 403;
    throw err;
  }

  const requiresEdit = patch.name !== undefined || patch.content !== undefined;
  if (requiresEdit && userId && !(await canEditFile(id, userId))) {
    const err = new Error("Permission denied: only Editor or Owner can modify file name or content");
    err.status = 403;
    throw err;
  }

  const oldEx2Name = item.type === "file" ? item.ex2Name : null;

  if (patch.name !== undefined) {
    item.name = patch.name;
    if (item.type === "file") {
      item.ex2Name = makeEx2Name(item._id, patch.name);
    }
  }

  if (patch.starred !== undefined) {
    item.starred = Boolean(patch.starred);
  }

  if (patch.content !== undefined && item.type === "file") {
    const newEx2Name = item.ex2Name || makeEx2Name(item._id, item.name);

    try {
      const resp = await tcp.postFile(newEx2Name, patch.content);

      if (String(resp).startsWith("409")) {
        try {
          await tcp.deleteFile(newEx2Name);
          const retryResp = await tcp.postFile(newEx2Name, patch.content);
          if (!String(retryResp).startsWith("201")) {
            const status = parseInt(String(retryResp).split(/\s+/)[0], 10) || 500;
            const err = new Error(`Ex2 post failed after retry: ${retryResp}`);
            err.status = status;
            throw err;
          }
        } catch (retryErr) {
          throw retryErr;
        }
      } else if (!String(resp).startsWith("201")) {
        const status = parseInt(String(resp).split(/\s+/)[0], 10) || 500;
        const err = new Error(`Ex2 post failed: ${resp}`);
        err.status = status;
        throw err;
      }

      if (oldEx2Name && oldEx2Name !== newEx2Name) {
        try {
          await tcp.deleteFile(oldEx2Name);
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      throw e;
    }
  }

  if (patch.parentId !== undefined) {
    const newParentId = patch.parentId ? String(patch.parentId) : null;

    if (newParentId) {
      const newParent = await File.findById(String(newParentId)).lean();
      if (!newParent) {
        const err = new Error("Parent folder not found");
        err.status = 404;
        throw err;
      }
      if (newParent.type !== "folder") {
        const err = new Error("Parent must be a folder");
        err.status = 400;
        throw err;
      }

      if (userId && !(await hasPermission(newParentId, userId))) {
        const err = new Error("Permission denied to parent folder");
        err.status = 403;
        throw err;
      }
    }

    if (await wouldCreateCircularMove(id, newParentId)) {
      const err = new Error("Cannot move folder into itself or its descendants");
      err.status = 400;
      throw err;
    }

    item.parentId = newParentId;
  }
  item.lastChange = Date.now();
  await item.save();
  await addToRecent(id, userId);

  const pub = { id: item._id, name: item.name, type: item.type };
  if (item.type === "folder") {
    const children = await getChildrenOf(item._id);
    pub.children = children.map(c => ({ id: c._id, name: c.name, type: c.type }));
  }
  return pub;
};

// DELETE by id (soft delete if not in trash, permanent delete if already in trash)
exports.deleteById = async (id, userId = null) => {
  const item = await File.findById(String(id));
  if (!item) return false;

  if (userId && !(await hasPermission(id, userId))) {
    const err = new Error("Permission denied");
    err.status = 403;
    throw err;
  }

  if (item.deletedAt) {
    const descendants = await getDescendantsOf(id);

    if (item.type === "file") {
      const ex2Name = item.ex2Name || item.name;
      try {
        await tcp.deleteFile(ex2Name);
      } catch (e) {
        // ignore
      }
    }

    for (const descendant of descendants) {
      if (descendant.type === "file") {
        const ex2Name = descendant.ex2Name || descendant.name;
        try {
          await tcp.deleteFile(ex2Name);
        } catch (e) {
          // ignore
        }
      }
    }

    try {
      await permissionsModel.deleteByFileId(id);
      for (const descendant of descendants) {
        await permissionsModel.deleteByFileId(descendant._id);
      }
    } catch (e) {
      // ignore
    }

    const idsToDelete = [String(id), ...descendants.map(d => String(d._id))];
    await File.deleteMany({ _id: { $in: idsToDelete } });
    return true;
  }

  item.deletedAt = new Date();
  if (!item.originalParentId) {
    item.originalParentId = item.parentId || null;
  }
  await item.save();

  const descendants = await getDescendantsOf(id);
  const now = new Date();
  for (const descendant of descendants) {
    await File.updateOne(
      { _id: descendant._id },
      {
        $set: {
          deletedAt: now,
          originalParentId: descendant.originalParentId || descendant.parentId || null
        }
      }
    );
  }

  return true;
};

// RESTORE by id - restore a deleted file/folder to its original location
exports.restoreById = async (id, userId = null) => {
  const item = await File.findById(String(id));
  if (!item || !item.deletedAt) return null;

  if (userId && !(await hasPermission(id, userId))) {
    const err = new Error("Permission denied");
    err.status = 403;
    throw err;
  }

  if (item.type === "file") {
    const ex2Name = item.ex2Name || item.name;
    const resp = await tcp.postFile(ex2Name, "");
    if (!String(resp).startsWith("201") && !String(resp).startsWith("409")) {
      const status = parseInt(String(resp).split(/\s+/)[0], 10) || 500;
      const err = new Error(`Ex2 restore failed: ${resp}`);
      err.status = status;
      throw err;
    }
  }

  const descendants = await getDescendantsOf(id);
  for (const descendant of descendants) {
    if (descendant.type === "file" && descendant.deletedAt) {
      const ex2Name = descendant.ex2Name || descendant.name;
      try {
        await tcp.postFile(ex2Name, "");
      } catch (e) {
        // ignore
      }
    }
  }

  item.deletedAt = null;
  if (item.originalParentId !== undefined) {
    item.parentId = item.originalParentId || null;
    item.originalParentId = null;
  }
  await item.save();

  for (const descendant of descendants) {
    await File.updateOne(
      { _id: descendant._id },
      {
        $set: {
          deletedAt: null,
          parentId: descendant.originalParentId || descendant.parentId || null,
          originalParentId: null
        }
      }
    );
  }

  try {
    await permissionsModel.restoreByFileId(id);
    for (const descendant of descendants) {
      await permissionsModel.restoreByFileId(descendant._id);
    }
  } catch (e) {
    // ignore
  }

  await addToRecent(id, userId);

  const pub = { id: item._id, name: item.name, type: item.type };
  if (item.type === "folder") {
    const children = await getChildrenOf(id);
    pub.children = children.map(c => ({ id: c._id, name: c.name, type: c.type }));
  }
  return pub;
};
