import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEYS = {
    WORKSPACES: 'omni_workspaces_v2',
    FILES: 'omni_files_v2',
    ACTIVE_WS: 'omni_active_ws_v2'
};

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
        const storedWorkspaces = JSON.parse(localStorage.getItem(STORAGE_KEYS.WORKSPACES));
        const storedFiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.FILES));
        const storedActiveWs = localStorage.getItem(STORAGE_KEYS.ACTIVE_WS);

        if (storedWorkspaces && storedWorkspaces.length > 0) {
            setWorkspaces(storedWorkspaces);
            setFiles(storedFiles || []);
            const initialWs = storedActiveWs && storedWorkspaces.find(w => w.id === storedActiveWs) ? storedActiveWs : storedWorkspaces[0].id;
            setActiveWorkspace(initialWs);

            const wsObj = storedWorkspaces.find(w => w.id === initialWs);
            if (wsObj && wsObj.connections?.length > 0) {
                const firstConn = wsObj.connections[0];
                const path = [{ id: firstConn.id, name: firstConn.name }];
                setCurrentPath(path);
                setHistory([path]);
                setHistoryIndex(0);
            }
            setAppState('explorer');
        } else {
            setWorkspaces([]);
            setFiles([]);
            setAppState('setup-workspace');
        }
    }, []);

    // Persistence
    useEffect(() => {
        if (appState === 'loading' || appState.startsWith('setup')) return;
        localStorage.setItem(STORAGE_KEYS.WORKSPACES, JSON.stringify(workspaces));
        localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
        localStorage.setItem(STORAGE_KEYS.ACTIVE_WS, activeWorkspace);
    }, [workspaces, files, activeWorkspace, appState]);

    const activeWorkspaceObj = useMemo(() =>
        workspaces.find(w => w.id === activeWorkspace) || workspaces[0],
        [workspaces, activeWorkspace]);

    const currentFolderId = useMemo(() =>
        currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null,
        [currentPath]);

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

    const createFolder = useCallback((name) => {
        setFiles(prev => [...prev, {
            id: Date.now().toString(),
            parentId: currentFolderId,
            name,
            type: 'folder',
            size: '--',
            date: 'Hoje'
        }]);
    }, [currentFolderId]);

    const deleteFiles = useCallback((ids) => {
        setFiles(prev => prev.filter(f => !ids.includes(f.id)));
    }, []);

    const renameFile = useCallback((id, newName) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
    }, []);

    const addFiles = useCallback((newFiles) => {
        setFiles(prev => [...prev, ...newFiles]);
    }, []);

    const navigateToPath = useCallback((path) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(path);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setCurrentPath(path);
    }, [history, historyIndex]);

    // Workspace Management
    const createWorkspace = (name, connections) => {
        const newWs = {
            id: `ws-${Date.now()}`,
            name,
            type: 'custom',
            color: 'bg-blue-600',
            connections
        };
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
    };

    const updateWorkspaceData = (newData) => {
        if (newData.workspaces) setWorkspaces(newData.workspaces);
        if (newData.files) setFiles(newData.files);
    };

    const resetSystem = () => {
        if (confirm("Repor tudo para as predefinições?")) {
            localStorage.clear();
            window.location.reload();
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
