import React from 'react';
import { X } from 'lucide-react';

export interface ActiveFilter {
    type: 'text' | 'quality' | 'price' | 'quantity' | 'seller' | 'rarity' | 'material';
    operator?: '>' | '<' | '=' | '>=' | '<=';
    value: string | number;
    displayName?: string;
}

interface ActiveFiltersProps {
    filters: ActiveFilter[];
    onRemove: (filter: ActiveFilter) => void;
    onClearAll?: () => void;
}

export const ActiveFilters: React.FC<ActiveFiltersProps> = ({ filters, onRemove, onClearAll }) => {
    if (filters.length === 0) return null;

    const getFilterLabel = (filter: ActiveFilter): string => {
        if (filter.type === 'text') {
            return `"${filter.value}"`;
        }

        const fieldName = filter.displayName || filter.type;
        const operator = filter.operator || '=';
        return `${fieldName} ${operator} ${filter.value}`;
    };

    const getFilterColor = (filter: ActiveFilter): string => {
        switch (filter.type) {
            case 'quality':
                return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
            case 'price':
                return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            case 'quantity':
                return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            case 'seller':
                return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            case 'rarity':
                return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
            case 'material':
                return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
            case 'text':
            default:
                return 'bg-slate-600/20 text-slate-300 border-slate-600/30';
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-900/30 rounded-lg border border-slate-700/50">
            <span className="text-xs text-slate-500 font-medium">Active Filters:</span>

            {filters.map((filter, index) => (
                <div
                    key={index}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all hover:brightness-110 ${getFilterColor(filter)}`}
                >
                    <span className="font-mono">{getFilterLabel(filter)}</span>
                    <button
                        onClick={() => onRemove(filter)}
                        className="hover:bg-black/20 rounded-full p-0.5 transition-colors"
                        title="Remove filter"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            ))}

            {filters.length > 1 && onClearAll && (
                <button
                    onClick={onClearAll}
                    className="ml-2 px-2 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded border border-rose-500/30 transition-colors"
                >
                    Clear All
                </button>
            )}
        </div>
    );
};
