"use strict";

const { models, generateId } = require("../db");

const { Permission } = models;

// return all permissions for a file
const findAll = async (fileId) => {
  const perms = await Permission.find({ fileId: String(fileId) }).lean();
  return perms.map(({ _id, ...rest }) => ({ id: _id, ...rest }));
};

// find single permission by file id and permission id
const findById = async (fileId, permissionId) => {
  const perm = await Permission.findById(String(permissionId)).lean();
  if (!perm || String(perm.fileId) !== String(fileId)) return null;
  const { _id, ...rest } = perm;
  return { id: _id, ...rest };
};

// create new permission
const create = async (fileId, userId, role) => {
  const newPerm = {
    _id: generateId(),
    fileId: String(fileId),
    userId: String(userId),
    role: String(role)
  };

  await Permission.create(newPerm);
  return { id: newPerm._id, fileId: newPerm.fileId, userId: newPerm.userId, role: newPerm.role };
};

// update existing permission fields
const update = async (fileId, permissionId, updates = {}) => {
  const existingPermission = await findById(fileId, permissionId);
  if (!existingPermission) return null;

  const updateDoc = {};
  if (updates.userId) updateDoc.userId = String(updates.userId);
  if (updates.role) updateDoc.role = String(updates.role);

  await Permission.updateOne({ _id: String(permissionId) }, { $set: updateDoc });

  return { ...existingPermission, ...updateDoc };
};

// delete permission by id
const deletePermission = async (fileId, permissionId) => {
  const perm = await Permission.findById(String(permissionId)).lean();
  if (!perm || String(perm.fileId) !== String(fileId)) return null;

  await Permission.deleteOne({ _id: String(permissionId) });
  const { _id, ...rest } = perm;
  return { id: _id, ...rest };
};

// delete all permissions for a file (cascade delete)
const deleteByFileId = async (fileId) => {
  const perms = await Permission.find({ fileId: String(fileId) }).lean();
  await Permission.deleteMany({ fileId: String(fileId) });
  return perms.length;
};

// No-op restore (permissions are not soft-deleted)
const restoreByFileId = async () => 0;

module.exports = {
  findAll,
  findById,
  create,
  update,
  deletePermission,
  deleteByFileId,
  restoreByFileId,
};
