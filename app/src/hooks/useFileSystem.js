import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../db';

export function useFileSystem() {
    const [appState, setAppState] = useState('loading'); // 'loading', 'setup-workspace', 'setup-providers', 'explorer'
    const [workspaces, setWorkspaces] = useState([]);
    const [files, setFiles] = useState([]);
    const [activeWorkspace, setActiveWorkspace] = useState('');
    const [currentPath, setCurrentPath] = useState([]);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [previewFile, setPreviewFile] = useState(null);

    // Initial Load
    useEffect(() => {
        const loadSystem = async () => {
            try {
                // Initialize defaults if needed
                const defaultId = await db.initializeDefaults();

                const storedWorkspaces = await db.workspaces.toArray();
                const storedFiles = await db.files.toArray();

                setWorkspaces(storedWorkspaces);
                setFiles(storedFiles || []);

                if (storedWorkspaces.length > 0) {
                    // Use default created ID or first workspace
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
                    // Fallback, though initializeDefaults should prevent this
                    setWorkspaces([]);
                    setFiles([]);
                    setAppState('setup-workspace');
                }
            } catch (error) {
                console.error("Failed to load filesystem:", error);
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

    // Refresh local state from DB
    const refreshFiles = useCallback(async () => {
        const allFiles = await db.files.toArray();
        setFiles(allFiles);
    }, []);

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

    const createFolder = useCallback(async (name) => {
        const newFolder = {
            parentId: currentFolderId,
            workspaceId: activeWorkspace,
            name,
            type: 'folder',
            size: '--',
            date: 'Hoje'
        };

        try {
            const id = await db.files.add(newFolder);
            // Update local state with the generated ID
            setFiles(prev => [...prev, { ...newFolder, id }]);
        } catch (error) {
            console.error("Failed to create folder:", error);
        }
    }, [currentFolderId, activeWorkspace]);

    const deleteFiles = useCallback(async (ids) => {
        try {
            await db.files.bulkDelete(ids);
            setFiles(prev => prev.filter(f => !ids.includes(f.id)));
        } catch (error) {
            console.error("Failed to delete files:", error);
        }
    }, []);

    const renameFile = useCallback(async (id, newName) => {
        try {
            await db.files.update(id, { name: newName });
            setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
        } catch (error) {
            console.error("Failed to rename file:", error);
        }
    }, []);

    const addFiles = useCallback(async (newFiles) => {
        // Ensure files have necessary metadata
        const preparedFiles = newFiles.map(f => ({
            ...f,
            parentId: f.parentId || currentFolderId,
            workspaceId: f.workspaceId || activeWorkspace
        }));

        try {
            await db.files.bulkAdd(preparedFiles);
            await refreshFiles(); // Refresh to get valid IDs
        } catch (error) {
            console.error("Failed to add files:", error);
        }
    }, [currentFolderId, activeWorkspace, refreshFiles]);

    const navigateToPath = useCallback((path) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(path);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setCurrentPath(path);
    }, [history, historyIndex]);

    // Workspace Management
    const createWorkspace = async (name, connections) => {
        const newWs = {
            id: `ws-${Date.now()}`,
            name,
            type: 'custom',
            color: 'bg-blue-600',
            connections
        };

        try {
            await db.workspaces.add(newWs);
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
            console.error("Failed to create workspace:", error);
        }
    };

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
            console.error("Failed to update workspace data:", error);
        }
    };

    const resetSystem = async () => {
        try {
            await db.delete();
            window.location.reload();
        } catch (error) {
            console.error("Failed to reset system:", error);
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
        createFolder, deleteFiles, renameFile, addFiles
    };
}
