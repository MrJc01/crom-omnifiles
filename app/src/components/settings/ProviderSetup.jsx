import { useState } from 'react';
import { HardDrive, Laptop, Cloud } from 'lucide-react';

export const ProviderSetup = ({ workspaceName, onComplete }) => {
    const [selected, setSelected] = useState({ browser: true, localFs: false, cloud: false });
    const toggle = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));

    const handleFinish = () => {
        const connections = [];
        if (selected.browser) connections.push({ id: `conn-browser-${Date.now()}`, serviceId: 'browser', name: 'Navegador Local', used: '0KB', total: '500MB' });
        if (selected.localFs) connections.push({ id: `conn-local-${Date.now()}`, serviceId: 'local-fs', name: 'Meu Computador', used: 'System', total: 'Disk' });
        if (selected.cloud) connections.push({ id: `conn-cloud-${Date.now()}`, serviceId: 'google-drive', name: 'Google Drive', used: '0GB', total: '15GB' });

        if (connections.length === 0) return alert("Selecione pelo menos um local.");
        onComplete(connections);
    };

    return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 z-50 animate-in slide-in-from-right duration-500">
            <div className="max-w-5xl w-full text-center">
                <h1 className="text-4xl font-bold text-white mb-4">Conexões para "{workspaceName}"</h1>
                <p className="text-slate-400 mb-10">Onde deseja guardar ou aceder aos seus ficheiros?</p>
                <div className="grid md:grid-cols-3 gap-6 mb-12 text-left">
                    <div onClick={() => toggle('browser')} className={`cursor-pointer p-6 border rounded-2xl transition-all ${selected.browser ? 'bg-slate-900 border-emerald-500 ring-1 ring-emerald-500/50' : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800'}`}>
                        <HardDrive size={32} className={`mb-4 ${selected.browser ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <h3 className="font-bold text-white text-lg">Navegador Local</h3>
                        <p className="text-sm text-slate-400 mt-2">Guardar ficheiros temporariamente na memória deste navegador. Rápido e privado.</p>
                    </div>
                    <div onClick={() => toggle('localFs')} className={`cursor-pointer p-6 border rounded-2xl transition-all ${selected.localFs ? 'bg-slate-900 border-blue-500 ring-1 ring-blue-500/50' : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800'}`}>
                        <Laptop size={32} className={`mb-4 ${selected.localFs ? 'text-blue-400' : 'text-slate-500'}`} />
                        <h3 className="font-bold text-white text-lg">Meu Computador</h3>
                        <p className="text-sm text-slate-400 mt-2">Acesso direto às pastas do seu sistema operativo (Windows/Mac/Linux).</p>
                    </div>
                    <div onClick={() => toggle('cloud')} className={`cursor-pointer p-6 border rounded-2xl transition-all ${selected.cloud ? 'bg-slate-900 border-purple-500 ring-1 ring-purple-500/50' : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800'}`}>
                        <Cloud size={32} className={`mb-4 ${selected.cloud ? 'text-purple-400' : 'text-slate-500'}`} />
                        <h3 className="font-bold text-white text-lg">Nuvem</h3>
                        <p className="text-sm text-slate-400 mt-2">Conectar Google Drive, Dropbox ou AWS S3 para gestão remota.</p>
                    </div>
                </div>
                <button onClick={handleFinish} className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-105">Iniciar Sistema</button>
            </div>
        </div>
    );
};
