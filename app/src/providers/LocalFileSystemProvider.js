import { FileSystemProvider } from './FileSystemProvider';

/**
 * Provider for Local File System Access API.
 * Allows direct editing of files on the user's machine.
 */
export class LocalFileSystemProvider extends FileSystemProvider {
    constructor(workspaceId, directoryHandle) {
        super(workspaceId);
        this.directoryHandle = directoryHandle;
    }

    /**
     * Checks if we have permission to access the handle.
     * If not, it might trigger a prompt if request is true.
     */
    async verifyPermission(handle, readWrite = false) {
        if (!handle) return false;
        const options = {};
        if (readWrite) {
            options.mode = 'readwrite';
        }

        // Check if permission was already granted.
        if ((await handle.queryPermission(options)) === 'granted') {
            return true;
        }

        // Request permission. If the user grants permission, return true.
        if ((await handle.requestPermission(options)) === 'granted') {
            return true;
        }

        // The user didn't grant permission, so return false.
        return false;
    }

    // Recursively list files
    async list(parentId) {
        if (!this.directoryHandle) throw new Error("No directory handle");

        // If parentId is null, list root.
        // If parentId is a path, we need to traverse.
        // For simplicity in this v1, let's assume flat IDs don't map perfectly to handles yet,
        // so we might need to rely on 'files' state or traverse.
        // But `list` usually returns the *current* folder's content.

        // HOWEVER, the current app consumes a flat list of ALL files from `useFileSystem`.
        // So we probably need `listAll` to recursively crawl everything to match Dexie's behavior.

        return await this.listAll();
    }

    async listAll() {
        if (!this.verifyPermission(this.directoryHandle)) {
            throw new Error("Permission denied");
        }

        const files = [];
        const processHandle = async (handle, path = '') => {
            for await (const entry of handle.values()) {
                const entryPath = path ? `${path}/${entry.name}` : entry.name;

                if (entry.kind === 'file') {
                    // Get file metadata (heavy operation if we do getFile() for all)
                    // For performance, we might just store minimal info and load content on demand?
                    // But current UI needs 'type', 'size', etc.
                    const fileData = await entry.getFile();
                    files.push({
                        id: entryPath, // Use path as ID for local files
                        parentId: path || null, // Logic needs mapping path to ID
                        workspaceId: this.workspaceId,
                        name: entry.name,
                        type: this.getType(entry.name),
                        size: this.formatSize(fileData.size),
                        date: new Date(fileData.lastModified).toLocaleDateString(),
                        // content: ... we DO NOT load content here to avoid memory boom
                        handle: entry // Store handle to read later
                    });
                } else if (entry.kind === 'directory') {
                    files.push({
                        id: entryPath,
                        parentId: path || null,
                        workspaceId: this.workspaceId,
                        name: entry.name,
                        type: 'folder',
                        size: '--',
                        date: new Date().toLocaleDateString(),
                        handle: entry
                    });
                    // Recurse
                    await processHandle(entry, entryPath);
                }
            }
        };

        await processHandle(this.directoryHandle);
        return files;
    }

    // Helper (mapping extension to type)
    getType(name) {
        if (name.endsWith('.js') || name.endsWith('.jsx')) return 'javascript';
        if (name.endsWith('.html')) return 'html';
        if (name.endsWith('.css')) return 'css';
        if (name.endsWith('.json')) return 'json';
        if (name.endsWith('.md')) return 'markdown';
        if (name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return 'image';
        return 'file';
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async getContent(id) {
        // id is the path, e.g. "folder/file.txt"
        // We need to traverse from root to find the handle again effectively,
        // OR we searched before and assume we can find it.
        // Re-traversing is safer if we don't cache handles.

        const parts = id.split('/');
        let currentHandle = this.directoryHandle;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === parts.length - 1) {
                // Last part is the file
                const fileHandle = await currentHandle.getFileHandle(part);
                const file = await fileHandle.getFile();

                // Return text or blob based on type
                if (file.type.startsWith('text/') ||
                    file.name.match(/\.(js|jsx|json|md|html|css|txt)$/)) {
                    return await file.text();
                }
                return file; // Blob
            } else {
                // Directories
                currentHandle = await currentHandle.getDirectoryHandle(part);
            }
        }
        return null;
    }

    /**
     * Traverse to a parent handle by path ID.
     */
    async _traverseToHandle(pathId) {
        if (!pathId) return this.directoryHandle;
        const parts = pathId.split('/');
        let handle = this.directoryHandle;
        for (const part of parts) {
            handle = await handle.getDirectoryHandle(part);
        }
        return handle;
    }

    async createFolder(name, parentId) {
        try {
            const parentHandle = await this._traverseToHandle(parentId);
            await parentHandle.getDirectoryHandle(name, { create: true });

            const folderPath = parentId ? `${parentId}/${name}` : name;
            return {
                id: folderPath,
                parentId: parentId || null,
                workspaceId: this.workspaceId,
                name,
                type: 'folder',
                size: '--',
                date: new Date().toLocaleDateString()
            };
        } catch (error) {
            console.error('LocalFS createFolder error:', error);
            throw error;
        }
    }

    async saveFiles(files) {
        const results = [];
        for (const f of files) {
            try {
                if (f.type === 'folder') {
                    const parentHandle = await this._traverseToHandle(f.parentId);
                    await parentHandle.getDirectoryHandle(f.name, { create: true });
                    results.push(f);
                } else if (f.content) {
                    const parentHandle = await this._traverseToHandle(f.parentId);
                    const fileHandle = await parentHandle.getFileHandle(f.name, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(f.content);
                    await writable.close();
                    results.push(f);
                }
            } catch (err) {
                console.error(`LocalFS saveFile error for ${f.name}:`, err);
            }
        }
        return results;
    }

    async delete(ids) {
        for (const id of ids) {
            try {
                const parts = id.split('/');
                const name = parts.pop();
                const parentPath = parts.join('/') || null;
                const parentHandle = await this._traverseToHandle(parentPath);
                await parentHandle.removeEntry(name, { recursive: true });
            } catch (err) {
                console.error(`LocalFS delete error for ${id}:`, err);
            }
        }
    }

    async rename(id, newName) {
        // File System Access API doesn't support rename directly.
        // We need to copy content to new name and delete old.
        try {
            const parts = id.split('/');
            const oldName = parts.pop();
            const parentPath = parts.join('/') || null;
            const parentHandle = await this._traverseToHandle(parentPath);

            // Read old file
            const oldFileHandle = await parentHandle.getFileHandle(oldName);
            const oldFile = await oldFileHandle.getFile();

            // Write to new name
            const newFileHandle = await parentHandle.getFileHandle(newName, { create: true });
            const writable = await newFileHandle.createWritable();
            await writable.write(await oldFile.arrayBuffer());
            await writable.close();

            // Delete old
            await parentHandle.removeEntry(oldName);
        } catch (err) {
            console.error(`LocalFS rename error:`, err);
            throw err;
        }
    }
}
