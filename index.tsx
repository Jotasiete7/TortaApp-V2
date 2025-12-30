import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { TradeEventProvider } from './contexts/TradeEventContext';
import './i18n';

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <AuthProvider>
            <TradeEventProvider>
                <App />
            </TradeEventProvider>
        </AuthProvider>
    </React.StrictMode>
);
