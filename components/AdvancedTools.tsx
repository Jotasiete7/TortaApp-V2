import React, { useState } from 'react';
import { Settings, ChevronDown, FileText, Info } from 'lucide-react';
import { LogUploader } from './LogProcessor/LogUploader';

export const AdvancedTools: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden mt-8">
            {/* Header - Collapsible */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-700 rounded-lg">
                        <Settings className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-white font-bold">Advanced Data Tools</h3>
                        <p className="text-xs text-slate-400">Import historical logs and manage data</p>
                    </div>
                </div>
                <ChevronDown 
                    className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                />
            </button>

            {/* Content - Collapsible */}
            {isOpen && (
                <div className="border-t border-slate-700 p-6 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
                    {/* Info Banner */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex gap-3">
                        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="text-blue-300 font-semibold mb-1">💡 Tip for New Users</p>
                            <p className="text-slate-300">
                                Use the <span className="font-semibold text-white">Live Monitor</span> for automatic real-time data collection. 
                                Only use this tool to import old historical log files.
                            </p>
                        </div>
                    </div>

                    {/* RAW Log Processor */}
                    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <FileText className="w-5 h-5 text-amber-500" />
                            <h4 className="text-white font-bold">Import Historical Logs</h4>
                        </div>
                        <p className="text-sm text-slate-400 mb-4">
                            Upload raw Wurm Online log files (.txt) to import historical trade data.
                        </p>
                        <LogUploader 
                            onProcessingComplete={(records) => {
                                console.log("Historic logs processed:", records.length);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
