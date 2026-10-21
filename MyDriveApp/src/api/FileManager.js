import { request } from "./CommunicationManager";

const API = "/api";

export async function getFileById(id) {
  return await request({
    method: "GET",
    path: API + `/files/${id}`,
  });
}

export async function getFolderContent(folderId) {
  const folder = await getFileById(folderId);
  if (folder.type !== "folder") {
    throw new Error("Not a folder");
  }
  return folder.content || [];
}

export async function getRoot(userId) {
  return await request({
    method: "GET",
    path: API + `/users/${userId}/root`,
  });
}

// Update file fields (name, content, etc.)
export async function patchFileFields(id, fields) {
  return await request({
    method: "PATCH",
    path: API + `/files/${id}`,
    body: fields,
  });
}

// Star or unstar a file
export async function starFile(id, starred) {
  if (starred) {
    return await request({
      method: "PUT",
      path: API + `/files/${id}/star`,
    });
  } else {
    return await request({
      method: "DELETE",
      path: API + `/files/${id}/star`,
    });
  }
}

// Get starred files for a user
export async function getStarred(userId) {
  return await request({
    method: "GET",
    path: API + `/starred`,
  });
}

// Get trash files for a user
export async function getTrash(userId) {
  return await request({
    method: "GET",
    path: API + `/trash`,
  });
}

// Restore a file from trash
export async function restoreFile(id) {
  return await request({
    method: "POST",
    path: API + `/files/${id}/restore`,
  });
}

// Delete a file permanently
export async function deleteFile(id) {
  return await request({
    method: "DELETE",
    path: API + `/files/${id}`,
  });
}

// Get shared files for a user
export async function getShared(userId) {
  const sharedFolder = await request({
    method: "GET",
    path: API + `/users/${userId}/shared`,
  });

  if (sharedFolder && sharedFolder.id) {
    return await getFileById(sharedFolder.id);
  }

  return sharedFolder;
}

// Search for files
export async function search(query) {
  return await request({
    method: "GET",
    path: API + `/search/${encodeURIComponent(query)}`,
  });
}

// Create a new folder
export async function createFolder(name, parentFolderId) {
  return await request({
    method: "POST",
    path: API + `/files`,
    body: {
      name: name,
      type: "folder",
      parentId: parentFolderId || null,
    },
  });
}

// Create a new file
export async function createFile(name, parentFolderId) {
  return await request({
    method: "POST",
    path: API + `/files`,
    body: {
      name: name,
      type: "file",
      content: "",
      parentId: parentFolderId || null,
    },
  });
}

// Share a file with another user
export async function shareFile(fileId, targetUser, role) {
  return await request({
    method: "POST",
    path: API + `/files/${fileId}/permissions`,
    body: {
      userId: targetUser,
      role: role, // 'reader' or 'editor'
    },
  });
}

// Rename a file or folder
export async function renameItem(id, newName) {
  return await request({
    method: "PATCH",
    path: API + `/files/${id}`,
    body: {
      name: newName,
    },
  });
}

// Move a file or folder to a different parent folder
export async function moveItem(id, targetFolderId) {
  return await request({
    method: "PATCH",
    path: API + `/files/${id}`,
    body: {
      parentId: targetFolderId || null,
    },
  });
}

// Move file to trash (soft delete)
export async function moveToTrash(id) {
  return await request({
    method: "DELETE",
    path: API + `/files/${id}`,
  });
}