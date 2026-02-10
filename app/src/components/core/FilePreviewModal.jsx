import { X } from 'lucide-react';

export const FilePreviewModal = ({ file, onClose }) => {
    if (!file) return null;
    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-slate-900 w-[95%] md:w-full max-w-5xl h-[85vh] md:h-[80vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="h-14 border-b border-slate-700 flex items-center justify-between px-4 bg-slate-900 shrink-0">
                    <span className="font-medium text-slate-200 truncate pr-4">{file.name}</span>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-white" /></button>
                </div>
                <div className="flex-1 bg-slate-800/50 relative overflow-hidden">
                    {file.type === 'image' ? (
                        <div className="w-full h-full flex items-center justify-center p-4">
                            <img src={file.content || `https://placehold.co/600x400/1e293b/white?text=${file.name}`} className="max-h-full max-w-full object-contain" />
                        </div>
                    ) : (
                        <div className="w-full h-full overflow-auto p-4 custom-scrollbar">
                            <pre className="text-slate-300 text-sm font-mono whitespace-pre-wrap break-words">{file.content || "Sem pré-visualização"}</pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
