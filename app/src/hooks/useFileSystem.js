import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../db';
import toast from 'react-hot-toast';
import { getProvider } from '../providers/ProviderFactory';

export function useFileSystem() {
    const [appState, setAppState] = useState('loading'); // 'loading', 'setup-workspace', 'setup-providers', 'explorer', 'error'
    const [workspaces, setWorkspaces] = useState([]);
    const [files, setFiles] = useState([]);
    const [activeWorkspace, setActiveWorkspace] = useState('');
    const [currentPath, setCurrentPath] = useState([]);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [previewFile, setPreviewFile] = useState(null);

    const activeWorkspaceObj = useMemo(() =>
        workspaces.find(w => w.id === activeWorkspace) || workspaces[0],
        [workspaces, activeWorkspace]);

    const provider = useMemo(() => getProvider(activeWorkspaceObj), [activeWorkspaceObj]);

    // Initial Load - Carregamento Assíncrono do IndexedDB
    useEffect(() => {
        const loadSystem = async () => {
            // ... logic later
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
            toast.success(`Workspace "${name}" criado!`);
        } catch (error) {
            console.error("Erro ao criar workspace:", error);
            toast.error("Erro ao criar workspace.");
        }
    };

    // 2. Create Folder
    const createFolder = useCallback(async (name) => {
        if (!provider) return;
        try {
            const newFolder = await provider.createFolder(name, currentFolderId);
            setFiles(prev => [...prev, newFolder]);
            toast.success("Pasta criada!");
        } catch (error) {
            console.error("Erro ao criar pasta:", error);
            toast.error("Erro ao criar pasta.");
        }
    }, [currentFolderId, provider]);

    // 3. Delete Files
    const deleteFiles = useCallback(async (ids) => {
        if (!provider) return;
        try {
            await provider.delete(ids);
            setFiles(prev => prev.filter(f => !ids.includes(f.id)));
            toast.success(`${ids.length} item(s) eliminado(s).`);
        } catch (error) {
            console.error("Erro ao eliminar ficheiros:", error);
            toast.error("Erro ao eliminar itens.");
        }
    }, [provider]);

    // 4. Rename File
    const renameFile = useCallback(async (id, newName) => {
        if (!provider) return;
        try {
            await provider.rename(id, newName);
            setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
            toast.success("Renomeado com sucesso!");
        } catch (error) {
            console.error("Erro ao renomear ficheiro:", error);
            toast.error("Erro ao renomear.");
        }
    }, [provider]);

    // 5. Add Files (Upload)
    const addFiles = useCallback(async (newFiles) => {
        if (!provider) return;
        // IDs must be generated by parent or here.
        const preparedFiles = newFiles.map(f => ({
            ...f,
            parentId: f.parentId || currentFolderId,
            // workspaceId handled by provider or here? Provider knows its workspaceId.
            // But setFiles needs it if filter relies on it.
            workspaceId: f.workspaceId || activeWorkspace
        }));

        try {
            const savedFiles = await provider.saveFiles(preparedFiles);
            setFiles(prev => [...prev, ...savedFiles]);
            toast.success(`${newFiles.length} ficheiro(s) adicionado(s).`);
        } catch (error) {
            console.error("Erro ao adicionar ficheiros:", error);
            toast.error("Erro ao salvar arquivos.");
        }
    }, [currentFolderId, activeWorkspace, provider]);

    // 6. Import Dropped Files (Recursive Folder Support)
    const importDroppedFiles = useCallback(async (items) => {
        const loadingToast = toast.loading("Processando arquivos...");
        const folderCache = {};
        const newFiles = [];
        const newFolders = [];

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
                const lastSlash = item.path.lastIndexOf('/');
                const folderPath = lastSlash > -1 ? item.path.substring(0, lastSlash) : null;
                const fileName = lastSlash > -1 ? item.path.substring(lastSlash + 1) : item.path;

                let specificParentId = currentFolderId;
                if (folderPath) {
                    specificParentId = await ensureFolder(folderPath, currentFolderId);
                }

                let content = item.file;
                // Only read text content for small files to avoid memory issues
                // Images and others are kept as Blob/File objects
                if (item.file.size < 2 * 1024 * 1024) { // < 2MB for text auto-read
                    if (
                        item.file.type.startsWith('text/') ||
                        item.file.type === 'application/json' ||
                        item.file.type === 'application/javascript' ||
                        item.file.name.endsWith('.md') ||
                        item.file.name.endsWith('.txt') ||
                        item.file.name.endsWith('.html') ||
                        item.file.name.endsWith('.css') ||
                        item.file.name.endsWith('.js') ||
                        item.file.name.endsWith('.jsx')
                    ) {
                        content = await new Promise(r => {
                            const reader = new FileReader();
                            reader.onload = e => r(e.target.result);
                            reader.readAsText(item.file);
                        });
                    }
                    // We do NOT read images as DataURL anymore to save DB space and memory.
                    // Storing Blob is efficient in IndexedDB.
                    // Preview component will handle URL.createObjectURL(blob).
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

            if (newFolders.length > 0) {
                if (provider) await provider.saveFiles(newFolders);
                setFiles(prev => [...prev, ...newFolders]);
            }
            if (newFiles.length > 0) {
                if (provider) await provider.saveFiles(newFiles);
                setFiles(prev => [...prev, ...newFiles]);
            }
            toast.dismiss(loadingToast);
            toast.success(`${newFiles.length} arquivos importados!`);

        } catch (error) {
            console.error("Import failed:", error);
            toast.dismiss(loadingToast);
            toast.error("Falha na importação.");
        }
    }, [currentFolderId, activeWorkspace, files]);

    // 7. Download File
    const downloadFile = useCallback((file) => {
        if (!file) return;

        let blob = null;
        if (file.content instanceof Blob || file.content instanceof File) {
            blob = file.content;
        } else if (typeof file.content === 'string') {
            // If content is string, create blob (mostly for legacy text files or code)
            blob = new Blob([file.content], { type: 'text/plain' });
            // If it was a DataURL (legacy images), we might need to convert differently, 
            // but going forward we use Blobs. 
            // For now, let's assume text if string, unless it starts with data:
            if (file.content.startsWith('data:')) {
                // Fetch data url to blob
                fetch(file.content).then(res => res.blob()).then(b => {
                    const url = URL.createObjectURL(b);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = file.name;
                    a.click();
                    URL.revokeObjectURL(url);
                });
                return;
            }
        } else {
            toast.error("Arquivo inválido para download.");
            return;
        }

        if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Download iniciado.");
        }
    }, []);

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
        createFolder, deleteFiles, renameFile, addFiles, importDroppedFiles, downloadFile
    };
}
