import { IndexedDBProvider } from './IndexedDBProvider';
import { LocalFileSystemProvider } from './LocalFileSystemProvider';
import { GoogleDriveProvider } from './GoogleDriveProvider';
import { S3Provider } from './S3Provider';

/**
 * Factory to get the correct provider based on workspace type.
 */
export const getProvider = (workspace) => {
    if (!workspace) return null;

    switch (workspace.type) {
        case 's3':
            // Workspace config contains credentials (region, bucket, keys)
            // Stored in workspace.config object?
            return new S3Provider(workspace.id, workspace.config);
        case 'gdrive':
            // Workspace must store the token (temporarily? or refresh token?)
            // For V1 (Implicit flow), token might expire. 
            // Ideally we pass the token from auth context, OR provider handles re-auth.
            // But Factory is synchronous usually.
            // We'll pass the token if it exists in workspace config (not ideal for security)
            // OR we rely on a global token store.
            // Let's assume workspace.token is set by the app when switching.
            return new GoogleDriveProvider(workspace.id, workspace.token);
        case 'local-fs':
            return new LocalFileSystemProvider(workspace.id, workspace.handle);
        case 'local':
        default:
            return new IndexedDBProvider(workspace.id);
    }
};
