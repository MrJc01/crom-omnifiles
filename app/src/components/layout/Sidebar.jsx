import React from 'react';
import { Settings, Plus, Home, Clock } from 'lucide-react';
import { SERVICE_CATALOG } from '../../constants/services';

export const Sidebar = ({
    workspaces,
    activeWorkspaceObj,
    activeWorkspaceId,
    onSwitchWorkspace,
    onCreateWorkspace,
    onShowSettings,
    currentPath,
    onNavigateDrive,
    isOpen,
    onGoHome,
    onGoRecent
}) => {
    const activeConnections = activeWorkspaceObj?.connections || [];

    return (
        <aside className={`${isOpen ? 'w-[260px] border-r' : 'w-0 border-none'} flex flex-col border-slate-800 bg-slate-900/50 backdrop-blur-sm relative transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden`}>
            <div className="w-[260px] flex flex-col h-full">
                <div className="p-4 border-b border-slate-800">
                    <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Workspace</label>
                    <div className="relative group">
                        <button className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 p-2 rounded-lg border border-slate-700 transition-all">
                            <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded ${activeWorkspaceObj?.color || 'bg-blue-600'} flex items-center justify-center text-xs font-bold uppercase text-white`}>
                                    {activeWorkspaceObj?.name?.[0]}
                                </div>
                                <span className="text-sm font-medium truncate w-32 text-left">{activeWorkspaceObj?.name}</span>
                            </div>
                            <Settings size={14} className="text-slate-400 hover:text-white cursor-pointer" onClick={(e) => { e.stopPropagation(); onShowSettings(true); }} />
                        </button>
                        <div className="hidden group-hover:block absolute top-full left-0 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                            {workspaces.map(ws => (
                                <div key={ws.id} onClick={() => onSwitchWorkspace(ws.id)} className={`p-2 text-sm hover:bg-slate-700 cursor-pointer flex items-center gap-2 ${activeWorkspaceId === ws.id ? 'text-white bg-slate-700' : 'text-slate-400'}`}>
                                    <div className={`w-2 h-2 rounded-full ${ws.color || 'bg-slate-500'}`}></div>
                                    {ws.name}
                                </div>
                            ))}
                            <div onClick={onCreateWorkspace} className="border-t border-slate-700 p-2 text-xs text-blue-400 hover:bg-slate-700 cursor-pointer flex items-center gap-2">
                                <Plus size={12} /> Novo Workspace
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto py-4 scrollbar-hide px-3">
                    <div className="mb-6">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">Favoritos</h3>
                        <nav className="space-y-0.5">
                            <div onClick={onGoHome} className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                                <Home size={18} /><span className="text-sm">Início</span>
                            </div>
                            <div onClick={onGoRecent} className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                                <Clock size={18} /><span className="text-sm">Recentes</span>
                            </div>
                        </nav>
                    </div>
                    <div>
                        <div className="flex items-center justify-between px-2 mb-2 group">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conexões</h3>
                            <Settings size={14} className="text-slate-500 hover:text-blue-400 cursor-pointer" onClick={() => onShowSettings(true)} />
                        </div>
                        <div className="space-y-2">
                            {activeConnections.length === 0 && <div className="text-xs text-slate-500 px-2 italic">Nenhuma conexão.</div>}
                            {activeConnections.map(conn => {
                                const isActive = currentPath.length > 0 && currentPath[0].id === conn.id;
                                const serviceInfo = SERVICE_CATALOG.find(s => s.id === conn.serviceId) || SERVICE_CATALOG[0];
                                return (
                                    <div key={conn.id} onClick={() => onNavigateDrive(conn)} className={`group p-2 rounded-lg cursor-pointer border transition-all ${isActive ? 'bg-slate-800 border-slate-700' : 'border-transparent hover:bg-slate-800/50 hover:border-slate-700/50'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <serviceInfo.icon size={16} className={serviceInfo.color} />
                                            <span className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>{conn.name}</span>
                                        </div>
                                        {conn.used && <div className="w-full bg-slate-900 h-1 rounded-full mt-1 overflow-hidden"><div className={`h-full ${serviceInfo.color.replace('text-', 'bg-')} w-1/3 rounded-full`} /></div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};
