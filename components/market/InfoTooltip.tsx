import React from 'react';
import { HelpCircle } from 'lucide-react';

export const InfoTooltip = ({ text }: { text: string }) => {
    return (
        <div className="group relative inline-flex items-center ml-1">
            <HelpCircle className="w-3 h-3 text-slate-500 hover:text-slate-300 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 border border-slate-700 rounded shadow-xl text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {text}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-700"></div>
            </div>
        </div>
    );
};
