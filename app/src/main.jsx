import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

// Debug Scripts (Only in Dev or if requested)
import './debug/debug';
import './debug/runner';
import './debug/mock-data';
import './debug/tests/test-fs';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
