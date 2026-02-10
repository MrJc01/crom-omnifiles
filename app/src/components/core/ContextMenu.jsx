import { useRef, useEffect } from 'react';
import { Folder, Upload, RefreshCw, ExternalLink, Edit2, Trash2, Info } from 'lucide-react';

export const ContextMenu = ({ x, y, target, onClose, onAction }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Position Adjustment
    const style = { top: y, left: x };
    if (x + 200 > window.innerWidth) style.left = x - 200;
    if (y + 200 > window.innerHeight) style.top = y - 200;

    if (!target) {
        return (
            <div ref={menuRef} style={style} className="fixed z-[100] w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl context-menu-anim py-1">
                <button onClick={() => onAction('new-folder')} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                    <Folder size={14} /> Nova Pasta
                </button>
                <button onClick={() => onAction('upload')} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                    <Upload size={14} /> Carregar Ficheiro
                </button>
                <div className="h-px bg-slate-700 my-1"></div>
                <button onClick={() => onAction('refresh')} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                    <RefreshCw size={14} /> Atualizar
                </button>
            </div>
        );
    }

    return (
        <div ref={menuRef} style={style} className="fixed z-[100] w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl context-menu-anim py-1">
            <button onClick={() => onAction('open', target)} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2 font-medium">
                <ExternalLink size={14} /> Abrir
            </button>
            <div className="h-px bg-slate-700 my-1"></div>
            <button onClick={() => onAction('rename', target)} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                <Edit2 size={14} /> Renomear (F2)
            </button>
            <button onClick={() => onAction('delete', target)} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 flex items-center gap-2">
                <Trash2 size={14} /> Eliminar (Del)
            </button>
            <div className="h-px bg-slate-700 my-1"></div>
            <button onClick={() => onAction('properties', target)} className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                <Info size={14} /> Propriedades
            </button>
        </div>
    );
};
