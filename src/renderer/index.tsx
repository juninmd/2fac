import '@juninmd/sonido/styles.css';
import './sonido-bridge.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ToastProvider } from '@juninmd/sonido';
import App from './components/App';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
    <React.StrictMode>
        <ToastProvider>
            <App />
        </ToastProvider>
    </React.StrictMode>
);
