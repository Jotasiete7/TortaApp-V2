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
                            <h2 className="text-2xl font-bold text-white">ML Predictor - Manual do UsuÃ¡rio</h2>
                            <p className="text-sm text-slate-400">Aprenda a usar a ferramenta de previsÃ£o de preÃ§os</p>
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
                            { id: 'intro', label: 'O que Ã©?', icon: <BookOpen className="w-4 h-4" /> },
                            { id: 'howto', label: 'Como Usar', icon: <Lightbulb className="w-4 h-4" /> },
                            { id: 'metrics', label: 'MÃ©tricas', icon: <TrendingUp className="w-4 h-4" /> },
                            { id: 'strategies', label: 'EstratÃ©gias', icon: <Award className="w-4 h-4" /> },
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
                                <h3 className="text-2xl font-bold text-purple-400">ðŸŽ¯ O que Ã© o ML Predictor?</h3>
                                <p className="text-slate-300 leading-relaxed">
                                    O <strong>ML Predictor</strong> (Price Predictor Engine PRO) Ã© uma ferramenta avanÃ§ada de anÃ¡lise estatÃ­stica
                                    que calcula o <strong>valor justo de mercado</strong> de itens do Wurm Online baseado em dados histÃ³ricos reais de negociaÃ§Ãµes.
                                </p>

                                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                                    <h4 className="text-lg font-semibold text-white mb-3">Para que serve?</h4>
                                    <ul className="space-y-2 text-slate-300">
                                        <li>ðŸ” <strong>Descobrir o preÃ§o justo</strong> de qualquer item</li>
                                        <li>ðŸ’° <strong>Identificar oportunidades de compra</strong> (preÃ§os abaixo do mercado)</li>
                                        <li>ðŸ“ˆ <strong>Identificar oportunidades de venda</strong> (preÃ§os acima do mercado)</li>
                                        <li>ðŸ“Š <strong>Analisar a volatilidade</strong> do mercado</li>
                                        <li>ðŸŽ¯ <strong>Tomar decisÃµes informadas</strong> ao invÃ©s de adivinhar preÃ§os</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {activeTab === 'howto' && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold text-purple-400">ðŸš€ Como Usar (Passo a Passo)</h3>

                                <div className="space-y-4">
                                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                                        <h4 className="text-lg font-semibold text-emerald-400 mb-2">1. Digite o Nome do Item</h4>
                                        <p className="text-slate-300">
                                            No campo "Item Name", digite o item que deseja analisar.
                                            Exemplos: "Stone Brick", "Iron Lump", "Plank".
                                            O sistema tem autocomplete - comece a digitar e veja sugestÃµes.
                                        </p>
                                    </div>

                                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                                        <h4 className="text-lg font-semibold text-emerald-400 mb-2">2. Selecione o Material (Opcional)</h4>
                                        <p className="text-slate-300">
                                            Se quiser filtrar por material especÃ­fico (Iron, Wood, etc.), selecione no dropdown.
                                            Deixe como "Any Material" para ver todos os materiais.
                                        </p>
                                    </div>

                                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                                        <h4 className="text-lg font-semibold text-emerald-400 mb-2">3. Ajuste a Qualidade (QL)</h4>
                                        <p className="text-slate-300">
                                            Use o slider para definir a qualidade alvo (1-100).
                                            Isso Ã© apenas referencial, nÃ£o afeta o cÃ¡lculo.
                                        </p>
                                    </div>

                                    <div className="bg-slate-800/50 rounded-xl p-5 border border-purple-700">
                                        <h4 className="text-lg font-semibold text-purple-400 mb-2">4. Clique em "Calculate Fair Price"</h4>
                                        <p className="text-slate-300 mb-2">O sistema vai:</p>
                                        <ul className="space-y-1 text-slate-300 text-sm">
                                            <li>âœ… Buscar todas as negociaÃ§Ãµes do item</li>
                                            <li>âœ… Remover outliers (preÃ§os extremos)</li>
                                            <li>âœ… Calcular estatÃ­sticas (mediana, quartis)</li>
                                            <li>âœ… Apresentar o valor justo</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'metrics' && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold text-purple-400">ðŸ“Š Entendendo as MÃ©tricas</h3>

                                <div className="space-y-4">
                                    <div className="bg-gradient-to-r from-purple-900/30 to-slate-800/50 rounded-xl p-5 border border-purple-700/50">
                                        <h4 className="text-xl font-semibold text-purple-300 mb-2">ðŸ’Ž Fair Market Value</h4>
                                        <p className="text-slate-300">
                                            O nÃºmero grande no centro Ã© o preÃ§o mais confiÃ¡vel.
                                            Calculado usando a <strong>mediana</strong> (nÃ£o a mÃ©dia).
                                            Outliers sÃ£o removidos automaticamente. Baseado em negociaÃ§Ãµes reais.
                                        </p>
                                    </div>

                                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                                        <h4 className="text-lg font-semibold text-emerald-400 mb-2">ðŸŽ¯ Confidence (ConfianÃ§a)</h4>
                                        <p className="text-slate-300 mb-2">QuÃ£o confiÃ¡vel Ã© a previsÃ£o (0-100%):</p>
                                        <ul className="space-y-1 text-sm text-slate-300">
                                            <li>ðŸŸ¢ <strong>&gt;70%</strong>: Alta confianÃ§a - pode confiar no preÃ§o</li>
                                            <li>ðŸŸ¡ <strong>50-70%</strong>: ConfianÃ§a moderada - use com cautela</li>
                                            <li>ðŸ”´ <strong>&lt;50%</strong>: Baixa confianÃ§a - poucos dados ou muito volÃ¡til</li>
                                        </ul>
                                    </div>

                                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                                        <h4 className="text-lg font-semibold text-blue-400 mb-2">ðŸ“Š Volatility (Volatilidade)</h4>
                                        <p className="text-slate-300">
                                            Desvio padrÃ£o dos preÃ§os. Alta volatilidade = preÃ§os variam muito = mercado arriscado.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-700/50">
                                            <h4 className="text-md font-semibold text-emerald-400 mb-1">ðŸŸ¢ Buy Zone (&lt;P25)</h4>
                                            <p className="text-xs text-slate-300">
                                                PreÃ§os abaixo do percentil 25. Boa oportunidade de compra!
                                            </p>
                                        </div>
                                        <div className="bg-rose-900/20 rounded-xl p-4 border border-rose-700/50">
                                            <h4 className="text-md font-semibold text-rose-400 mb-1">ðŸ”´ Sell Zone (&gt;P75)</h4>
                                            <p className="text-xs text-slate-300">
                                                PreÃ§os acima do percentil 75. Boa oportunidade de venda!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'strategies' && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold text-purple-400">ðŸ’¡ EstratÃ©gias de Trading</h3>

                                <div className="space-y-4">
                                    <div className="bg-slate-800/50 rounded-xl p-5 border border-emerald-700/50">
                                        <h4 className="text-lg font-semibold text-emerald-400 mb-2">ðŸ“ˆ EstratÃ©gia 1: Compra e Revenda RÃ¡pida</h4>
                                        <ol className="space-y-2 text-slate-300 text-sm list-decimal list-inside">
                                            <li>Procure itens com <strong>alta confianÃ§a</strong> (&gt;70%)</li>
                                            <li>Compre abaixo do <strong>Buy Zone</strong> (&lt;P25)</li>
                                            <li>Revenda pelo <strong>Fair Market Value</strong></li>
                                            <li>Lucro garantido: diferenÃ§a entre P25 e mediana</li>
                                        </ol>
                                        <div className="mt-3 p-3 bg-slate-900/50 rounded border border-slate-700">
                                            <p className="text-xs text-slate-400 mb-1">Exemplo:</p>
                                            <p className="text-xs text-slate-300">
                                                Fair Value: 67s â€¢ Buy Zone: &lt;45s<br />
                                                VocÃª compra por 40s â†’ Revende por 67s = <strong className="text-emerald-400">27s de lucro</strong>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-800/50 rounded-xl p-5 border border-amber-700/50">
                                        <h4 className="text-lg font-semibold text-amber-400 mb-2">ðŸ’° EstratÃ©gia 2: Arbitragem de Bulk</h4>
                                        <ol className="space-y-2 text-slate-300 text-sm list-decimal list-inside">
                                            <li>Use o <strong>Bulk Selector</strong> (aparece se houver lotes)</li>
                                            <li>Compare preÃ§o unitÃ¡rio de lotes vs. singles</li>
                                            <li>Compre o lote com <strong>melhor valor</strong> (indicado com ðŸŸ¡)</li>
                                            <li>Revenda em singles se o multiplicador for favorÃ¡vel</li>
                                        </ol>
                                        <div className="mt-3 p-3 bg-slate-900/50 rounded border border-slate-700">
                                            <p className="text-xs text-slate-400 mb-1">Exemplo:</p>
                                            <p className="text-xs text-slate-300">
                                                Single: 10s/unidade â€¢ Bulk 50x: 8s/unidade (ðŸ’¸)<br />
                                                Compre bulk, revenda singles = <strong className="text-amber-400">2s de lucro por unidade</strong>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'warnings' && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold text-rose-400">âš ï¸ LimitaÃ§Ãµes e Avisos</h3>

                                <div className="bg-rose-900/20 rounded-xl p-5 border border-rose-700/50">
                                    <h4 className="text-lg font-semibold text-rose-400 mb-3">O que o ML Predictor NÃƒO faz:</h4>
                                    <ul className="space-y-2 text-slate-300 text-sm">
                                        <li>âŒ NÃ£o prevÃª eventos futuros (updates do jogo, etc.)</li>
                                        <li>âŒ NÃ£o garante que vocÃª vai encontrar itens naquele preÃ§o</li>
                                        <li>âŒ NÃ£o considera sazonalidade ou tendÃªncias de longo prazo</li>
                                        <li>âŒ NÃ£o analisa oferta/demanda em tempo real</li>
                                    </ul>
                                </div>

                                <div className="bg-amber-900/20 rounded-xl p-5 border border-amber-700/50">
                                    <h4 className="text-lg font-semibold text-amber-400 mb-3">Quando NÃƒO confiar:</h4>
                                    <ul className="space-y-2 text-slate-300 text-sm">
                                        <li>ðŸ”´ Confidence &lt; 50%</li>
                                        <li>ðŸ”´ Menos de 10 negociaÃ§Ãµes encontradas</li>
                                        <li>ðŸ”´ Muitos outliers removidos (&gt;30%)</li>
                                        <li>ðŸ”´ Volatilidade muito alta</li>
                                    </ul>
                                </div>

                                <div className="bg-emerald-900/20 rounded-xl p-5 border border-emerald-700/50">
                                    <h4 className="text-lg font-semibold text-emerald-400 mb-3">âœ… Boas PrÃ¡ticas:</h4>
                                    <ul className="space-y-2 text-slate-300 text-sm">
                                        <li>âœ… Use com itens que tÃªm muitas negociaÃ§Ãµes</li>
                                        <li>âœ… Compare com Trade Master para validar</li>
                                        <li>âœ… Considere o contexto do mercado (eventos, updates)</li>
                                        <li>âœ… Use como ferramenta de apoio, nÃ£o como verdade absoluta</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center">
                    <p className="text-xs text-slate-500">
                        ðŸ’¡ Dica: Use o ML Predictor junto com o Charts Engine para anÃ¡lises completas!
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
