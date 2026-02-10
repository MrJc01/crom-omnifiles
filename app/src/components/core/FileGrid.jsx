import { Folder, ArrowUp, ArrowDown, MoreVertical } from 'lucide-react';
import { FileIcon } from './FileIcon';

const SortIcon = ({ col, sortConfig }) => {
    if (sortConfig.key !== col) return null;
    return sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
};

export const FileGrid = ({
    files,
    viewMode,
    onNavigate,
    onContextMenu,
    selectedFileIds,
    onSelect,
    renamingId,
    renameName,
    setRenameName,
    handleRenameSave,
    handleRenameCancel,
    sortConfig,
    requestSort
}) => {
    if (files.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Folder size={48} className="text-slate-700 mb-4" />
                <p>Esta pasta está vazia. Arraste ficheiros ou clique com o botão direito.</p>
            </div>
        );
    }

    if (viewMode === 'grid') {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-20">
                {files.map(file => (
                    <div
                        key={file.id}
                        onClick={(e) => { e.stopPropagation(); onSelect(file.id, e.ctrlKey || e.metaKey); }}
                        onDoubleClick={() => onNavigate(file)}
                        onContextMenu={(e) => onContextMenu(e, file)}
                        title={file.name}
                        className={`group relative flex flex-col items-center justify-start p-4 rounded-xl border transition-all cursor-pointer h-[140px] select-none ${selectedFileIds.includes(file.id) ? 'bg-blue-600/20 border-blue-500/50' : 'bg-transparent border-transparent hover:bg-slate-800 hover:border-slate-700'}`}
                    >
                        <div className="mb-3 pointer-events-none"><FileIcon type={file.type} className="w-12 h-12" /></div>
                        {renamingId === file.id ? (
                            <input
                                type="text"
                                autoFocus
                                value={renameName}
                                onChange={(e) => setRenameName(e.target.value)}
                                onBlur={handleRenameSave}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSave(); else if (e.key === 'Escape') handleRenameCancel(); }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full text-xs text-center bg-slate-900 border border-blue-500 rounded px-1 py-0.5 text-white outline-none"
                            />
                        ) : (
                            <span className="text-sm text-center text-slate-300 font-medium truncate w-full px-2 pointer-events-none">{file.name}</span>
                        )}
                        <span className="text-[10px] text-slate-500 mt-1 pointer-events-none">{file.date}</span>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col pb-20">
            <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 bg-slate-900 z-10">
                <div className="col-span-6 flex items-center gap-1 cursor-pointer hover:text-white" onClick={() => requestSort('name')}>Nome <SortIcon col="name" sortConfig={sortConfig} /></div>
                <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-white" onClick={() => requestSort('size')}>Tamanho <SortIcon col="size" sortConfig={sortConfig} /></div>
                <div className="col-span-3 flex items-center gap-1 cursor-pointer hover:text-white" onClick={() => requestSort('date')}>Modificado <SortIcon col="date" sortConfig={sortConfig} /></div>
                <div className="col-span-1"></div>
            </div>
            {files.map(file => (
                <div
                    key={file.id}
                    onClick={(e) => { e.stopPropagation(); onSelect(file.id, e.ctrlKey || e.metaKey); }}
                    onDoubleClick={() => onNavigate(file)}
                    onContextMenu={(e) => onContextMenu(e, file)}
                    className={`grid grid-cols-12 gap-4 items-center px-4 py-2.5 border-b border-slate-800/50 cursor-pointer transition-colors text-sm group select-none ${selectedFileIds.includes(file.id) ? 'bg-blue-600/20' : 'hover:bg-slate-800'}`}
                >
                    <div className="col-span-6 flex items-center gap-3 overflow-hidden pointer-events-none">
                        <FileIcon type={file.type} className="w-5 h-5 flex-shrink-0" />
                        {renamingId === file.id ? (
                            <input
                                type="text"
                                autoFocus
                                value={renameName}
                                onChange={(e) => setRenameName(e.target.value)}
                                onBlur={handleRenameSave}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSave(); else if (e.key === 'Escape') handleRenameCancel(); }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full text-xs bg-slate-900 border border-blue-500 rounded px-1 py-0.5 text-white outline-none pointer-events-auto"
                            />
                        ) : (
                            <span className="truncate text-slate-300">{file.name}</span>
                        )}
                    </div>
                    <div className="col-span-2 text-slate-500 text-xs pointer-events-none">{file.size}</div>
                    <div className="col-span-3 text-slate-500 text-xs pointer-events-none">{file.date}</div>
                    <div className="col-span-1 flex justify-end opacity-0 group-hover:opacity-100">
                        <MoreVertical size={14} className="text-slate-400" onClick={(e) => onContextMenu(e, file)} />
                    </div>
                </div>
            ))}
        </div>
    );
};
