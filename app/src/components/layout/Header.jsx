import { ArrowLeft, ArrowRight, Search, Plus, LayoutGrid, List as ListIcon, Menu, PanelLeft } from 'lucide-react';
import { Breadcrumb } from '../core/Breadcrumb';

export const Header = ({
    currentPath,
    onNavigateBreadcrumb,
    onBack,
    onForward,
    historyIndex,
    historyLength,
    searchQuery,
    setSearchQuery,
    onCreateFolder,
    viewMode,
    setViewMode,
    onToggleSidebar,
    isSidebarOpen
}) => {
    return (
        <header className="h-14 border-b border-slate-800 flex items-center px-4 justify-between bg-slate-900/95 backdrop-blur z-10 gap-4">
            <div className="flex items-center gap-1 text-slate-400 mr-2 flex-shrink-0">
                <button
                    onClick={onToggleSidebar}
                    className={`p-1.5 hover:bg-slate-800 rounded-md mr-2 text-slate-400 hover:text-white transition-colors ${!isSidebarOpen ? 'text-blue-500' : ''}`}
                    title={isSidebarOpen ? "Fechar Menu" : "Abrir Menu"}
                >
                    <PanelLeft size={18} />
                </button>
                <div className="h-4 w-[1px] bg-slate-800 mx-1"></div>
                <button onClick={onBack} disabled={historyIndex <= 0} className="p-1.5 hover:bg-slate-800 rounded-md disabled:opacity-30"><ArrowLeft size={18} /></button>
                <button onClick={onForward} disabled={historyIndex >= historyLength - 1} className="p-1.5 hover:bg-slate-800 rounded-md disabled:opacity-30"><ArrowRight size={18} /></button>
            </div>

            <Breadcrumb path={currentPath} onNavigate={onNavigateBreadcrumb} />

            <div className="relative mx-2 hidden md:block">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Pesquisar..."
                    className="bg-slate-800 border-slate-700 border text-sm rounded-md pl-9 pr-4 py-1.5 w-64 focus:border-blue-500 outline-none text-slate-200"
                />
            </div>

            <div className="flex items-center gap-2 border-l border-slate-800 pl-4 flex-shrink-0">
                <button onClick={onCreateFolder} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded shadow-sm">
                    <Plus size={14} /> Novo
                </button>
                <div className="flex bg-slate-800 rounded-md p-1 border border-slate-700">
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}><LayoutGrid size={16} /></button>
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}><ListIcon size={16} /></button>
                </div>
            </div>
        </header>
    );
};
