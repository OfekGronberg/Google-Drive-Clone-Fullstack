import { request } from "./CommunicationManager";
const API = "http://localhost:3000/api";
// Get a folder's content by id
export async function getFolderContent(folderId) {
    try {
        var folder = await getFileById(folderId);
    }
    catch (e) {
        throw e;
    }
    if (folder.type !== "folder") {
        throw new Error("Not a folder");
    }
    // Backend returns full child objects in content array, not just IDs
    return folder.content || [];
}

// Get a single file/folder/shortcut by id (server enforces permissions)
export async function getFileById(id) {
    try {
        var file = await request({
            method: "GET",
            path: API + `/files/${id}`,
            token: localStorage.getItem("token")
        });
    }
    catch (e) {
        throw e;
    }
    return file;
}

// ----- Permissions helpers -----

// List permissions for a file
export async function listPermissions(fileId) {
    try {
        const permissions = await request({
            method: "GET",
            path: API + `/files/${fileId}/permissions`,
            token: localStorage.getItem("token"),
        });
        return Array.isArray(permissions) ? permissions : [];
    } catch (e) {
        throw e;
    }
}

// Create a new permission for a file
export async function createPermission(fileId, userIdOrUsername, role) {
    try {
        return await request({
            method: "POST",
            path: API + `/files/${fileId}/permissions`,
            body: {
                userId: String(userIdOrUsername),
                role: String(role),
            },
            token: localStorage.getItem("token"),
        });
    } catch (e) {
        throw e;
    }
}

export async function patchFileFields(id, patch) {
  if (!id) throw new Error("patchFileFields: id is required");
  return await request({
    method: "PATCH",
    path: API + `/files/${id}`,
    body: patch,
    token: localStorage.getItem("token"),
  });
}

// Update an existing permission role
export async function updatePermission(fileId, permissionId, role) {
    try {
        await request({
            method: "PATCH",
            path: API + `/files/${fileId}/permissions/${permissionId}`,
            body: { role: String(role) },
            token: localStorage.getItem("token"),
            parseAs: "text",
        });
    } catch (e) {
        throw e;
    }
}

// Remove a permission from a file
export async function deletePermission(fileId, permissionId) {
    try {
        await request({
            method: "DELETE",
            path: API + `/files/${fileId}/permissions/${permissionId}`,
            token: localStorage.getItem("token"),
            parseAs: "text",
        });
    } catch (e) {
        throw e;
    }
}

// Get root folder id
export async function getRoot(userId) {
    try {
        var result = await request({
            method: "GET",
            path: API + `/users/${userId}/root`,
            token: localStorage.getItem("token")
        });
        return result;
    }
    catch (e) {
        throw e;
    }
}

// Get trash
export async function getTrash(userId) {
    try {
        var result = await request({
            method: "GET",
            path: API + `/users/${userId}/trash`,
            token: localStorage.getItem("token")
        });
        return result;
    }
    catch (e) {
        throw e;
    }
}

// Get items shared with the current user
export async function getShared(userId) {
    try {
        var result = await request({
            method: "GET",
            path: API + `/users/${userId}/shared`,
            token: localStorage.getItem("token")
        });
        return result;
    }
    catch (e) {
        throw e;
    }
}

// Get recently opened items
export async function getRecent(userId) {
    try {
        var result = await request({
            method: "GET",
            path: API + `/users/${userId}/recent`,
            token: localStorage.getItem("token")
        });
        return result;
    }
    catch (e) {
        throw e;
    }
}

// Get starred items
export async function getStarred(userId) {
    try {
        var result = await request({
            method: "GET",
            path: API + `/users/${userId}/starred`,
            token: localStorage.getItem("token")
        });
        return result;
    }
    catch (e) {
        throw e;
    }
}

// Search items (optionally scoped)
export async function search(query) {
    try {
        var results = await request({
            method: "GET",
            path: API + `/search/${encodeURIComponent(query)}`,
            token: localStorage.getItem("token")
        });
        return results;
    }
    catch (e) {
        throw e;
    }
}

export async function postFile(file) {
    try {
        return await request({
            method: "POST",
            path: API + "/files",
            body: file,
            token: localStorage.getItem("token"),
        });
    }
    catch (e) {
        throw e;
    }
}

export async function createFile(name, parentId, content, type = "file", starred = false) {
    if (!name || !name.trim())
        throw new Error("Invalid name");
    if (parentId === null || parentId === undefined || String(parentId).trim() === "")
        throw new Error("Invalid parent ID");
    if (type !== "file" && type !== "folder" && type !== "shortcut")
        throw new Error("Invalid type");
    if (type === "folder" && content !== undefined && content !== null && !Array.isArray(content) && (Array.isArray(content) && content.length > 0))
        throw new Error("Invalid content for folder");
    if (starred === undefined || starred === null)
        throw new Error("Invalid starred value");
    const file = {
        name: name.trim(),
        parentId: String(parentId),
        content: content,
        type: type,          // "file" | "folder" | "shortcut"
        starred: Boolean(starred),
    };
    return file;
}

// Patch file/folder fields (rename, star, move, etc.)
export async function patchFile(id, patchData) {
    if (!id) throw new Error("patchFile: id is required");
    try {
        return await request({
            method: "PATCH",
            path: API + `/files/${id}`,
            body: patchData,
            token: localStorage.getItem("token"),
        });
    }
    catch (e) {
        throw e;
    }
}

// Rename a file/folder
export async function renameFile(id, newName) {
    if (!id) throw new Error("renameFile: id is required");
    if (!newName || !String(newName).trim()) throw new Error("Invalid name");
    try {
        return await patchFile(id, { name: newName.trim() });
    }
    catch (e) {
        throw e;
    }
}

// Move a file/folder to a new parent folder
export async function moveFile(id, newParentId) {
    if (!id) throw new Error("moveFile: id is required");
    if (newParentId === null || newParentId === undefined || String(newParentId).trim() === "") {
        throw new Error("Invalid parent ID");
    }
    try {
        return await patchFile(id, { parentId: newParentId === null ? null : String(newParentId) });
    }
    catch (e) {
        throw e;
    }
}

// Star/unstar a file
export async function starFile(id, starup) {
    if (!id) throw new Error("starFile: id is required");
    if (starup === undefined || starup === null) throw new Error("Invalid starred value");
    try {
        await request({
            method: starup ? "PUT" : "DELETE",
            path: API + `/files/${id}/star`,
            token: localStorage.getItem("token"),
        });
    }
    catch (e) {
        throw e;
    }
}

// Delete (usually move to trash) a file/folder/shortcut
export async function deleteFile(id) {
    try {
        return await request({
            method: "DELETE",
            path: API + "/files/" + id,
            token: localStorage.getItem("token"),
        });
    }
    catch (e) {
        throw e;
    }
}

// Restore a trashed item
export async function restoreFile(id) {
    if (!id) throw new Error("restoreFile: id is required");
    try {
        return await request({
            method: "POST",
            path: API + `/files/${id}/restore`,
            token: localStorage.getItem("token"),
        })
    }
    catch (e) {
        throw e;
    }
}

// Returns the target id
export async function refer(id, seen = new Set()) {
    const current = String(id);
    if (seen.has(current)) return null; // cycle detected
    seen.add(current);
    let node;
    try {
        node = await getFileById(current);
    }
    catch (e) {
        throw e;
    }
    if (!node) return null;
    if (node.type !== "shortcut") return node.id;
    return refer(node.content, seen);
}

// ----- Image helpers -----

/**
 * Upload an image (base64 encoded or File object or Blob)
 * @param {string|File|Blob} imageData - base64 string (with or without data: prefix) or File/Blob object
 * @returns {Promise<{id: string, mimeType: string, url: string}>}
 */
export async function uploadImage(imageData) {
    try {
        let base64String = imageData;

        // If it's a File or Blob object, convert to base64
        if (imageData instanceof File || imageData instanceof Blob) {
            base64String = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(imageData);
            });
        }

        // Ensure it has the data: prefix (only if it's a string)
        if (typeof base64String === 'string' && !base64String.startsWith("data:")) {
            base64String = `data:image/jpeg;base64,${base64String}`;
        }

        const response = await request({
            method: "POST",
            path: API + "/images",
            body: { image: base64String },
            token: localStorage.getItem("token"),
        });

        return response;
    } catch (e) {
        throw e;
    }
}

/**
 * Get image URL by ID
 * @param {string} imageId
 * @returns {string} image URL
 */
export function getImageUrl(imageId) {
    return `${API}/images/${imageId}`;
}

/**
 * Delete an image
 * @param {string} imageId
 */
export async function deleteImage(imageId) {
    try {
        await request({
            method: "DELETE",
            path: API + `/images/${imageId}`,
            token: localStorage.getItem("token"),
            parseAs: "text",
        });
    } catch (e) {
        throw e;
    }
}

/**
 * Get image metadata
 * @param {string} imageId
 * @returns {Promise<{id: string, mimeType: string, uploadedAt: string, url: string}>}
 */
export async function getImageInfo(imageId) {
    try {
        return await request({
            method: "GET",
            path: API + `/images/${imageId}/info`,
            token: localStorage.getItem("token"),
        });
    } catch (e) {
        throw e;
    }
}
