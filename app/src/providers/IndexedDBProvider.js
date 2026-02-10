import { FileSystemProvider } from './FileSystemProvider';
import { db } from '../db';
import toast from 'react-hot-toast';

export class IndexedDBProvider extends FileSystemProvider {
    constructor(workspaceId) {
        super(workspaceId);
    }

    async initialize() {
        // Initialize defaults if needed (moved from useFileSystem)
        return await db.initializeDefaults();
    }

    /**
     * List files in a specific folder (or root).
     * @param {string} parentId - Parent folder ID.
     * @returns {Promise<Array>}
     */
    async list(parentId) {
        // IndexedDB is fast, but efficient querying depends on indexes.
        // We have '&id, parentId, workspaceId'.
        // We want: methods for exact match on parentId AND workspaceId.
        // Dexie: db.files.where({ workspaceId: this.workspaceId, parentId: parentId }).toArray()

        // Ensure parentId is null/undefined handled correctly (root usually has specific logic or ID)
        // In this app, root parentId is usually null.

        let query = { workspaceId: this.workspaceId };
        if (parentId !== undefined) query.parentId = parentId; // If undefined, might return all locally? No, strict filtering.

        // If parentId is strictly provided:
        return await db.files.where(query).toArray();
    }

    /**
     * Get ALL files for the workspace (For legacy/search support).
     */
    async listAll() {
        return await db.files.where('workspaceId').equals(this.workspaceId).toArray();
    }

    async get(fileId) {
        return await db.files.get(fileId);
    }

    async createFolder(name, parentId) {
        const newFolder = {
            id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            parentId: parentId,
            workspaceId: this.workspaceId,
            name,
            type: 'folder',
            size: '--',
            date: new Date().toLocaleDateString()
        };
        await db.files.put(newFolder);
        return newFolder;
    }

    async saveFiles(files) {
        // Expect files to have keys: name, type, size, date, content
        // Modifies them to add ID, workspaceId, parentId if missing

        // Files might already have metadata from importDroppedFiles
        const preparedFiles = files.map(f => ({
            ...f,
            id: f.id || `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            workspaceId: this.workspaceId,
            // parentId must be present in f
        }));

        await db.files.bulkPut(preparedFiles);
        return preparedFiles;
    }

    async delete(ids) {
        await db.files.bulkDelete(ids);
    }

    async rename(id, newName) {
        await db.files.update(id, { name: newName });
    }

    async getContent(id) {
        const file = await db.files.get(id);
        return file ? file.content : null;
    }

    async listStarred() {
        return await db.files
            .where({ workspaceId: this.workspaceId })
            .filter(f => f.isStarred && !f.deletedAt)
            .toArray();
    }

    async listRecent() {
        // Return all files (not folders) in workspace, not deleted.
        // Sorting will be done by UI or we can try here if date format allows.
        return await db.files
            .where('workspaceId').equals(this.workspaceId)
            .filter(f => !f.deletedAt && f.type !== 'folder')
            .toArray();
    }

    async listTrash() {
        return await db.files
            .where('workspaceId').equals(this.workspaceId)
            .filter(f => !!f.deletedAt)
            .toArray();
    }

    async listByTag(tagId) {
        return await db.files
            .where('workspaceId').equals(this.workspaceId)
            .filter(f => f.tags && f.tags.includes(tagId) && !f.deletedAt)
            .toArray();
    }
}
