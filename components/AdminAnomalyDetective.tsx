import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { AlertTriangle, Trash2, Search, CheckCircle, RefreshCw } from 'lucide-react';

interface AnomalyLog {
    log_id: number;
    seller_name: string;
    buyer_name: string;
    item_name: string;
    price_gold: number;
    quantity: number;
    created_at: string;
    anomaly_type: string;
    anomaly_score: number;
}

export const AdminAnomalyDetective: React.FC = () => {
    const [anomalies, setAnomalies] = useState<AnomalyLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const scanAnomalies = async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('admin_detect_anomalies');
        if (error) {
            console.error('Error scanning anomalies:', error);
            alert(`Scan failed: ${error.message}`);
        } else {
            setAnomalies(data || []);
            setSelectedIds([]); // Reset selection
        }
        setLoading(false);
    };

    const handleClean = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Permanently delete ${selectedIds.length} flagged records? This cannot be undone.`)) return;

        setLoading(true);
        const { data, error } = await supabase.rpc('admin_clean_anomalies', {
            target_log_ids: selectedIds
        });

        if (error) {
            alert(`Cleanup failed: ${error.message}`);
        } else {
            alert(`Success! Deleted ${data.deleted_count} records.`);
            scanAnomalies(); // Refresh
        }
        setLoading(false);
    };

    const toggleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(x => x !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === anomalies.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(anomalies.map(a => a.log_id));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-800 p-6 rounded-xl border border-slate-700">
                <div className="flex items-center gap-4">
                    <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                        <AlertTriangle className="w-8 h-8 text-rose-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            Anomaly Detective
                            <span className="text-xs font-normal px-2 py-0.5 bg-rose-500 text-white rounded-full">BETA</span>
                        </h3>
                        <p className="text-slate-400">Scan database for corrupted, suspicious, or invalid trade logs.</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={scanAnomalies}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium border border-slate-600"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Scanning...' : 'Scan Database'}
                    </button>

                    {anomalies.length > 0 && (
                        <button
                            onClick={handleClean}
                            disabled={loading || selectedIds.length === 0}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium border ${selectedIds.length > 0
                                    ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500'
                                    : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                                }`}
                        >
                            <Trash2 className="w-4 h-4" />
                            Clean Selected ({selectedIds.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden min-h-[400px]">
                {loading && anomalies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 text-slate-500 gap-4">
                        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
                        <p>Scanning database sectors...</p>
                    </div>
                ) : anomalies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 text-slate-500 gap-4">
                        <CheckCircle className="w-12 h-12 text-emerald-500/20" />
                        <div className="text-center">
                            <p className="text-lg font-medium text-emerald-400">No Anomalies Detected</p>
                            <p className="text-sm">Your database appears to be clean.</p>
                        </div>
                        <button onClick={scanAnomalies} className="text-amber-500 hover:underline text-sm mt-2">Run Scan</button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-900/50 uppercase text-xs font-bold tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 w-12 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === anomalies.length && anomalies.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500"
                                        />
                                    </th>
                                    <th className="px-6 py-4">Issue Type</th>
                                    <th className="px-6 py-4">Item Details</th>
                                    <th className="px-6 py-4">Value</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {anomalies.map((log) => (
                                    <tr key={log.log_id} className="hover:bg-slate-700/30 transition-colors bg-rose-500/5">
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(log.log_id)}
                                                onChange={() => toggleSelect(log.log_id)}
                                                className="rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                {log.anomaly_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{log.item_name}</div>
                                            <div className="text-xs">
                                                {log.seller_name} <span className="text-slate-600">to</span> {log.buyer_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-amber-400 font-mono">{log.price_gold.toLocaleString()}g</div>
                                            <div className="text-xs opacity-70">x{log.quantity}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {new Date(log.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs opacity-50">
                                            {log.log_id}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
