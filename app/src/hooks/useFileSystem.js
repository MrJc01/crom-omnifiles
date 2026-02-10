import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../db';

export function useFileSystem() {
    const [appState, setAppState] = useState('loading'); // 'loading', 'setup-workspace', 'setup-providers', 'explorer', 'error'
    const [workspaces, setWorkspaces] = useState([]);
    const [files, setFiles] = useState([]);
    const [activeWorkspace, setActiveWorkspace] = useState('');
    const [currentPath, setCurrentPath] = useState([]);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [previewFile, setPreviewFile] = useState(null);

    // Initial Load - Carregamento Assíncrono do IndexedDB
    useEffect(() => {
        const loadSystem = async () => {
            try {
                // Tenta inicializar defaults se necessário
                const defaultId = await db.initializeDefaults();

                // Carrega todos os dados do banco
                const storedWorkspaces = await db.workspaces.toArray();
                const storedFiles = await db.files.toArray();

                // Atualiza estado local
                setWorkspaces(storedWorkspaces);
                setFiles(storedFiles || []);

                // Lógica de Workspace Ativo
                if (storedWorkspaces.length > 0) {
                    const initialWsId = defaultId || storedWorkspaces[0].id;
                    setActiveWorkspace(initialWsId);

                    const wsObj = storedWorkspaces.find(w => w.id === initialWsId);
                    if (wsObj && wsObj.connections?.length > 0) {
                        const firstConn = wsObj.connections[0];
                        const path = [{ id: firstConn.id, name: firstConn.name }];
                        setCurrentPath(path);
                        setHistory([path]);
                        setHistoryIndex(0);
                    }
                    setAppState('explorer');
                } else {
                    // Fallback para setup se não houver workspaces (embora initializeDefaults deva criar um)
                    setWorkspaces([]);
                    setFiles([]);
                    setAppState('setup-workspace');
                }
            } catch (error) {
                console.error("Falha ao carregar sistema de arquivos:", error);
                setAppState('error');
            }
        };

        loadSystem();
    }, []);

    const activeWorkspaceObj = useMemo(() =>
        workspaces.find(w => w.id === activeWorkspace) || workspaces[0],
        [workspaces, activeWorkspace]);

    const currentFolderId = useMemo(() =>
        currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null,
        [currentPath]);

    // Helpers de Navegação
    const navigate = useCallback((folder) => {
        if (folder.type !== 'folder') return setPreviewFile(folder);
        const newPath = [...currentPath, { id: folder.id, name: folder.name }];
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newPath);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setCurrentPath(newPath);
    }, [currentPath, history, historyIndex]);

    const navigateBreadcrumb = useCallback((idx) => {
        const newPath = currentPath.slice(0, idx + 1);
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newPath);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setCurrentPath(newPath);
    }, [currentPath, history, historyIndex]);

    const navigateBack = useCallback(() => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
            setCurrentPath(history[historyIndex - 1]);
        }
    }, [history, historyIndex]);

    const navigateForward = useCallback(() => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(prev => prev + 1);
            setCurrentPath(history[historyIndex + 1]);
        }
    }, [history, historyIndex]);

    const navigateToPath = useCallback((path) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(path);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setCurrentPath(path);
    }, [history, historyIndex]);

    const switchWorkspace = useCallback((wsId) => {
        setActiveWorkspace(wsId);
        const ws = workspaces.find(w => w.id === wsId);
        if (ws && ws.connections.length > 0) {
            const conn = ws.connections[0];
            const path = [{ id: conn.id, name: conn.name }];
            setCurrentPath(path);
            setHistory([path]);
            setHistoryIndex(0);
        } else { setCurrentPath([]); }
    }, [workspaces]);

    // --- ACTIONS (CRUD com IndexedDB) ---

    // 1. Create Workspace
    const createWorkspace = async (name, connections) => {
        const newWs = {
            id: `ws-${Date.now()}`, // String ID Explícito
            name,
            type: 'custom',
            color: 'bg-blue-600',
            connections
        };

        try {
            await db.workspaces.put(newWs); // Persistência
            // Atualização de Estado
            setWorkspaces(prev => [...prev, newWs]);
            setActiveWorkspace(newWs.id);

            if (connections.length > 0) {
                const first = connections[0];
                const path = [{ id: first.id, name: first.name }];
                setCurrentPath(path);
                setHistory([path]);
                setHistoryIndex(0);
            }
            setAppState('explorer');
        } catch (error) {
            console.error("Erro ao criar workspace:", error);
        }
    };

    // 2. Create Folder
    const createFolder = useCallback(async (name) => {
        const newFolder = {
            id: `folder-${Date.now()}`, // String ID Explícito
            parentId: currentFolderId,
            workspaceId: activeWorkspace,
            name,
            type: 'folder',
            size: '--',
            date: 'Hoje'
        }; // Sem 'content' para pastas

        try {
            await db.files.put(newFolder); // Persistência
            setFiles(prev => [...prev, newFolder]); // Estado
        } catch (error) {
            console.error("Erro ao criar pasta:", error);
        }
    }, [currentFolderId, activeWorkspace]);

    // 3. Delete Files
    const deleteFiles = useCallback(async (ids) => {
        try {
            await db.files.bulkDelete(ids); // Persistência
            setFiles(prev => prev.filter(f => !ids.includes(f.id))); // Estado
        } catch (error) {
            console.error("Erro ao eliminar ficheiros:", error);
        }
    }, []);

    // 4. Rename File
    const renameFile = useCallback(async (id, newName) => {
        try {
            await db.files.update(id, { name: newName }); // Persistência
            setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f)); // Estado
        } catch (error) {
            console.error("Erro ao renomear ficheiro:", error);
        }
    }, []);

    // 5. Add Files (Upload)
    const addFiles = useCallback(async (newFiles) => {
        // Assegurar metadados corretos
        // IDs já devem vir gerados do componente pai (App.jsx) como strings
        const preparedFiles = newFiles.map(f => ({
            ...f,
            parentId: f.parentId || currentFolderId,
            workspaceId: f.workspaceId || activeWorkspace
        }));

        try {
            await db.files.bulkPut(preparedFiles); // Persistência (bulkPut para upsert/safety)
            // Atualizar estado local
            // Para garantir consistência total, poderíamos recarregar do banco, 
            // mas adicionar diretamente ao estado é mais performante para UI responsiveness.
            setFiles(prev => [...prev, ...preparedFiles]);
        } catch (error) {
            console.error("Erro ao adicionar ficheiros:", error);
        }
    }, [currentFolderId, activeWorkspace]);

    // 6. Import Dropped Files (Recursive Folder Support)
    const importDroppedFiles = useCallback(async (items) => {
        // items: [{ file: File, path: "folder/sub/file.txt" }]
        const folderCache = {}; // path -> id
        const newFiles = [];
        const newFolders = [];

        // Helper to ensure path exists
        const ensureFolder = async (path, rootParentId) => {
            if (!path || path === '.') return rootParentId;
            if (folderCache[path]) return folderCache[path];

            const parts = path.split('/');
            let currentParent = rootParentId;
            let currentPath = '';

            for (const part of parts) {
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                if (folderCache[currentPath]) {
                    currentParent = folderCache[currentPath];
                    continue;
                }

                const existing = files.find(f => f.parentId === currentParent && f.name === part && f.type === 'folder');
                if (existing) {
                    currentParent = existing.id;
                    folderCache[currentPath] = existing.id;
                } else {
                    // Create new folder
                    const folderId = `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    const folder = {
                        id: folderId,
                        parentId: currentParent,
                        workspaceId: activeWorkspace,
                        name: part,
                        type: 'folder',
                        size: '--',
                        date: 'Hoje'
                    };
                    newFolders.push(folder);
                    folderCache[currentPath] = folderId;
                    currentParent = folderId;
                }
            }
            return currentParent;
        };

        try {
            for (const item of items) {
                // item.path is "Folder/File.txt" or just "File.txt"
                const lastSlash = item.path.lastIndexOf('/');
                const folderPath = lastSlash > -1 ? item.path.substring(0, lastSlash) : null;
                const fileName = lastSlash > -1 ? item.path.substring(lastSlash + 1) : item.path;

                let specificParentId = currentFolderId;
                if (folderPath) {
                    specificParentId = await ensureFolder(folderPath, currentFolderId);
                }

                // Prepare File content
                let content = item.file;
                // Pre-process small files (optional, similar to handleFileInputChange)
                if (item.file.size < 5 * 1024 * 1024) { // < 5MB
                    content = await new Promise(r => {
                        const reader = new FileReader();
                        reader.onload = e => r(e.target.result);

                        if (item.file.type.startsWith('text/') ||
                            item.file.type === 'application/json' ||
                            item.file.type === 'application/javascript' ||
                            item.file.name.endsWith('.js') ||
                            item.file.name.endsWith('.jsx') ||
                            item.file.name.endsWith('.html') ||
                            item.file.name.endsWith('.css') ||
                            item.file.name.endsWith('.md')) {
                            reader.readAsText(item.file);
                        } else if (item.file.type.startsWith('image/')) {
                            reader.readAsDataURL(item.file);
                        } else {
                            // Default to Blob object (original item.file) if not read
                            r(item.file);
                        }
                    });
                }

                newFiles.push({
                    id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    parentId: specificParentId,
                    workspaceId: activeWorkspace,
                    name: fileName,
                    type: item.file.type.startsWith('image/') ? 'image' : item.file.type.includes('pdf') ? 'pdf' : 'file',
                    size: item.file.size > 1024 * 1024 ? (item.file.size / 1024 / 1024).toFixed(2) + ' MB' : (item.file.size / 1024).toFixed(2) + ' KB',
                    date: 'Hoje',
                    content: content
                });
            }

            // Bulk Add
            if (newFolders.length > 0) {
                await db.files.bulkPut(newFolders);
                setFiles(prev => [...prev, ...newFolders]);
            }
            if (newFiles.length > 0) {
                await db.files.bulkPut(newFiles);
                setFiles(prev => [...prev, ...newFiles]);
            }

        } catch (error) {
            console.error("Import failed:", error);
        }
    }, [currentFolderId, activeWorkspace, files]);

    // Update Workspace Data (Settings)
    const updateWorkspaceData = async (newData) => {
        try {
            if (newData.workspaces) {
                await db.workspaces.bulkPut(newData.workspaces);
                setWorkspaces(newData.workspaces);
            }
            if (newData.files) {
                await db.files.bulkPut(newData.files);
                setFiles(newData.files);
            }
        } catch (error) {
            console.error("Erro ao atualizar dados do workspace:", error);
        }
    };

    // System Reset
    const resetSystem = async () => {
        try {
            await db.delete();
            window.location.reload();
        } catch (error) {
            console.error("Erro ao resetar sistema:", error);
        }
    };

    return {
        appState, setAppState,
        workspaces, activeWorkspace, activeWorkspaceObj,
        files, setFiles,
        currentPath, historyIndex, history,
        previewFile, setPreviewFile,
        currentFolderId,
        navigate, navigateBreadcrumb, navigateBack, navigateForward, navigateToPath,
        switchWorkspace, createWorkspace, updateWorkspaceData, resetSystem,
        createFolder, deleteFiles, renameFile, addFiles, importDroppedFiles
    };
}
