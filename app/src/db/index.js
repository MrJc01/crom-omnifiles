import Dexie from 'dexie';

export class OmniFilesDatabase extends Dexie {
    constructor() {
        super('OmniFilesDB');

        // Configuração do Schema
        // workspaces: id (string, PK), name (indexado)
        // files: id (string, PK), parentId (indexado para busca), workspaceId (indexado)
        this.version(1).stores({
            workspaces: '&id, name',
            files: '&id, parentId, workspaceId'
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
                connections: []
            });
            return defaultWsId;
        }
        return null;
    }
}

export const db = new OmniFilesDatabase();
