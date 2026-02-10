import { FileSystemProvider } from './FileSystemProvider';
import { GOOGLE_CONFIG } from '../config/google';

export class GoogleDriveProvider extends FileSystemProvider {
    constructor(workspaceId, token) {
        super(workspaceId);
        this.token = token; // OAuth Access Token
    }

    async list(parentId) {
        // Parent ID in Drive is a string ID. Root is 'root'.
        const query = parentId
            ? `'${parentId}' in parents and trashed = false`
            : "'root' in parents and trashed = false";

        console.log(`[Drive] List Query: ${query}, Token: ${this.token?.substring(0, 10)}...`);
        const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name, mimeType, size, modifiedTime, iconLink, thumbnailLink)&pageSize=100`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[Drive] API Error: ${response.status}`, errorBody);

            if (response.status === 401) {
                throw new Error("Sessão Expirada. Por favor, reconecte sua conta Google no Painel de Configurações.");
            }

            if (response.status === 403 && errorBody.includes("accessNotConfigured")) {
                throw new Error("A API do Google Drive não está ativada no seu projeto do Google Cloud. Ative-a em: console.developers.google.com");
            }

            throw new Error(`Drive API Error: ${response.status}`);
        }

        const data = await response.json();
        console.log(`[Drive] Files Found: ${data.files?.length}`, data);

        return data.files.map(f => ({
            id: f.id,
            parentId: parentId || 'root',
            workspaceId: this.workspaceId,
            name: f.name,
            type: this.mapMimeType(f.mimeType),
            size: f.size ? this.formatSize(f.size) : '--',
            date: new Date(f.modifiedTime).toLocaleDateString(),
            mimeType: f.mimeType, // Keep original mime
            thumbnail: f.thumbnailLink,
            icon: f.iconLink
        }));
    }

    async get(fileId) {
        // For text files, we can read content.
        // For binaries, we might need alt=media
        // For Google Docs, we need export links.

        // This is a simplified "get metadata" or "get content"? 
        // Provider interface usually implies getting the object, but 'getContent' is separate.
        // Let's implement standard get object.
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,modifiedTime`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        return await response.json();
    }

    async getContent(id) {
        // Determine file type first to know if we download or export
        const meta = await this.get(id);

        // Google Docs must be exported
        if (meta.mimeType.startsWith('application/vnd.google-apps.')) {
            // Export as PDF for preview? Or plain text?
            // For simplicity/safety: PDF or PDF Link. 
            // But app expects content to be displayed.
            // Maybe export as 'text/plain' for Docs?
            if (meta.mimeType.includes('document')) {
                const res = await fetch(`https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=text/plain`, {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });
                return await res.text();
            }
            return "Visualização não disponível para arquivos nativos do Google (planilhas/slides).";
        }

        // Normal files: alt=media
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });

        if (meta.mimeType.startsWith('text/') || meta.name.endsWith('.js') || meta.name.endsWith('.json') || meta.name.endsWith('.md')) {
            return await response.text();
        }

        return await response.blob();
    }

    mapMimeType(mime) {
        if (mime === 'application/vnd.google-apps.folder') return 'folder';
        if (mime.startsWith('image/')) return 'image';
        if (mime.includes('pdf')) return 'pdf';
        if (mime.includes('javascript') || mime.includes('json') || mime.includes('html')) return 'code';
        if (mime.startsWith('text/')) return 'text';
        if (mime.startsWith('application/vnd.google-apps.')) return 'gdoc';
        return 'file';
    }

    formatSize(bytes) {
        if (!bytes) return '0 B';
        const k = 1024;
        const s = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + s[i];
    }

    // Implement createFolder, saveFiles, delete, rename similarly...
    async createFolder(name, parentId) {
        // Fix: If parentId is a connection ID (local app concept), map to 'root' for Drive
        const actualParent = (parentId && parentId.startsWith('conn-')) ? 'root' : (parentId || 'root');

        const metadata = {
            name: name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [actualParent]
        };

        const response = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(metadata)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Drive Create Folder Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return {
            id: data.id,
            name: data.name,
            type: 'folder',
            parentId: parentId, // Keep original parentId for local state consistency
            workspaceId: this.workspaceId,
            date: new Date().toLocaleDateString(),
            size: '--'
        };
    }

    async delete(ids) {
        // Permanent Delete
        for (const id of ids) {
            await fetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
        }
    }

    async trash(ids) {
        // Soft Delete
        for (const id of ids) {
            await fetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ trashed: true })
            });
        }
    }

    async rename(id, newName) {
        await fetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: newName })
        });
    }

    async saveFiles(files) {
        const uploaded = [];
        for (const file of files) {
            const actualParent = (file.parentId && file.parentId.startsWith('conn-')) ? 'root' : (file.parentId || 'root');

            const metadata = {
                name: file.name,
                parents: [actualParent]
            };

            const formData = new FormData();
            formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));

            let contentBlob = file.content;
            if (typeof contentBlob === 'string') {
                contentBlob = new Blob([contentBlob], { type: 'text/plain' });
            } else if (!(contentBlob instanceof Blob) && !(contentBlob instanceof File)) {
                // Should be Blob or File, but if missing, empty blob
                contentBlob = new Blob([''], { type: 'text/plain' });
            }
            formData.append('file', contentBlob);

            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });

            if (!response.ok) {
                console.error(`Upload error for ${file.name}:`, await response.text());
                continue;
            }

            const data = await response.json();
            uploaded.push({
                id: data.id,
                name: data.name,
                type: this.mapMimeType(data.mimeType),
                parentId: file.parentId, // Keep local parent ID
                workspaceId: this.workspaceId,
                date: new Date().toLocaleDateString(),
                size: this.formatSize(data.size || file.sizeRaw || 0),
                content: file.content // Keep content locally if needed
            });
        }
        return uploaded;
    }

    // Helper for custom queries
    async _performList(query) {
        console.log(`[Drive] Query: ${query}`);
        const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name, mimeType, size, modifiedTime, iconLink, thumbnailLink)&pageSize=100`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[Drive] API Error: ${response.status}`, errorBody);
            throw new Error(`Drive API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.files.map(f => ({
            id: f.id,
            parentId: 'root', // Logic for parentId might be complex here, so Default to root or unknown
            workspaceId: this.workspaceId,
            name: f.name,
            type: this.mapMimeType(f.mimeType),
            size: f.size ? this.formatSize(f.size) : '--',
            date: new Date(f.modifiedTime).toLocaleDateString(),
            mimeType: f.mimeType,
            thumbnail: f.thumbnailLink,
            icon: f.iconLink
        }));
    }

    async listStarred() {
        return await this._performList("starred = true and trashed = false");
    }

    async listRecent() {
        // Recent files (ignoring folders?)
        return await this._performList("trashed = false and mimeType != 'application/vnd.google-apps.folder' order by modifiedTime desc");
    }

    async listTrash() {
        return await this._performList("trashed = true");
    }

    async listByTag(tagId) {
        // Tag support on Drive is limited. For now, return empty.
        // potentially use properties or description search in future
        return [];
    }
}
