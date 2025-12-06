
import React, { useState, useRef } from 'react';
import { Trash2, Plus, Upload, Download, Search, RefreshCw } from 'lucide-react';
import { formatWurmPrice, parsePriceCSV } from '../../services/priceUtils';
import { DEFAULT_PRICES_CSV } from '../../services/defaultPrices';

interface PriceManagerProps {
    prices: Record<string, number>;
    onUpdatePrices: (newPrices: Record<string, number>) => void;
}

export const PriceManager: React.FC<PriceManagerProps> = ({ prices, onUpdatePrices }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const priceList = Object.entries(prices)
        .map(([name, price]) => ({ name, price }))
        .sort((a, b) => a.name.localeCompare(b.name));

    const filteredList = priceList.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddPrice = () => {
        if (!newItemName || !newItemPrice) return;
        const priceVal = parseFloat(newItemPrice);
        if (isNaN(priceVal)) return;

        const updated = { ...prices, [newItemName.toLowerCase().trim()]: priceVal };
        onUpdatePrices(updated);

        setNewItemName('');
        setNewItemPrice('');
    };

    const handleDelete = (name: string) => {
        if (window.confirm(`Delete reference price for "${name}"?`)) {
            const updated = { ...prices };
            delete updated[name];
            onUpdatePrices(updated);
        }
    };

    const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            // Use the shared robust parser
            const newPrices = parsePriceCSV(text);

            // Merge or Replace? Let's Merge.
            const merged = { ...prices, ...newPrices };
            onUpdatePrices(merged);
            alert(`Imported ${Object.keys(newPrices).length} prices successfully.`);
        };
        reader.readAsText(file);
    };

    const handleResetDefaults = () => {
        if (window.confirm("This will overwrite your current price list with the system defaults. Continue?")) {
            const defaults = parsePriceCSV(DEFAULT_PRICES_CSV);
            onUpdatePrices(defaults);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span className="text-3xl">💰</span> Price Manager
                    </h2>
                    <p className="text-slate-400">Manage reference prices to evaluate fair trades.</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleCSVImport}
                        accept=".csv"
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm font-medium transition-colors"
                    >
                        <Upload className="w-4 h-4" /> Import CSV
                    </button>
                    <button
                        onClick={() => {
                            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(prices, null, 2));
                            const downloadAnchorNode = document.createElement('a');
                            downloadAnchorNode.setAttribute("href", dataStr);
                            downloadAnchorNode.setAttribute("download", "prices.json");
                            document.body.appendChild(downloadAnchorNode); // required for firefox
                            downloadAnchorNode.click();
                            downloadAnchorNode.remove();
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm font-medium transition-colors"
                    >
                        <Download className="w-4 h-4" /> Export JSON
                    </button>
                    <button
                        onClick={handleResetDefaults}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm font-medium transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" /> Reset Defaults
                    </button>
                </div>
            </div>

            {/* Editor Control */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Add / Update Price</h3>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-2 w-full">
                        <label className="text-sm text-slate-400">Item Name</label>
                        <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="e.g., Iron Lump"
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                        />
                    </div>
                    <div className="w-full md:w-48 space-y-2">
                        <label className="text-sm text-slate-400">Price (Copper)</label>
                        <input
                            type="number"
                            value={newItemPrice}
                            onChange={(e) => setNewItemPrice(e.target.value)}
                            placeholder="0"
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                        />
                    </div>
                    <button
                        onClick={handleAddPrice}
                        disabled={!newItemName || !newItemPrice}
                        className="w-full md:w-auto px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-5 h-5" /> Save Price
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-350px)]">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search stored prices..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:outline-none"
                        />
                    </div>
                    <div className="text-sm text-slate-500">
                        {filteredList.length} items stored
                    </div>
                </div>

                <div className="overflow-auto custom-scrollbar flex-1">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-slate-900 z-10 shadow-sm text-xs uppercase text-slate-400">
                            <tr>
                                <th className="p-4 font-semibold">Item Name</th>
                                <th className="p-4 font-semibold">Reference Price</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50 text-sm">
                            {filteredList.length > 0 ? (
                                filteredList.map((item) => (
                                    <tr key={item.name} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4 font-medium text-slate-200 capitalize">{item.name}</td>
                                        <td className="p-4 font-mono text-emerald-400">
                                            {formatWurmPrice(item.price as number)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDelete(item.name)}
                                                className="p-2 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="p-12 text-center text-slate-500">
                                        No prices found. Import a CSV or click Reset Defaults.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
