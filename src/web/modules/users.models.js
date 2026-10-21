"use strict";

const { models, generateId } = require("../db");
const filesModel = require("./files.models");

const { User, File } = models;

// Create 5 default folders for every new user
// Each folder is a REAL File entity with type="folder"
async function createDefaultUserFolders(userId) {
  try {
    // 1. Create "My Drive" (root folder)
    const myDrive = await filesModel.createFileOrFolder("My Drive", "folder", userId);
    await File.updateOne({ _id: myDrive.id }, { $set: { isSystem: true, isRoot: true } });

    // 2. Create "Shared with me" (real folder)
    const shared = await filesModel.createFileOrFolder("Shared with me", "folder", userId);
    await File.updateOne({ _id: shared.id }, { $set: { isSystem: true } });

    // 3. Create "Recent" (real folder)
    const recent = await filesModel.createFileOrFolder("Recent", "folder", userId);
    await File.updateOne({ _id: recent.id }, { $set: { isSystem: true } });

    // 4. Create "Starred" (real folder)
    const starred = await filesModel.createFileOrFolder("Starred", "folder", userId);
    await File.updateOne({ _id: starred.id }, { $set: { isSystem: true } });

    // 5. Create "Trash" (real folder)
    const trash = await filesModel.createFileOrFolder("Trash", "folder", userId);
    await File.updateOne({ _id: trash.id }, { $set: { isSystem: true } });
    // Store folder IDs in user record for easy access
    await User.updateOne(
      { _id: String(userId) },
      {
        $set: {
          myDriveFolderId: myDrive.id,
          sharedFolderId: shared.id,
          recentFolderId: recent.id,
          starredFolderId: starred.id,
          trashFolderId: trash.id
        }
      }
    );

    return {
      myDriveId: myDrive.id,
      sharedId: shared.id,
      recentId: recent.id,
      starredId: starred.id,
      trashId: trash.id
    };
  } catch (err) {
    throw new Error(`Failed to create default user folders: ${err.message}`);
  }
}

exports.createUser = async ({ username, password, name, imageUrl }) => {
  const exists = await User.findOne({ username }).lean();
  if (exists) {
    return { error: "username already exists" };
  }

  const id = generateId();
  const user = {
    _id: id,
    username: username,
    password: password,
    name: name || username,
    imageUrl: imageUrl || "",
    theme: "light"
  };

  await User.create(user);

  // Create 5 default folders for every new user (server-side, during signup)
  // This must happen for EVERY signup, automatically
  try {
    await createDefaultUserFolders(id);
  } catch (err) {
    // Rollback: remove the user if folder creation fails
    // Signup should fail if folder creation fails
    await User.deleteOne({ _id: id });
    return { error: err.message };
  }

  const safe = {
    id: id,
    username: user.username,
    name: user.name,
    imageUrl: user.imageUrl,
    theme: user.theme
  };
  return { user: safe };
};

exports.getUserById = async (id) => {
  const u = await User.findById(String(id)).lean();
  if (!u) return null;
  const { password: _pw, _id, ...rest } = u;
  return { id: _id, ...rest };
};

exports.findUserByUsername = async (username) => {
  return await User.findOne({ username }).lean();
};

// Get default folder by type for a user
exports.getUserFolder = async (userId, folderType) => {
  const user = await User.findById(String(userId)).lean();
  if (!user) {
    return null;
  }

  const folderIdMap = {
    "myDrive": user.myDriveFolderId,
    "shared": user.sharedFolderId,
    "recent": user.recentFolderId,
    "starred": user.starredFolderId,
    "trash": user.trashFolderId
  };

  const folderId = folderIdMap[folderType];
  if (!folderId) {
    return null;
  }

  const filesModel = require("./files.models");
  const result = await filesModel.getById(folderId, userId);
  return result;
};
/**
 * Update user profile: name, username, password, imageUrl, theme
 * @param {string} id
 * @param {Object} patch - { name?, username?, password?, imageUrl?, theme? }
 * @returns {{ error?: string, status?: number, user?: Object }}
 */
exports.updateUser = async (id, patch) => {
  const user = await User.findById(String(id));
  if (!user) return { error: "user not found", status: 404 };

  // name
  if (patch.name !== undefined) {
    if (typeof patch.name !== "string" || patch.name.trim() === "") {
      return { error: "name must be a non-empty string", status: 400 };
    }
    user.name = patch.name.trim();
  }

  // username
  if (patch.username !== undefined) {
    if (typeof patch.username !== "string" || patch.username.trim() === "") {
      return { error: "username must be a non-empty string", status: 400 };
    }
    const newUsername = patch.username.trim();
    if (newUsername !== user.username) {
      const exists = await User.findOne({ username: newUsername }).lean();
      if (exists) return { error: "username already exists", status: 409 };
      user.username = newUsername;
    }
  }

  // password (allow update only if provided and non-empty string)
  if (patch.password !== undefined) {
    if (typeof patch.password !== "string" || patch.password === "") {
      return { error: "password must be a non-empty string", status: 400 };
    }
    user.password = patch.password;
  }

  // imageUrl
  if (patch.imageUrl !== undefined) {
    if (typeof patch.imageUrl !== "string") {
      return { error: "imageUrl must be a string", status: 400 };
    }
    user.imageUrl = patch.imageUrl;
  }

  // theme
  if (patch.theme !== undefined) {
    // Accept the three supported themes: light, dark, bball
    if (patch.theme !== "light" && patch.theme !== "dark" && patch.theme !== "bball") {
      return { error: "theme must be 'light', 'dark' or 'bball'", status: 400 };
    }
    user.theme = patch.theme;
  }

  await user.save();

  const { password: _pw, _id, ...rest } = user.toObject();
  return { user: { id: _id, ...rest }, status: 200 };
};
