import React, { useState } from 'react';
import { HelpCircle, X, Sparkles } from 'lucide-react';

interface SearchHelpProps {
    onExampleClick?: (example: string) => void;
}

export const SearchHelp: React.FC<SearchHelpProps> = ({ onExampleClick }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleExampleClick = (example: string) => {
        if (onExampleClick) {
            onExampleClick(example);
            setIsOpen(false);
        }
    };

    const examples = [
        { query: 'iron ore ql>90', description: 'High quality iron ore', category: 'Quality' },
        { query: 'stone price<50', description: 'Cheap stone items', category: 'Price' },
        { query: 'supreme ql>95 price<100', description: 'Premium supreme items', category: 'Combined' },
        { query: 'brick qty>=1000', description: 'Bulk brick orders', category: 'Quantity' },
        { query: 'seller=jota', description: 'Items from specific seller', category: 'Seller' },
    ];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-amber-500 border border-slate-600 hover:border-amber-500/50"
                title="Search Help"
            >
                <HelpCircle className="w-4 h-4" />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/20 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Popup */}
                    <div className="absolute right-0 top-10 z-50 w-96 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl overflow-hidden animate-fade-in">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/50">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                Advanced Search Guide
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4 text-xs max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {/* Quick Examples - Clickable */}
                            <div>
                                <div className="text-slate-300 font-semibold mb-2 flex items-center gap-2">
                                    <span className="text-amber-500">✨</span>
                                    Quick Examples (Click to Try)
                                </div>
                                <div className="space-y-2">
                                    {examples.map((ex, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleExampleClick(ex.query)}
                                            className="w-full text-left bg-slate-900/50 hover:bg-slate-900 px-3 py-2 rounded border border-slate-700 hover:border-amber-500/50 transition-all group"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <code className="text-emerald-400 font-mono text-xs group-hover:text-emerald-300">
                                                    {ex.query}
                                                </code>
                                                <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                                                    {ex.category}
                                                </span>
                                            </div>
                                            <p className="text-slate-500 text-[11px]">{ex.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-slate-700" />

                            {/* Field Reference */}
                            <div>
                                <div className="text-slate-300 font-semibold mb-2">📋 Available Fields</div>
                                <div className="space-y-2">
                                    <div className="bg-slate-900/30 p-2 rounded">
                                        <div className="text-amber-400 font-mono text-xs mb-1">ql, quality, q</div>
                                        <div className="text-slate-500 text-[11px]">Item quality (0-100)</div>
                                    </div>
                                    <div className="bg-slate-900/30 p-2 rounded">
                                        <div className="text-amber-400 font-mono text-xs mb-1">price, p</div>
                                        <div className="text-slate-500 text-[11px]">Price in copper</div>
                                    </div>
                                    <div className="bg-slate-900/30 p-2 rounded">
                                        <div className="text-amber-400 font-mono text-xs mb-1">qty, quantity</div>
                                        <div className="text-slate-500 text-[11px]">Item quantity</div>
                                    </div>
                                    <div className="bg-slate-900/30 p-2 rounded">
                                        <div className="text-amber-400 font-mono text-xs mb-1">seller, s</div>
                                        <div className="text-slate-500 text-[11px]">Seller name</div>
                                    </div>
                                    <div className="bg-slate-900/30 p-2 rounded">
                                        <div className="text-amber-400 font-mono text-xs mb-1">rarity, r</div>
                                        <div className="text-slate-500 text-[11px]">Item rarity</div>
                                    </div>
                                    <div className="bg-slate-900/30 p-2 rounded">
                                        <div className="text-amber-400 font-mono text-xs mb-1">material, m</div>
                                        <div className="text-slate-500 text-[11px]">Item material</div>
                                    </div>
                                </div>
                            </div>

                            {/* Operators */}
                            <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                                <div className="text-slate-300 font-semibold mb-2">🔧 Operators</div>
                                <div className="grid grid-cols-5 gap-2 text-center">
                                    <div className="bg-slate-800 p-1.5 rounded">
                                        <code className="text-amber-400 font-bold">&gt;</code>
                                        <div className="text-[10px] text-slate-500 mt-0.5">greater</div>
                                    </div>
                                    <div className="bg-slate-800 p-1.5 rounded">
                                        <code className="text-amber-400 font-bold">&lt;</code>
                                        <div className="text-[10px] text-slate-500 mt-0.5">less</div>
                                    </div>
                                    <div className="bg-slate-800 p-1.5 rounded">
                                        <code className="text-amber-400 font-bold">=</code>
                                        <div className="text-[10px] text-slate-500 mt-0.5">equals</div>
                                    </div>
                                    <div className="bg-slate-800 p-1.5 rounded">
                                        <code className="text-amber-400 font-bold">&gt;=</code>
                                        <div className="text-[10px] text-slate-500 mt-0.5">gte</div>
                                    </div>
                                    <div className="bg-slate-800 p-1.5 rounded">
                                        <code className="text-amber-400 font-bold">&lt;=</code>
                                        <div className="text-[10px] text-slate-500 mt-0.5">lte</div>
                                    </div>
                                </div>
                            </div>

                            {/* Tips */}
                            <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded">
                                <div className="text-blue-400 font-semibold mb-1 text-xs">💡 Pro Tips</div>
                                <ul className="text-slate-400 text-[11px] space-y-1 list-disc list-inside">
                                    <li>Combine multiple filters for precise results</li>
                                    <li>Text search works on name, seller, and material</li>
                                    <li>Operators work with numeric fields (ql, price, qty)</li>
                                    <li>Use = for exact string matches</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
