import { IndexedDBProvider } from './IndexedDBProvider';

/**
 * Factory to get the correct provider based on workspace type.
 */
export const getProvider = (workspace) => {
    if (!workspace) return null;

    switch (workspace.type) {
        case 'local':
        default:
            return new IndexedDBProvider(workspace.id);
    }
};
