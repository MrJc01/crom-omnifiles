import { useState } from 'react';
import { Plug, X } from 'lucide-react';
import { SERVICE_CATALOG } from '../../constants/services';

export const AddServiceModal = ({ onClose, onAdd }) => {
    const [step, setStep] = useState(1);
    const [selectedService, setSelectedService] = useState(null);
    const [customName, setCustomName] = useState('');

    const handleSelect = (service) => { setSelectedService(service); setCustomName(service.name); setStep(2); };
    const handleConfirm = () => { onAdd(selectedService, customName); onClose(); };

    return (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                    <h3 className="font-bold text-white flex items-center gap-2"><Plug size={18} className="text-blue-400" /> Adicionar Nova Conexão</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-white" /></button>
                </div>
                <div className="p-6">
                    {step === 1 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {SERVICE_CATALOG.map(service => (
                                <button key={service.id} onClick={() => handleSelect(service)} className="flex flex-col items-start p-4 rounded-xl border border-slate-700 bg-slate-800/30 hover:bg-slate-800 hover:border-blue-500/50 transition-all text-left group">
                                    <div className={`p-2 rounded-lg bg-slate-900 mb-3 ${service.color}`}><service.icon size={24} /></div>
                                    <div className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">{service.name}</div>
                                    <div className="text-xs text-slate-500 mt-1">{service.desc}</div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-blue-900/10 border border-blue-500/20 rounded-xl">
                                <div className={`p-3 rounded-lg bg-slate-900 ${selectedService.color}`}><selectedService.icon size={32} /></div>
                                <div><h4 className="font-bold text-white text-lg">{selectedService.name}</h4><p className="text-sm text-slate-400">Configurar credenciais e acesso</p></div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nome de Exibição</label>
                                <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button onClick={() => setStep(1)} className="px-4 py-2 text-slate-400 hover:text-white">Voltar</button>
                                <button onClick={handleConfirm} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium shadow-lg shadow-blue-500/20">Conectar Serviço</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
