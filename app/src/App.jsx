import { useState, useMemo, useEffect } from 'react';
import { Cloud, Folder } from 'lucide-react';
import { useFileSystem } from './hooks/useFileSystem';
import { useSelection } from './hooks/useSelection';
import { useDragDrop } from './hooks/useDragDrop';

// Components
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { FileGrid } from './components/core/FileGrid';
import { FilePreviewModal } from './components/core/FilePreviewModal';
import { ContextMenu } from './components/core/ContextMenu';
import { WorkspaceSetup } from './components/settings/WorkspaceSetup';
import { ProviderSetup } from './components/settings/ProviderSetup';
import { SettingsScreen } from './components/settings/SettingsScreen';

import { useModal } from './context/ModalContext';
import toast from 'react-hot-toast';

function App() {
    const {
        appState, setAppState,
        workspaces, activeWorkspace, activeWorkspaceObj,
        files, currentPath, historyIndex, history,
        previewFile, setPreviewFile,
        currentFolderId,
        navigate, navigateBreadcrumb, navigateBack, navigateForward, navigateToPath,
        switchWorkspace, createWorkspace, updateWorkspaceData, resetSystem,
        createFolder, deleteFiles, renameFile, addFiles, importDroppedFiles, downloadFile
    } = useFileSystem();

    const { selectedFileIds, setSelectedFileIds, toggleSelection, clearSelection } = useSelection();
    const { isDragging, handleDragOver, handleDragLeave, handleDrop } = useDragDrop(importDroppedFiles);

    const { openInput, openConfirm } = useModal();
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [contextMenu, setContextMenu] = useState(null);
    const [setupWorkspaceName, setSetupWorkspaceName] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    // UI State (Persisted)
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('omni_ui_sidebar');
        if (saved !== null) return JSON.parse(saved);
        return window.innerWidth >= 768;
    });

    const toggleSidebar = () => {
        const newState = !isSidebarOpen;
        setIsSidebarOpen(newState);
        localStorage.setItem('omni_ui_sidebar', JSON.stringify(newState));
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
        } else {
            // Browse current folder (root if currentFolderId is null)
            filtered = files.filter(f => f.workspaceId === activeWorkspace && f.parentId === currentFolderId);
        }

        filtered.sort((a, b) => {
            let valA = a[sortConfig.key] || '';
            let valB = b[sortConfig.key] || '';
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [files, currentFolderId, searchQuery, sortConfig, activeWorkspace]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

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
    }, [selectedFileIds, files, deleteFiles, clearSelection, openConfirm, openInput, renameFile]);

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
        setContextMenu(null);
        switch (action) {
            case 'open': navigate(target); break;
            case 'download': downloadFile(target); break;
            case 'rename':
                openInput({
                    title: 'Renomear',
                    initialValue: target.name,
                    onConfirm: (newName) => renameFile(target.id, newName)
                });
                break;
            case 'delete':
                openConfirm({
                    title: 'Eliminar Ficheiro',
                    message: `Tem a certeza que deseja eliminar "${target.name}"?`,
                    confirmText: 'Eliminar',
                    isDanger: true,
                    onConfirm: () => deleteFiles([target.id])
                });
                break;
            case 'new-folder':
                openInput({
                    title: 'Nova Pasta',
                    initialValue: 'Nova Pasta',
                    onConfirm: (name) => createFolder(name)
                });
                break;
            case 'upload': document.getElementById('file-upload-input').click(); break;
            case 'refresh': toast.success("Atualizado!"); break;
            case 'properties':
                openConfirm({
                    title: 'Propriedades',
                    message: `Nome: ${target.name}\nTipo: ${target.type}\nTamanho: ${target.size}\nModificado: ${target.date}`,
                    confirmText: 'Fechar',
                    isDanger: false,
                    onConfirm: () => { } // No action needed
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
                    date: 'Hoje',
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
    if (appState === 'loading') return <div className="h-screen bg-slate-950 flex items-center justify-center text-slate-500">A iniciar OmniFiles...</div>;
    if (appState === 'setup-workspace') return <WorkspaceSetup onNext={handleWorkspaceCreated} />;
    if (appState === 'setup-providers') return <ProviderSetup workspaceName={setupWorkspaceName} onComplete={(conns) => createWorkspace(setupWorkspaceName, conns)} />;

    return (
        <div className="flex h-screen w-full bg-slate-900 text-slate-200 font-sans overflow-hidden selection:bg-blue-500/30">
            {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
            {showSettings && <SettingsScreen onClose={() => setShowSettings(false)} data={{ workspaces, files }} onUpdateData={updateWorkspaceData} onResetSystem={resetSystem} activeWorkspaceId={activeWorkspace} />}
            {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} target={contextMenu.target} onClose={() => setContextMenu(null)} onAction={handleContextAction} />}



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
                onGoRecent={() => {
                    // Filter/Sort for recent could be complex, but for now let's just sort by date desc in root
                    // Or ideally, a "Recent" view that ignores folders?
                    // The user said "as guias", implying simple navigation.
                    // Let's just go to root and sort by date for now.
                    navigateToPath([]);
                    setSortConfig({ key: 'date', direction: 'desc' });
                }}
            />

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
                    setViewMode={setViewMode}
                    onToggleSidebar={toggleSidebar}
                    isSidebarOpen={isSidebarOpen}
                />

                <div className="flex-1 overflow-y-auto p-4 relative" onClick={clearSelection}>
                    <FileGrid
                        files={displayedFiles}
                        viewMode={viewMode}
                        onNavigate={navigate}
                        onContextMenu={handleContextMenu}
                        selectedFileIds={selectedFileIds}
                        onSelect={toggleSelection}
                        sortConfig={sortConfig}
                        requestSort={requestSort}
                    />
                </div>
            </main>
        </div>
    );
}

export default App;
