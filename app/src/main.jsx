import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ModalProvider } from './context/ModalContext';
import { Toaster } from 'react-hot-toast';
import './styles/index.css'
import './i18n';

// Debug Scripts — only in dev mode
if (import.meta.env.DEV) {
    import('./debug/debug');
    import('./debug/runner');
    import('./debug/mock-data');
    import('./debug/tests/test-fs');
}

import ErrorBoundary from './components/core/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <ModalProvider>
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        className: '!bg-slate-800 !text-slate-200 !border !border-slate-700 !shadow-lg',
                        success: {
                            iconTheme: {
                                primary: '#3b82f6',
                                secondary: '#1e293b',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#1e293b',
                            },
                        },
                    }}
                />
                <App />
            </ModalProvider>
        </ErrorBoundary>
    </React.StrictMode>,
)
