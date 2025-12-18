// utils/linkRenderer.tsx
// Helper para transformar URLs em links clicÃ¡veis

import React from 'react';

/**
 * Renderiza texto transformando URLs em links clicÃ¡veis
 * @param text - Texto que pode conter URLs
 * @returns Array de elementos React (text + links)
 */
export const renderMessageWithLinks = (text: string): React.ReactNode[] => {
    // Regex para detectar URLs (http/https)
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    // Dividir texto em partes (texto normal e URLs)
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
        // Se a parte Ã© uma URL
        if (part.match(urlRegex)) {
            return (
                <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline transition-colors"
                    onClick={(e) => e.stopPropagation()}
                >
                    {part}
                </a>
            );
        }

        // Se Ã© texto normal
        return <span key={index}>{part}</span>;
    });
};

/**
 * VersÃ£o simplificada que retorna apenas string com classe
 * Ãštil para preview ou cases onde React nodes nÃ£o sÃ£o aceitos
 */
export const hasLinks = (text: string): boolean => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return urlRegex.test(text);
};

/**
 * Sanitiza URL para garantir seguranÃ§a
 * Remove protocolos perigosos
 */
export const sanitizeUrl = (url: string): string => {
    const dangerous = ['javascript:', 'data:', 'file:', 'vbscript:'];
    const lower = url.toLowerCase();

    for (const protocol of dangerous) {
        if (lower.startsWith(protocol)) {
            return '#';
        }
    }

    return url;
};
