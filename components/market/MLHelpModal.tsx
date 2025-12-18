import React, { useState } from 'react';
import { X, BookOpen, Lightbulb, TrendingUp, AlertTriangle, Award } from 'lucide-react';

interface MLHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MLHelpModal: React.FC<MLHelpModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('intro');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-purple-900/20 to-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <BookOpen className="w-7 h-7 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">ML Predictor - Manual do Usuário</h2>
                            <p className="text-sm text-slate-400">Aprenda a usar a ferramenta de previsão de preços</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-1/4 border-r border-slate-800 bg-slate-900/50 overflow-y-auto">
                        {[
                            { id: 'intro', label: 'O que é?', icon: <BookOpen className="w-4 h-4" /> },
                            { id: 'howto', label: 'Como Usar', icon: <Lightbulb className="w-4 h-4" /> },
                            { id: 'metrics', label: 'Métricas', icon: <TrendingUp className="w-4 h-4" /> },
                            { id: 'strategies', label: 'Estratégias', icon: <Award className="w-4 h-4" /> },
                            { id: 'warnings', label: 'Avisos', icon: <AlertTriangle className="w-4 h-4" /> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full p-4 flex items-center gap-3 transition-all ${activeTab === tab.id
                                        ? 'bg-purple-500/10 border-l-4 border-purple-500 text-white'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l-4 border-transparent'
                                    }`}
                            >
                                <span className={activeTab === tab.id ? 'text-purple-400' : 'text-slate-500'}>
                                    {tab.icon}
                                </span>
                                <span className="font-medium text-sm">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-8 overflow-y-auto bg-slate-900">
                        {activeTab === 'intro' && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold text-purple-400">🎯 O que é o ML Predictor?</h3>
                                <p className="text-slate-300 leading-relaxed">
                                    O <strong>ML Predictor</strong> (Price Predictor Engine PRO) é uma ferramenta avançada de análise estatística
                                    que calcula o <strong>valor justo de mercado</strong> de itens do Wurm Online baseado em dados históricos reais de negociações.
                                </p>

                                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                                    <h4 className="text-lg font-semibold text-white mb-3">Para que serve?</h4>
                                    <ul className="space-y-2 text-slate-300">
                                        <li>🎯 <strong>Descobrir o preço justo</strong> de qualquer item</li>
                                        <li>💰 <strong>Identificar oportunidades de compra</strong> (preços abaixo do mercado)</li>
                                        <li>🎯 <strong>Identificar oportunidades de venda</strong> (preços acima do mercado)</li>
                                        <li>🎯 <strong>Analisar a volatilidade</strong> do mercado</li>
                                        <li>🎯 <strong>Tomar decisões informadas</strong> ao invés de adivinhar preços</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {activeTab === 'howto' && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold text-purple-400">🎯 Como Usar (Passo a Passo)</h3>

                                <div className="space-y-4">
                                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                                        <h4 className="text-lg font-semibold text-emerald-400 mb-2">1. Digite o Nome do Item</h4>
                                        <p className="text-slate-300">
                                            No campo "Item Name", digite o item que deseja analisar.
                                            Exemplos: "Stone Brick", "Iron Lump", "Plank".
                                            O sistema tem autocomplete - comece a digitar e veja sugestões.
                                        </p>
                                    </div>

                                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                                        <h4 className="text-lg font-semibold text-emerald-400 mb-2">2. Selecione o Material (Opcional)</h4>
                                        <p className="text-slate-300">
                                            Se quiser filtrar por material específico (Iron, Wood, etc.), selecione no dropdown.
                                            Deixe como "Any Material" para ver todos os materiais.
                                        </p>
                                    </div>

                                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                                        <h4 className="text-lg font-semibold text-emerald-400 mb-2">3. Ajuste a Qualidade (QL)</h4>
                                        <p className="text-slate-300">
                                            Use o slider para definir a qualidade alvo (1-100).
                                            Isso é apenas referencial, não afeta o cálculo.
                                        </p>
                                    </div>

                                    <div className="bg-slate-800/50 rounded-xl p-5 border border-purple-700">
                                        <h4 className="text-lg font-semibold text-purple-400 mb-2">4. Clique em "Calculate Fair Price"</h4>
                                        <p className="text-slate-300 mb-2">O sistema vai:</p>
                                        <ul className="space-y-1 text-slate-300 text-sm">
                                            <li>âœ… Buscar todas as negociações do item</li>
                                            <li>âœ… Remover outliers (preços extremos)</li>
                                            <li>âœ… Calcular estatísticas (mediana, quartis)</li>
                                            <li>âœ… Apresentar o valor justo</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'metrics' && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold text-purple-400">🎯 Entendendo as Métricas</h3>

                                <div className="space-y-4">
                                    <div className="bg-gradient-to-r from-purple-900/30 to-slate-800/50 rounded-xl p-5 border border-purple-700/50">
                                        <h4 className="text-xl font-semibold text-purple-300 mb-2">🎯 Fair Market Value</h4>
                                        <p className="text-slate-300">
                                            O número grande no centro é o preço mais confiável.
                                            Calculado usando a <strong>mediana</strong> (não a média).
                                            Outliers são removidos automaticamente. Baseado em negociações reais.
                                        </p>
                                    </div>

                                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                                        <h4 className="text-lg font-semibold text-emerald-400 mb-2">🎯 Confidence (Confiança)</h4>
                                        <p className="text-slate-300 mb-2">Quão confiável é a previsão (0-100%):</p>
                                        <ul className="space-y-1 text-sm text-slate-300">
                                            <li>🎯 <strong>&gt;70%</strong>: Alta confiança - pode confiar no preço</li>
                                            <li>🛡️strong>50-70%</strong>: Confiança moderada - use com cautela</li>
                                            <li>🎯 <strong>&lt;50%</strong>: Baixa confiança - poucos dados ou muito volátil</li>
                                        </ul>
                                    </div>

                                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                                        <h4 className="text-lg font-semibold text-blue-400 mb-2">🎯 Volatility (Volatilidade)</h4>
                                        <p className="text-slate-300">
                                            Desvio padrão dos preços. Alta volatilidade = preços variam muito = mercado arriscado.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-700/50">
                                            <h4 className="text-md font-semibold text-emerald-400 mb-1">🎯 Buy Zone (&lt;P25)</h4>
                                            <p className="text-xs text-slate-300">
                                                Preços abaixo do percentil 25. Boa oportunidade de compra!
                                            </p>
                                        </div>
                                        <div className="bg-rose-900/20 rounded-xl p-4 border border-rose-700/50">
                                            <h4 className="text-md font-semibold text-rose-400 mb-1">🎯 Sell Zone (&gt;P75)</h4>
                                            <p className="text-xs text-slate-300">
                                                Preços acima do percentil 75. Boa oportunidade de venda!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'strategies' && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold text-purple-400">🛡️stratégias de Trading</h3>

                                <div className="space-y-4">
                                    <div className="bg-slate-800/50 rounded-xl p-5 border border-emerald-700/50">
                                        <h4 className="text-lg font-semibold text-emerald-400 mb-2">🎯 Estratégia 1: Compra e Revenda Rápida</h4>
                                        <ol className="space-y-2 text-slate-300 text-sm list-decimal list-inside">
                                            <li>Procure itens com <strong>alta confiança</strong> (&gt;70%)</li>
                                            <li>Compre abaixo do <strong>Buy Zone</strong> (&lt;P25)</li>
                                            <li>Revenda pelo <strong>Fair Market Value</strong></li>
                                            <li>Lucro garantido: diferença entre P25 e mediana</li>
                                        </ol>
                                        <div className="mt-3 p-3 bg-slate-900/50 rounded border border-slate-700">
                                            <p className="text-xs text-slate-400 mb-1">Exemplo:</p>
                                            <p className="text-xs text-slate-300">
                                                Fair Value: 67s • Buy Zone: &lt;45s<br />
                                                Você compra por 40s â†’ Revende por 67s = <strong className="text-emerald-400">27s de lucro</strong>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-800/50 rounded-xl p-5 border border-amber-700/50">
                                        <h4 className="text-lg font-semibold text-amber-400 mb-2">💰 Estratégia 2: Arbitragem de Bulk</h4>
                                        <ol className="space-y-2 text-slate-300 text-sm list-decimal list-inside">
                                            <li>Use o <strong>Bulk Selector</strong> (aparece se houver lotes)</li>
                                            <li>Compare preço unitário de lotes vs. singles</li>
                                            <li>Compre o lote com <strong>melhor valor</strong> (indicado com 🛡️/li>
                                            <li>Revenda em singles se o multiplicador for favorável</li>
                                        </ol>
                                        <div className="mt-3 p-3 bg-slate-900/50 rounded border border-slate-700">
                                            <p className="text-xs text-slate-400 mb-1">Exemplo:</p>
                                            <p className="text-xs text-slate-300">
                                                Single: 10s/unidade • Bulk 50x: 8s/unidade (🎯br />
                                                Compre bulk, revenda singles = <strong className="text-amber-400">2s de lucro por unidade</strong>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'warnings' && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold text-rose-400">âš ï¸ Limitações e Avisos</h3>

                                <div className="bg-rose-900/20 rounded-xl p-5 border border-rose-700/50">
                                    <h4 className="text-lg font-semibold text-rose-400 mb-3">O que o ML Predictor NÃƒO faz:</h4>
                                    <ul className="space-y-2 text-slate-300 text-sm">
                                        <li>âŒ Não prevê eventos futuros (updates do jogo, etc.)</li>
                                        <li>âŒ Não garante que você vai encontrar itens naquele preço</li>
                                        <li>âŒ Não considera sazonalidade ou tendências de longo prazo</li>
                                        <li>âŒ Não analisa oferta/demanda em tempo real</li>
                                    </ul>
                                </div>

                                <div className="bg-amber-900/20 rounded-xl p-5 border border-amber-700/50">
                                    <h4 className="text-lg font-semibold text-amber-400 mb-3">Quando NÃƒO confiar:</h4>
                                    <ul className="space-y-2 text-slate-300 text-sm">
                                        <li>🎯 Confidence &lt; 50%</li>
                                        <li>🎯 Menos de 10 negociações encontradas</li>
                                        <li>🎯 Muitos outliers removidos (&gt;30%)</li>
                                        <li>🎯 Volatilidade muito alta</li>
                                    </ul>
                                </div>

                                <div className="bg-emerald-900/20 rounded-xl p-5 border border-emerald-700/50">
                                    <h4 className="text-lg font-semibold text-emerald-400 mb-3">âœ… Boas Práticas:</h4>
                                    <ul className="space-y-2 text-slate-300 text-sm">
                                        <li>âœ… Use com itens que têm muitas negociações</li>
                                        <li>âœ… Compare com Trade Master para validar</li>
                                        <li>âœ… Considere o contexto do mercado (eventos, updates)</li>
                                        <li>âœ… Use como ferramenta de apoio, não como verdade absoluta</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center">
                    <p className="text-xs text-slate-500">
                        🛡️ica: Use o ML Predictor junto com o Charts Engine para análises completas!
                    </p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Entendi!
                    </button>
                </div>
            </div>
        </div>
    );
};
