import React, { useState, useRef } from 'react';
import { Upload, Database, CheckCircle, XCircle, AlertCircle, Loader2, FileText } from 'lucide-react';
import { submitBulkNDJSON } from '../../services/logProcessing/supabaseIngestor';

export const BulkDataUploader: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [result, setResult] = useState<{
        success: number;
        duplicates: number;
        errors: number;
        totalLines: number;
    } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (selectedFile: File) => {
        if (!selectedFile.name.endsWith('.txt')) {
            alert('Por favor, selecione um arquivo .txt');
            return;
        }
        setFile(selectedFile);
        setResult(null);
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setProgress({ current: 0, total: 0 });
        setResult(null);

        try {
            const fileContent = await file.text();

            const uploadResult = await submitBulkNDJSON(
                fileContent,
                (current, total) => {
                    setProgress({ current, total });
                }
            );

            setResult(uploadResult);
        } catch (error) {
            console.error('Erro no upload:', error);
            alert('Erro ao fazer upload. Verifique o console para detalhes.');
        } finally {
            setUploading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) handleFileChange(droppedFile);
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                    <Database className="w-6 h-6 text-amber-500" />
                    <h2 className="text-xl font-bold text-white">Upload em Massa (Admin)</h2>
                </div>
                <p className="text-slate-400 text-sm">
                    Faça upload de arquivos NDJSON pré-limpos (CLEAN2025) diretamente para o banco de dados.
                    Os dados serão persistidos permanentemente no Supabase.
                </p>
            </div>

            {/* File Selection */}
            <div
                className={`
                    border-2 border-dashed rounded-xl p-8 text-center transition-all
                    ${isDragging
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt"
                    onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                    className="hidden"
                />

                {!file ? (
                    <div className="space-y-4">
                        <Upload className="w-12 h-12 text-slate-500 mx-auto" />
                        <div>
                            <p className="text-white font-medium mb-1">
                                Arraste o arquivo CLEAN2025 aqui
                            </p>
                            <p className="text-slate-400 text-sm">ou</p>
                        </div>
                        <button
                            onClick={triggerFileInput}
                            className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium rounded-lg transition-colors"
                        >
                            Selecionar Arquivo
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <FileText className="w-12 h-12 text-amber-500 mx-auto" />
                        <div>
                            <p className="text-white font-medium">{file.name}</p>
                            <p className="text-slate-400 text-sm">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                        <button
                            onClick={triggerFileInput}
                            className="text-amber-500 hover:text-amber-400 text-sm transition-colors"
                        >
                            Trocar arquivo
                        </button>
                    </div>
                )}
            </div>

            {/* Upload Button */}
            {file && !uploading && !result && (
                <button
                    onClick={handleUpload}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <Database className="w-5 h-5" />
                    Upload para Banco de Dados
                </button>
            )}

            {/* Progress */}
            {uploading && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                        <span className="text-white font-medium">Fazendo upload...</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-slate-400">
                            <span>Progresso</span>
                            <span>{progress.current.toLocaleString()} / {progress.total.toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-500 transition-all duration-300"
                                style={{
                                    width: progress.total > 0
                                        ? `${(progress.current / progress.total) * 100}%`
                                        : '0%'
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                        <h3 className="text-lg font-bold text-white">Upload Concluído!</h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                            <p className="text-slate-400 text-xs uppercase mb-1">Total de Linhas</p>
                            <p className="text-2xl font-bold text-white">{result.totalLines.toLocaleString()}</p>
                        </div>
                        <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/30">
                            <p className="text-emerald-400 text-xs uppercase mb-1">Sucesso</p>
                            <p className="text-2xl font-bold text-emerald-400">{result.success.toLocaleString()}</p>
                        </div>
                        <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/30">
                            <p className="text-amber-400 text-xs uppercase mb-1">Duplicados</p>
                            <p className="text-2xl font-bold text-amber-400">{result.duplicates.toLocaleString()}</p>
                        </div>
                        <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
                            <p className="text-red-400 text-xs uppercase mb-1">Erros</p>
                            <p className="text-2xl font-bold text-red-400">{result.errors.toLocaleString()}</p>
                        </div>
                    </div>

                    {result.errors > 0 && (
                        <div className="flex items-start gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="text-red-400 font-medium">Alguns registros falharam</p>
                                <p className="text-red-300/80">
                                    Verifique o console do navegador para detalhes dos erros.
                                </p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => {
                            setFile(null);
                            setResult(null);
                        }}
                        className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                        Fazer Novo Upload
                    </button>
                </div>
            )}
        </div>
    );
};
