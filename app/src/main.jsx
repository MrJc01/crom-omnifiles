import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ModalProvider } from './context/ModalContext';
import { Toaster } from 'react-hot-toast';
import './styles/index.css'

// Debug Scripts (Only in Dev or if requested)
import './debug/debug';
import './debug/runner';
import './debug/mock-data';
import './debug/tests/test-fs';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ModalProvider>
            <Toaster position="bottom-right" toastOptions={{
                style: {
                    background: '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid #334155',
                },
            }} />
            <App />
        </ModalProvider>
    </React.StrictMode>,
)
