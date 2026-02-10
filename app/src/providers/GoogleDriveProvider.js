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
        const metadata = {
            name: name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId || 'root']
        };

        const response = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(metadata)
        });

        const data = await response.json();
        return {
            id: data.id,
            name: data.name,
            type: 'folder',
            parentId: parentId || 'root',
            workspaceId: this.workspaceId
        };
    }
}
