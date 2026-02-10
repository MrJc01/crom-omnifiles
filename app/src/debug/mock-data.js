/**
 * OMNIFILES MOCK DATA
 * 
 * Adapted for OmniFiles.
 * Use via console: OmniMock.apply() or OmniMock.generateMany(50)
 */

const OmniMock = {
    // Example Workspaces
    workspaces: [
        {
            id: 'ws-mock-1',
            name: 'Mock Workspace',
            connections: [{ id: 'conn-m1', serviceId: 'browser', name: 'Browser Mock', used: '1', total: '1GB' }]
        },
        {
            id: 'ws-mock-2',
            name: 'Project Alpha',
            connections: [{ id: 'conn-m2', serviceId: 'browser', name: 'Browser Alpha', used: '2', total: '5GB' }]
        }
    ],

    // Example Files
    files: [
        {
            id: 'file-mock-1',
            parentId: null,
            name: 'Mock Document.txt',
            type: 'text',
            size: '15 KB',
            date: '2024-05-22',
            content: 'data:text/plain;base64,VGhpcyBpcyBhIG1vY2sgZG9jdW1lbnQu'
        },
        {
            id: 'folder-mock-1',
            parentId: null,
            name: 'Mock Folder',
            type: 'folder',
            size: '-',
            date: '2024-05-22'
        },
        {
            id: 'file-mock-2',
            parentId: 'folder-mock-1',
            name: 'Nested Image.png',
            type: 'image',
            size: '2.5 MB',
            date: '2024-05-22',
            content: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
        }
    ],

    // Helper to interact with React state via exposed actions
    async apply() {
        console.log('%c🔧 Applying Mock Data...', 'color: #f59e0b;');

        if (!window.OmniFiles) return console.error("OmniFiles not found");

        const { createWorkspace, addFiles } = window.OmniFiles.actions;

        // Create workspaces
        this.workspaces.forEach(ws => createWorkspace(ws.name, ws.connections));

        // Add files (using a timeout to ensure state updates if needed, though Actions are direct)
        // Note: addFiles expects an array of files. We need to handle folder structure manually 
        // because addFiles puts everything in currentFolderId. 
        // This mock script is limited by the exposed actions which assume UI context.
        // We will just add files to current folder for simplicity or simulate navigation.

        addFiles(this.files);

        console.log('%c✓ Mock Data Applied!', 'color: #10b981;');
    },

    async generateMany(count = 50) {
        console.log(`%c🔧 Generating ${count} files...`, 'color: #f59e0b;');
        if (!window.OmniFiles) return;

        const { addFiles } = window.OmniFiles.actions;
        const newFiles = [];

        for (let i = 0; i < count; i++) {
            newFiles.push({
                id: `gen-${Date.now()}-${i}`,
                parentId: window.OmniFiles.state.currentFolderId,
                name: `Generated File ${i}.txt`,
                type: 'text',
                size: `${(Math.random() * 100).toFixed(2)} KB`,
                date: new Date().toLocaleDateString(),
                content: 'data:text/plain;base64,VGhpcyBpcyBhIGdlbmVyYXRlZCBmaWxlLg=='
            });
        }

        addFiles(newFiles);
        console.log(`%c✓ ${count} files generated!`, 'color: #10b981;');
    }
};

window.OmniMock = OmniMock;
export default OmniMock;
