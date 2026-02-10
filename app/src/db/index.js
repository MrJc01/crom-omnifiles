import Dexie from 'dexie';

export class OmniFilesDatabase extends Dexie {
    constructor() {
        super('OmniFilesDB');

        // Configuração do Schema
        // workspaces: id (string, PK), name (indexado)
        // files: id (string, PK), parentId (indexado para busca), workspaceId (indexado)
        // files: id (string, PK), parentId (indexado para busca), workspaceId (indexado)
        this.version(1).stores({
            workspaces: '&id, name',
            files: '&id, parentId, workspaceId'
        });

        // Add 'name' index for search v2
        this.version(2).stores({
            files: '&id, parentId, workspaceId, name'
        });

        // Add 'isStarred' index for Favorites v3
        this.version(3).stores({
            files: '&id, parentId, workspaceId, name, isStarred'
        });

        // Add 'tags' store and index for Tags v4
        this.version(4).stores({
            tags: '&id, name', // id, name, color (stored but not indexed)
            files: '&id, parentId, workspaceId, name, isStarred, *tags' // *tags = multi-entry index
        });

        // Add 'deletedAt' index for Trash System v5
        this.version(5).stores({
            files: '&id, parentId, workspaceId, name, isStarred, *tags, deletedAt'
        });
    }

    // Inicialização opcional caso o DB esteja vazio
    async initializeDefaults() {
        const workspaceCount = await this.workspaces.count();
        if (workspaceCount === 0) {
            const defaultWsId = `ws-${Date.now()}`;
            await this.workspaces.add({
                id: defaultWsId,
                name: 'Meu Workspace',
                type: 'local',
                color: 'bg-blue-600',
                connections: [
                    {
                        id: `conn-${Date.now()}`,
                        serviceId: 'browser',
                        name: 'Navegador',
                        used: '0',
                        total: '500MB'
                    }
                ]
            });
            return defaultWsId;
        }
        return null;
    }
}

export const db = new OmniFilesDatabase();
