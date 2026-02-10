import { useState, useMemo, useEffect, useCallback } from 'react';
import { Cloud, Folder, Trash2, AlertTriangle } from 'lucide-react';
import { FileSystemProvider, useFileSystem } from './context/FileSystemContext';
import { useSelection } from './hooks/useSelection';
import { useDragDrop } from './hooks/useDragDrop';
import { useTags } from './hooks/useTags';

// Components
import { Sidebar } from './components/layout/Sidebar';
import { SidebarSkeleton } from './components/layout/SidebarSkeleton';
import { Header } from './components/layout/Header';
import { FileGrid } from './components/core/FileGrid';
import { FilePreviewModal } from './components/core/FilePreviewModal';
import { ContextMenu } from './components/core/ContextMenu';
import { WorkspaceSetup } from './components/settings/WorkspaceSetup';
import { ProviderSetup } from './components/settings/ProviderSetup';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { WelcomeScreen } from './components/settings/WelcomeScreen';

import { useModal } from './context/ModalContext';
import { ClipboardProvider, useClipboard } from './context/ClipboardContext';
import { useToast } from './hooks/useToast';
import { DetailsPanel } from './components/layout/DetailsPanel';

const AppLayout = () => {
    const {
        appState, setAppState,
        workspaces, activeWorkspace, activeWorkspaceObj,
        files, currentPath, historyIndex, history,
        previewFile, setPreviewFile,
        currentFolderId,
        navigate, navigateBreadcrumb, navigateBack, navigateForward, navigateToPath, navigateUp,
        switchWorkspace, createWorkspace, updateWorkspaceData, resetSystem,
        createFolder, deleteFiles, renameFile, addFiles, importDroppedFiles, downloadFile,
        openLocalFolder,
        pasteFiles, // New method from useFileSystem
        isProcessing, // UI state
        toggleStar, // New method from useFileSystem
        restoreFiles, permanentDeleteFiles, emptyTrash, downloadFiles, // New
        loadSystem // New method for manual refresh
    } = useFileSystem();

    const { selectedFileIds, setSelectedFileIds, toggleSelection, clearSelection, selectRange, lastSelectedId } = useSelection();
    const { isDragging, handleDragOver, handleDragLeave, handleDrop } = useDragDrop(importDroppedFiles);
    const { clipboard, copy, cut, paste } = useClipboard();
    const toaster = useToast();

    // Selection Logic Wrapper
    const handleFileSelect = (fileId, options = {}) => {
        const { ctrlKey, metaKey, shiftKey } = options;
        const isMulti = ctrlKey || metaKey;

        if (shiftKey && lastSelectedId) {
            // Range Selection
            const lastIndex = displayedFiles.findIndex(f => f.id === lastSelectedId);
            const currentIndex = displayedFiles.findIndex(f => f.id === fileId);

            if (lastIndex !== -1 && currentIndex !== -1) {
                const start = Math.min(lastIndex, currentIndex);
                const end = Math.max(lastIndex, currentIndex);
                const range = displayedFiles.slice(start, end + 1).map(f => f.id);

                // If Ctrl is also pressed, we append to existing selection? 
                // Standard behavior: Shift+Click replaces selection with range relative to anchor, 
                // preserving others if Ctrl held? Complex.
                // Simple version: Shift+Click selects strictly the range from Anchor to Target.
                selectRange(range);
                return;
            }
        }

        toggleSelection(fileId, isMulti);
    };

    const handleRangeSelect = (ids) => {
        setSelectedFileIds(ids);
    };

    const { openInput, openConfirm } = useModal();
    const [viewMode, setViewMode] = useState('grid');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [searchQuery, setSearchQuery] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [contextMenu, setContextMenu] = useState(null);
    const [setupWorkspaceName, setSetupWorkspaceName] = useState('');

    // Persistent Preferences
    const [folderPrefs, setFolderPrefs] = useState(() => {
        try { return JSON.parse(localStorage.getItem('omni_folder_prefs')) || {}; }
        catch { return {}; }
    });

    // Save prefs to LS
    useEffect(() => {
        localStorage.setItem('omni_folder_prefs', JSON.stringify(folderPrefs));
    }, [folderPrefs]);



    // Apply prefs when folder changes
    useEffect(() => {
        const key = currentFolderId || 'root';
        const prefs = folderPrefs[key];
        if (prefs) {
            if (prefs.viewMode) setViewMode(prefs.viewMode);
            if (prefs.sortConfig) setSortConfig(prefs.sortConfig);
        }
    }, [currentFolderId]);

    const handleSetViewMode = (mode) => {
        setViewMode(mode);
        const key = currentFolderId || 'root';
        setFolderPrefs(prev => ({
            ...prev,
            [key]: { ...prev[key], viewMode: mode }
        }));
    };

    const handleRequestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        const newSort = { key, direction };
        setSortConfig(newSort);
        const wsKey = currentFolderId || 'root';
        setFolderPrefs(prev => ({
            ...prev,
            [wsKey]: { ...prev[wsKey], sortConfig: newSort }
        }));
    };
    const [activeTagId, setActiveTagId] = useState(null); // Filter by Tag

    const { tags, addTag, updateTag, deleteTag, toggleFileTag } = useTags();

    // UI State (Persisted)
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('omni_ui_sidebar');
        if (saved !== null) return JSON.parse(saved);
        return window.innerWidth >= 768;
    });

    const [showDetails, setShowDetails] = useState(() => {
        const saved = localStorage.getItem('omni_ui_details');
        if (saved !== null) return JSON.parse(saved);
        return false;
    });

    const toggleSidebar = () => {
        const newState = !isSidebarOpen;
        setIsSidebarOpen(newState);
        localStorage.setItem('omni_ui_sidebar', JSON.stringify(newState));
    };

    const toggleDetails = () => {
        const newState = !showDetails;
        setShowDetails(newState);
        localStorage.setItem('omni_ui_details', JSON.stringify(newState));
    };

    // Expose for Debug Scripts
    useEffect(() => {
        window.OmniFiles = {
            state: {
                appState, workspaces, activeWorkspace,
                files, currentPath, history,
                selectedFileIds
            },
            actions: {
                navigate, navigateBreadcrumb, navigateBack, navigateForward, navigateToPath,
                switchWorkspace, createWorkspace, updateWorkspaceData, resetSystem,
                createFolder, deleteFiles, renameFile, addFiles,
                setSelectedFileIds, toggleSelection, clearSelection
            }
        };
        return () => { delete window.OmniFiles; };
    }, [
        appState, workspaces, activeWorkspace, files, currentPath, history, selectedFileIds,
        navigate, navigateBreadcrumb, navigateBack, navigateForward, navigateToPath,
        switchWorkspace, createWorkspace, updateWorkspaceData, resetSystem,
        createFolder, deleteFiles, renameFile, addFiles,
        setSelectedFileIds, toggleSelection, clearSelection
    ]);

    // Filter and Sort Files
    const displayedFiles = useMemo(() => {
        let filtered = [];

        if (searchQuery.trim() !== '') {
            // Search in entire workspace
            filtered = files.filter(f => f.workspaceId === activeWorkspace && f.name.toLowerCase().includes(searchQuery.toLowerCase()));
        } else if (currentFolderId === 'favorites') {
            // Browse Favorites
            filtered = files.filter(f => f.workspaceId === activeWorkspace && f.isStarred && !f.deletedAt);
        } else if (currentFolderId === 'recent') {
            // Browse Recent (All files in workspace, sorted by date)
            // Ideally we should filter out folders? "Recentes" usually implies modified files.
            // Let's show everything for now, but forced sort by date desc.
            filtered = files.filter(f => f.workspaceId === activeWorkspace && !f.deletedAt);
            // Override sort config temporarily? Or just let user sort?
            // "Recentes" demands date sorting.
            // We can enforce it in the sort logic below if we want, or just rely on Sidebar setting it.
            // But Sidebar only set it once. If user changes sort, it stays.
            // Let's filter here.
        } else if (currentFolderId === 'trash') {
            // Browse Trash
            filtered = files.filter(f => f.workspaceId === activeWorkspace && f.deletedAt);
        } else if (activeTagId) {
            // Browse by Tag
            filtered = files.filter(f => f.workspaceId === activeWorkspace && f.tags && f.tags.includes(activeTagId) && !f.deletedAt);
        } else {
            // Browse current folder (root if currentFolderId is null)

            // SPECIAL CASE: Root View for Workspaces with Connections
            // If we are at root (currentFolderId === null) AND the workspace has connections,
            // we should display the connections as "Drives/Folders" INSTEAD of files.
            // User Request: "na pasta 'origem' é para mostrar apenas conexões"

            if (currentFolderId === null && activeWorkspaceObj && activeWorkspaceObj.connections && activeWorkspaceObj.connections.length > 0) {
                // Map connections to fake file objects
                filtered = activeWorkspaceObj.connections.map(conn => ({
                    id: conn.id,
                    name: conn.name,
                    type: 'folder', // Treat as folder for navigation
                    isConnection: true, // Flag for potential custom rendering

                    // Metadata for Grid
                    size: conn.total || '--',
                    date: '--',
                    tags: [],
                    isStarred: false,

                    // Helper properties
                    workspaceId: activeWorkspace,
                    parentId: null
                }));
                // We do NOT include loose files here, per user request.
            } else {
                // Normal behavior (subfolders or local workspace root)
                filtered = files.filter(f => f.workspaceId === activeWorkspace && f.parentId === currentFolderId && !f.deletedAt);
            }
        }

        filtered.sort((a, b) => {
            // Always Folders First? (Standard behavior)
            // If user wants strict type sorting, folder is just a type.
            // But usually folders > files.
            // Let's implement: Folders always on top, then sort by key.
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;

            let valA = a[sortConfig.key] || '';
            let valB = b[sortConfig.key] || '';

            // Unique handling for size (convert string to number if possible for correct sort)
            // Current size is string "1.2 MB".
            // We have `sizeRaw` in some files.
            if (sortConfig.key === 'size') {
                valA = a.sizeRaw || 0;
                valB = b.sizeRaw || 0;
            }

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [files, currentFolderId, searchQuery, sortConfig, activeWorkspace, activeTagId]);



    // Responsive & Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // General Shortcuts
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                setIsSidebarOpen(prev => {
                    const newState = !prev;
                    localStorage.setItem('omni_ui_sidebar', JSON.stringify(newState));
                    return newState;
                });
            }

            // Clipboard Shortcuts
            if (e.ctrlKey || e.metaKey) {
                if (e.key.toLowerCase() === 'c' && selectedFileIds.length > 0) {
                    e.preventDefault();
                    const items = files.filter(f => selectedFileIds.includes(f.id));
                    copy(items);
                }
                if (e.key.toLowerCase() === 'x' && selectedFileIds.length > 0) {
                    e.preventDefault();
                    const items = files.filter(f => selectedFileIds.includes(f.id));
                    cut(items);
                }
                if (e.key.toLowerCase() === 'v') {
                    e.preventDefault();
                    paste();
                }
            }

            // Selection Shortcuts
            if (selectedFileIds.length > 0) {
                if (e.key === 'Delete') {
                    openConfirm({
                        title: 'Eliminar Itens',
                        message: `Tem a certeza que deseja eliminar ${selectedFileIds.length} itens?`,
                        confirmText: 'Eliminar',
                        isDanger: true,
                        onConfirm: () => {
                            deleteFiles(selectedFileIds);
                            clearSelection(); // This might run before deleteFiles finishes, but it's async in hook. Should be fine.
                        }
                    });
                }
                if (e.key === 'F2') {
                    const fileToRename = files.find(f => f.id === selectedFileIds[0]);
                    if (fileToRename) {
                        openInput({
                            title: 'Renomear',
                            initialValue: fileToRename.name,
                            onConfirm: (newName) => renameFile(fileToRename.id, newName)
                        });
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedFileIds, files, deleteFiles, clearSelection, openConfirm, openInput, renameFile, copy, cut, paste]);

    // Auto-close sidebar on mobile navigation
    useEffect(() => {
        if (window.innerWidth < 768 && isSidebarOpen) {
            setIsSidebarOpen(false);
        }
    }, [currentPath, currentFolderId]);

    // Handlers
    const handleContextMenu = (e, target = null) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, target });
    };

    const handleContextAction = (action, target) => {
        // If action is object (e.g. from tag menu), normalize
        if (typeof action === 'object' && action.type) {
            if (action.type === 'toggle-tag') {
                if (target.deletedAt) {
                    toaster.error("Não é possível editar tags de itens na lixeira.");
                    setContextMenu(null);
                    return;
                }
                toggleFileTag(target, action.tagId);
            }
            setContextMenu(null);
            return;
        }

        setContextMenu(null);
        switch (action) {
            case 'open': navigate(target); break;
            case 'download':
                if (selectedFileIds.length > 1) {
                    downloadFiles(selectedFileIds);
                } else {
                    downloadFile(target);
                }
                break;
            case 'rename':
                openInput({
                    title: 'Renomear',
                    initialValue: target.name,
                    onConfirm: (newName) => renameFile(target.id, newName)
                });
                break;
            case 'delete': {
                const idsToDelete = selectedFileIds.length > 1 ? selectedFileIds : [target.id];
                const msg = idsToDelete.length > 1
                    ? `Tem a certeza que deseja eliminar ${idsToDelete.length} itens?`
                    : `Tem a certeza que deseja eliminar "${target.name}"?`;
                openConfirm({
                    title: 'Eliminar',
                    message: msg,
                    confirmText: 'Eliminar',
                    isDanger: true,
                    onConfirm: () => deleteFiles(idsToDelete)
                });
                break;
            }
            case 'cut': {
                const cutItems = selectedFileIds.length > 1 ? files.filter(f => selectedFileIds.includes(f.id)) : [target];
                cut(cutItems);
                break;
            }
            case 'copy': {
                const copyItems = selectedFileIds.length > 1 ? files.filter(f => selectedFileIds.includes(f.id)) : [target];
                copy(copyItems);
                break;
            }
            case 'paste': paste(); break;
            case 'new-folder':
                openInput({
                    title: 'Nova Pasta',
                    initialValue: 'Nova Pasta',
                    onConfirm: (name) => createFolder(name)
                });
                break;
            case 'upload': document.getElementById('file-upload-input').click(); break;
            case 'refresh': toaster.success("Atualizado!"); break;
            case 'properties':
                openConfirm({
                    title: 'Propriedades',
                    message: `Nome: ${target.name}\nTipo: ${target.type}\nTamanho: ${target.size}\nModificado: ${target.date}`,
                    confirmText: 'Fechar',
                    isDanger: false,
                    onConfirm: () => { } // No action needed
                });
                break;

            case 'star':
                toggleStar(target);
                break;
            case 'toggle-tag':
                toggleFileTag(target, action.tagId);
                break;
            case 'restore':
                restoreFiles([target.id]);
                break;
            case 'delete-forever':
                openConfirm({
                    title: 'Excluir Permanentemente',
                    message: `Esta ação não pode ser desfeita. Deseja excluir "${target.name}" para sempre?`,
                    confirmText: 'Excluir',
                    isDanger: true,
                    onConfirm: () => permanentDeleteFiles([target.id])
                });
                break;
            case 'empty-trash':
                openConfirm({
                    title: 'Esvaziar Lixeira',
                    message: `Tem a certeza que deseja excluir permanentemente todos os itens da lixeira?`,
                    confirmText: 'Esvaziar',
                    isDanger: true,
                    onConfirm: () => emptyTrash()
                });
                break;
        }
    };

    const handleFileInputChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = [];
            for (let i = 0; i < e.target.files.length; i++) {
                const file = e.target.files[i];

                // Read file as ArrayBuffer for binary support or DataURL for preview if needed
                // For now, keeping DataURL as per original implementation for images/text, 
                // but for large binary files this might be memory intensive. 
                // IndexedDB can store Blobs directly.
                // However, existing code expects 'content' property.
                // Let's store the File object itself if possible or read as needed.
                // The current implementation seems to expect 'content' to be a string (DataURL or text).
                // For very large files, reading into a string string might crash browser memory.
                // But user asked to use IndexedDB to support it.
                // Dexie supports storing native File/Blob objects.
                // Let's try to store the 'file' object in 'content' if it's not text/image, 
                // or just modify the schema/logic to handle Blobs.
                // But to be safe and "just work" with current UI (which might try to render content?), 
                // let's stick to reading it but maybe don't crash.
                // Actually, reading 500MB into a DataURL string is a bad idea.
                // Better: Store the File object (Blob) directly in 'content' or a new field.
                // The current UI seems to use 'content' for preview.
                // The 'useFileSystem' hook's 'addFiles' just takes the object and puts it in DB.
                // Let's read small files for preview, and keep large files as Blobs.

                let content = null;
                if (file.size < 5 * 1024 * 1024) { // Read content for small files only (< 5MB)
                    content = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        if (file.type.startsWith('text/') ||
                            file.type === 'application/json' ||
                            file.type === 'application/javascript' ||
                            file.name.endsWith('.js') ||
                            file.name.endsWith('.jsx') ||
                            file.name.endsWith('.html') ||
                            file.name.endsWith('.css') ||
                            file.name.endsWith('.md')) {
                            reader.readAsText(file);
                        } else if (file.type.startsWith('image/')) {
                            reader.readAsDataURL(file);
                        } else {
                            resolve(file); // Store blob for others
                        }
                    });
                } else {
                    // For large files, we might want to store the Blob reference or just null for now
                    // creating ObjectURL for preview if needed.
                    // But for persistence, we need the data.
                    // Dexie can store the File object directly!
                    content = file;
                }

                newFiles.push({
                    id: `file-${Date.now()}-${i}`,
                    parentId: currentFolderId,
                    name: file.name,
                    type: file.type.startsWith('image/') ? 'image' : file.type.includes('pdf') ? 'pdf' : 'file',
                    size: file.size > 1024 * 1024 ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : (file.size / 1024).toFixed(2) + ' KB',
                    sizeRaw: file.size,
                    date: new Date().toLocaleDateString(),
                    content: content
                });
            }
            if (newFiles.length > 0) addFiles(newFiles);
        }
    };

    const handleCreateFolderClick = () => {
        openInput({
            title: 'Nova Pasta',
            initialValue: 'Nova Pasta',
            onConfirm: (name) => createFolder(name)
        });
    };

    const handleCreateWorkspace = () => {
        openInput({
            title: 'Novo Workspace',
            initialValue: '',
            placeholder: 'Nome do Workspace',
            onConfirm: (name) => {
                const connections = [{ id: `conn-${Date.now()}`, serviceId: 'browser', name: 'Local', used: '0', total: '500MB' }];
                createWorkspace(name, connections);
            }
        });
    };


    // Setup Handlers
    const handleWorkspaceCreated = (name) => {
        setSetupWorkspaceName(name);
        setAppState('setup-providers');
    };

    // Render Logic
    if (appState === 'welcome') return <WelcomeScreen onStart={() => setAppState('setup-workspace')} onQuickStart={() => {
        const connections = [{ id: `conn-${Date.now()}`, serviceId: 'browser', name: 'Navegador', used: '0', total: '500MB' }];
        createWorkspace('Meu Workspace', connections);
    }} />;
    if (appState === 'setup-workspace') return <WorkspaceSetup onNext={handleWorkspaceCreated} />;
    if (appState === 'setup-providers') return <ProviderSetup workspaceName={setupWorkspaceName} onComplete={(conns) => createWorkspace(setupWorkspaceName, conns)} />;
    if (appState === 'error') return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
            <div className="text-red-500 mb-4"><AlertTriangle size={64} /></div>
            <h1 className="text-2xl font-bold mb-2">Erro ao carregar o sistema</h1>
            <p className="text-slate-400 mb-8">Ocorreu um problema ao acessar o banco de dados.</p>
            <button onClick={() => window.location.reload()} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-colors">
                Recarregar Aplicação
            </button>
        </div>
    );

    return (
        <div className="flex h-screen w-full bg-slate-900 text-slate-200 font-sans overflow-hidden selection:bg-blue-500/30">
            {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
            {showSettings && <SettingsScreen
                onClose={() => setShowSettings(false)}
                data={{ workspaces, files, tags }}
                onUpdateData={updateWorkspaceData}
                onResetSystem={resetSystem}
                activeWorkspaceId={activeWorkspace}
                tagActions={{ addTag, updateTag, deleteTag }}
            />}
            {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} target={contextMenu.target} tags={tags} onClose={() => setContextMenu(null)} onAction={handleContextAction} selectedCount={selectedFileIds.length} isTrash={currentFolderId === 'trash'} hasClipboard={clipboard?.items?.length > 0} />}



            <input type="file" id="file-upload-input" className="hidden" multiple onChange={handleFileInputChange} />

            <Sidebar
                workspaces={workspaces}
                activeWorkspaceObj={activeWorkspaceObj}
                activeWorkspaceId={activeWorkspace}
                onSwitchWorkspace={switchWorkspace}
                onCreateWorkspace={handleCreateWorkspace}
                onShowSettings={setShowSettings}
                currentPath={currentPath}
                onNavigateDrive={(conn) => {
                    const path = [{ id: conn.id, name: conn.name }];
                    navigateToPath(path);
                }}
                isOpen={isSidebarOpen}
                onGoHome={() => {
                    navigateToPath([]);
                    setSortConfig({ key: 'name', direction: 'asc' });
                }}
                onGoFavorites={() => {
                    navigateToPath([{ id: 'favorites', name: 'Favoritos' }]);
                    setActiveTagId(null);
                }}
                onGoRecent={() => {
                    // Filter/Sort for recent could be complex, but for now let's just sort by date desc in root
                    // Or ideally, a "Recent" view that ignores folders?
                    // The user said "as guias", implying simple navigation.
                    // Let's just go to root and sort by date for now.
                    navigateToPath([]);
                    setSortConfig({ key: 'date', direction: 'desc' });
                    setActiveTagId(null);
                }}
                onOpenLocal={openLocalFolder}
                tags={tags}
                activeTagId={activeTagId}
                onNavigateTag={(tagId) => {
                    setActiveTagId(tagId);
                    // navigateToPath to 'tags' pseudo-folder so Breadcrumb shows something?
                    // or just keep current path but filter grid?
                    // Expected behavior: "Go to Tag view".
                    // Let's clear current path logic to avoid confusion with folders.
                    // But we need a way to show "Tag: X" in header?
                    // Header uses `navigateBreadcrumb`.
                    // Let's set a fake breadcrumb.
                    const tag = tags.find(t => t.id === tagId);
                    navigateToPath([{ id: `tag-${tagId}`, name: tag ? `# ${tag.name}` : 'Tag' }]);
                    // But `navigateToPath` sets `currentFolderId` to the last item id.
                    // So `currentFolderId` becomes `tag-ID`.
                    // In `displayedFiles`, we check `activeTagId` FIRST.
                    // So `currentFolderId` won't matter for filtering, but useful for breadcrumb.
                    // IMPORTANT: `displayedFiles` checks `searchQuery` -> `favorites` -> `activeTagId` -> `parentId=currentFolderId`.
                    // We need to ensure `currentFolderId` doesn't match a folder if we want tag view.
                    // Yes, `tag-ID` won't match any `parentId`.
                }}
                onGoTrash={() => {
                    navigateToPath([{ id: 'trash', name: 'Lixeira' }]);
                    setActiveTagId(null);
                }}
            />

            {/* Loading Overlay or Skeleton? */}
            {/* If loading, we might want to mask the whole thing, but user asked for SidebarSkeleton. */}
            {/* Let's say if (appState === 'loading') we show skeleton INSTEAD of Sidebar? */}
            {/* But appState 'loading' is usually very fast on initial load. */}
            {/* Let's assume we want to show it if workspaces length is 0 and we are loading? */}
            {/* Actually, existing code returns 'WorkspaceSetup' if appState is 'setup-workspace'. */}
            {/* 'loading' state currently does nothing in the return of useFileSystem? */}
            {/* useFileSystem initializes appState to 'loading'. */}

            {appState === 'loading' && (
                <div className="absolute inset-0 z-50 flex bg-slate-900 text-white">
                    <SidebarSkeleton />
                    <div className="flex-1 p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 content-start">
                        {/* Fake Grid Skeletons */}
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="animate-pulse bg-slate-800 rounded-xl h-32"></div>
                        ))}
                    </div>
                </div>
            )}

            <main
                className={`flex-1 flex flex-col bg-slate-900 relative min-w-0 transition-colors ${isDragging ? 'bg-slate-800/80 ring-4 ring-blue-500/30' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, currentFolderId)}
                onContextMenu={(e) => handleContextMenu(e, null)}
            >
                {isDragging && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm pointer-events-none">
                        <div className="text-center animate-bounce">
                            <Cloud size={64} className="mx-auto text-blue-400 mb-4" />
                            <h2 className="text-2xl font-bold text-white">Largar ficheiros para carregar</h2>
                        </div>
                    </div>
                )}

                <Header
                    currentPath={currentPath}
                    onNavigateBreadcrumb={navigateBreadcrumb}
                    onBack={navigateBack}
                    onForward={navigateForward}
                    historyIndex={historyIndex}
                    historyLength={history.length}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onCreateFolder={handleCreateFolderClick}
                    viewMode={viewMode}
                    setViewMode={handleSetViewMode}
                    onToggleSidebar={toggleSidebar}
                    isSidebarOpen={isSidebarOpen}
                    isProcessing={isProcessing}
                    showDetails={showDetails}
                    onToggleDetails={toggleDetails}
                />

                <div className="flex-1 overflow-y-auto p-4 relative" onClick={clearSelection}>
                    <FileGrid
                        files={displayedFiles}
                        viewMode={viewMode}
                        onNavigate={navigate}
                        onContextMenu={handleContextMenu}
                        selectedFileIds={selectedFileIds}
                        onSelect={handleFileSelect}
                        onSelectRange={handleRangeSelect}
                        sortConfig={sortConfig}
                        requestSort={handleRequestSort}
                        isLoading={appState === 'loading' || isProcessing}
                        onNavigateUp={navigateUp}
                        tags={tags}
                        onCreateFolder={handleCreateFolderClick}
                        onUpload={() => document.getElementById('file-upload-input').click()}
                        onRefresh={() => loadSystem()}
                        isTrash={currentFolderId === 'trash'}
                    />
                </div>

                <DetailsPanel
                    isOpen={showDetails}
                    onClose={() => setShowDetails(false)}
                    selectedFiles={files.filter(f => selectedFileIds.includes(f.id))}
                    tags={tags}
                    onToggleTag={toggleFileTag}
                />
            </main>
        </div>
    );
};

function App() {
    return (
        <FileSystemProvider>
            <AppLayoutWithClipboard />
        </FileSystemProvider>
    );
}

const AppLayoutWithClipboard = () => {
    // Single instance of useFileSystem — no more duplicate!
    const fs = useFileSystem();

    const handlePaste = useCallback((items, action) => {
        if (fs.pasteFiles) fs.pasteFiles(items, action);
    }, [fs.pasteFiles]);

    return (
        <ClipboardProvider onPaste={handlePaste}>
            <AppLayout />
        </ClipboardProvider>
    );
};

export default App;
