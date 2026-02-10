import Dexie from 'dexie';

export class OmniFilesDatabase extends Dexie {
    constructor() {
        super('OmniFilesDB');

        // Define tables and indexes
        this.version(1).stores({
            workspaces: '++id, name', // Primary key and indexed props
            files: '++id, parentId, workspaceId'
        });

        // The following lines are needed if we want to use the classes
        // Workspace and File mapped to the tables.
        // For now, we'll use plain objects to keep it simple and consistent with previous implementation.
    }

    async initializeDefaults() {
        const workspaceCount = await this.workspaces.count();
        if (workspaceCount === 0) {
            const defaultWsId = `ws-${Date.now()}`;
            await this.workspaces.add({
                id: defaultWsId,
                name: 'Meu Workspace',
                type: 'local',
                color: 'bg-blue-600',
                connections: []
            });
            return defaultWsId;
        }
        return null;
    }
}

export const db = new OmniFilesDatabase();
