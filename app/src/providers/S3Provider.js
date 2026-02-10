import { FileSystemProvider } from './FileSystemProvider';
import { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";

export class S3Provider extends FileSystemProvider {
    constructor(workspaceId, config) {
        super(workspaceId);
        this.config = config; // { region, bucket, accessKeyId, secretAccessKey }
        this.client = new S3Client({
            region: config.region,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey
            }
        });
    }

    async list(parentId) {
        // ParentID is S3 prefix. Root is empty string or undefined.
        // If parentId is provided, it should end with /
        const prefix = parentId ? (parentId.endsWith('/') ? parentId : `${parentId}/`) : '';

        const command = new ListObjectsV2Command({
            Bucket: this.config.bucket,
            Prefix: prefix,
            Delimiter: '/'
        });

        try {
            const data = await this.client.send(command);
            const files = [];

            // Process Folders (CommonPrefixes)
            if (data.CommonPrefixes) {
                data.CommonPrefixes.forEach(p => {
                    const name = p.Prefix.split('/').filter(Boolean).pop(); // Get last part of path
                    files.push({
                        id: p.Prefix, // ID is the full prefix with trailing slash
                        parentId: parentId || null,
                        workspaceId: this.workspaceId,
                        name: name,
                        type: 'folder',
                        size: '--',
                        date: '--', // S3 prefixes don't have modify time
                        mimeType: 'application/x-directory'
                    });
                });
            }

            // Process Files (Contents)
            if (data.Contents) {
                data.Contents.forEach(obj => {
                    // Skip the folder object itself (0 byte object ending in /)
                    if (obj.Key === prefix) return;

                    const name = obj.Key.split('/').pop();
                    files.push({
                        id: obj.Key,
                        parentId: parentId || null,
                        workspaceId: this.workspaceId,
                        name: name,
                        type: this.getType(name),
                        size: this.formatSize(obj.Size),
                        date: new Date(obj.LastModified).toLocaleDateString(),
                        mimeType: 'application/octet-stream' // Could infer from name
                    });
                });
            }

            return files;
        } catch (error) {
            console.error("S3 List Error:", error);
            throw new Error(`S3 Error: ${error.message}`);
        }
    }

    async get(fileId) {
        const command = new GetObjectCommand({
            Bucket: this.config.bucket,
            Key: fileId
        });
        const response = await this.client.send(command);
        return response;
    }

    async getContent(id) {
        try {
            const response = await this.get(id);
            // S3 Body is a ReadableStream or Blob-like
            // For text files:
            const str = await response.Body.transformToString();
            return str;
            // For binaries we might need Blob... 
            // transformToByteArray or similar
        } catch (error) {
            console.error("S3 GetContent Error", error);
            throw error;
        }
    }

    async saveFiles(files) {
        const results = [];
        for (const file of files) {
            try {
                // Construct Key
                let key = file.parentId ? `${file.parentId}${file.name}` : file.name;
                // If parentId doesn't end withSlash, fix it.
                if (file.parentId && !file.parentId.endsWith('/') && !key.includes('/')) {
                    // logic for path join
                    key = `${file.parentId}/${file.name}`;
                }

                const command = new PutObjectCommand({
                    Bucket: this.config.bucket,
                    Key: key,
                    Body: file.content
                });

                await this.client.send(command);
                results.push({ id: key, name: file.name, status: 'uploaded' });
            } catch (error) {
                console.error("S3 Upload Error", error);
                throw error;
            }
        }
        return results;
    }

    async createFolder(name, parentId) {
        // S3 "folder" is an object key ending with /
        const prefix = parentId ? (parentId.endsWith('/') ? parentId : `${parentId}/`) : '';
        const key = `${prefix}${name}/`;

        const command = new PutObjectCommand({
            Bucket: this.config.bucket,
            Key: key,
            Body: ''
        });

        await this.client.send(command);
        return {
            id: key,
            name: name,
            type: 'folder',
            parentId: parentId || null,
            workspaceId: this.workspaceId
        };
    }

    async delete(ids) {
        for (const id of ids) {
            const command = new DeleteObjectCommand({
                Bucket: this.config.bucket,
                Key: id
            });
            await this.client.send(command);
        }
    }

    async rename(id, newName) {
        // S3 doesn't support rename. Copy + Delete.
        // Warning: This is expensive for large files.
        const oldKey = id;
        const pathParts = oldKey.split('/');
        pathParts.pop(); // Remove filename
        const newKey = [...pathParts, newName].join('/');

        try {
            const copyCommand = new CopyObjectCommand({
                Bucket: this.config.bucket,
                CopySource: `${this.config.bucket}/${oldKey}`,
                Key: newKey
            });
            await this.client.send(copyCommand);

            const deleteCommand = new DeleteObjectCommand({
                Bucket: this.config.bucket,
                Key: oldKey
            });
            await this.client.send(deleteCommand);
        } catch (error) {
            console.error("S3 Rename Error", error);
            throw error;
        }
    }
}
