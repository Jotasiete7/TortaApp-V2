import React, { useState } from 'react';
import { X, BookOpen, Calculator, TrendingUp, Layers, HelpCircle } from 'lucide-react';

interface MLGuideProps {
    isOpen: boolean;
    onClose: () => void;
    lang: 'en' | 'pt';
}

export const MLGuide: React.FC<MLGuideProps> = ({ isOpen, onClose, lang }) => {
    const [activeTab, setActiveTab] = useState('basics');

    if (!isOpen) return null;

    const content = {
        basics: {
            title: lang === 'en' ? 'How to Use' : 'Como Usar',
            icon: <Calculator className="w-5 h-5" />,
            items: [
                {
                    title: lang === 'en' ? '1. Enter Item Name' : '1. Digite o Nome do Item',
                    desc: lang === 'en'
                        ? 'Type the item you want to analyze (e.g., "Stone Brick"). The system will search through all trade history.'
                        : 'Digite o item que deseja analisar (ex: "Tijolo de Pedra"). O sistema vai buscar em todo o histórico de negociações.'
                },
                {
                    title: lang === 'en' ? '2. Select Material (Optional)' : '2. Selecione o Material (Opcional)',
                    desc: lang === 'en'
                        ? 'Filter by specific material type (Iron, Wood, etc.) or leave as "Any" for all materials.'
                        : 'Filtre por tipo de material específico (Ferro, Madeira, etc.) ou deixe como "Qualquer" para todos os materiais.'
                },
                {
                    title: lang === 'en' ? '3. Click Calculate' : '3. Clique em Calcular',
                    desc: lang === 'en'
                        ? 'The system will analyze all matching trades, remove outliers, and calculate the fair market value.'
                        : 'O sistema vai analisar todas as negociações correspondentes, remover outliers e calcular o valor justo de mercado.'
                }
            ]
        },
        metrics: {
            title: lang === 'en' ? 'Understanding Metrics' : 'Entendendo as Métricas',
            icon: <TrendingUp className="w-5 h-5" />,
            items: [
                {
                    title: lang === 'en' ? 'Fair Market Value' : 'Valor Justo de Mercado',
                    desc: lang === 'en'
                        ? 'The median price after removing statistical outliers. This is the most reliable price estimate based on actual trades.'
                        : 'O preço mediano após remover outliers estatísticos. Esta é a estimativa de preço mais confiável baseada em negociações reais.'
                },
                {
                    title: lang === 'en' ? 'Confidence Score' : 'Score de Confiança',
                    desc: lang === 'en'
                        ? 'How reliable the prediction is (0-100%). Higher confidence means more data and less volatility. >70% is good.'
                        : 'Quão confiável é a previsão (0-100%). Maior confiança significa mais dados e menos volatilidade. >70% é bom.'
                },
                {
                    title: lang === 'en' ? 'Volatility' : 'Volatilidade',
                    desc: lang === 'en'
                        ? 'Standard deviation of prices. High volatility means prices fluctuate a lot - riskier but potentially more profitable.'
                        : 'Desvio padrão dos preços. Alta volatilidade significa que os preços flutuam muito - mais arriscado mas potencialmente mais lucrativo.'
                }
            ]
        },
        zones: {
            title: lang === 'en' ? 'Buy/Sell Zones' : 'Zonas de Compra/Venda',
            icon: <TrendingUp className="w-5 h-5" />,
            items: [
                {
                    title: lang === 'en' ? '🟢 Buy Zone (<P25)' : '🟢 Zona de Compra (<P25)',
                    desc: lang === 'en'
                        ? 'Prices below the 25th percentile. These are below-average prices - good opportunities to buy and resell at fair value.'
                        : 'Preços abaixo do percentil 25. São preços abaixo da média - boas oportunidades para comprar e revender pelo valor justo.'
                },
                {
                    title: lang === 'en' ? '💰 Fair Value (P25-P75)' : '💰 Valor Justo (P25-P75)',
                    desc: lang === 'en'
                        ? 'Prices in the middle 50% range. This is the normal trading range where most transactions happen.'
                        : 'Preços na faixa intermediária de 50%. Esta é a faixa normal de negociação onde a maioria das transações acontece.'
                },
                {
                    title: lang === 'en' ? '🔴 Sell Zone (>P75)' : '🔴 Zona de Venda (>P75)',
                    desc: lang === 'en'
                        ? 'Prices above the 75th percentile. These are above-average prices - good opportunities to sell if you have stock.'
                        : 'Preços acima do percentil 75. São preços acima da média - boas oportunidades para vender se você tiver estoque.'
                }
            ]
        },
        bulk: {
            title: lang === 'en' ? 'Bulk Analysis' : 'Análise de Lote',
            icon: <Layers className="w-5 h-5" />,
            items: [
                {
                    title: lang === 'en' ? 'What are Bulks?' : 'O que são Lotes?',
                    desc: lang === 'en'
                        ? 'Bulks are items sold in batches (e.g., 10x, 50x, 100x). Often they have different unit prices than single items.'
                        : 'Lotes são itens vendidos em pacotes (ex: 10x, 50x, 100x). Frequentemente têm preços unitários diferentes de itens únicos.'
                },
                {
                    title: lang === 'en' ? 'Best Value Indicator' : 'Indicador de Melhor Valor',
                    desc: lang === 'en'
                        ? 'The bulk size with a golden dot (🟡) has the lowest unit price - best value for money when buying in quantity.'
                        : 'O tamanho de lote com ponto dourado (🟡) tem o menor preço unitário - melhor custo-benefício ao comprar em quantidade.'
                },
                {
                    title: lang === 'en' ? 'Multiplier Icons' : 'Ícones de Multiplicador',
                    desc: lang === 'en'
                        ? '💸 = Cheaper than single | ✓ = Similar price | ⚠️ = More expensive than single'
                        : '💸 = Mais barato que único | ✓ = Preço similar | ⚠️ = Mais caro que único'
                }
            ]
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {lang === 'en' ? 'ML Predictor Guide' : 'Guia do ML Predictor'}
                            </h2>
                            <p className="text-sm text-slate-400">
                                {lang === 'en' ? 'Learn how to use the price predictor' : 'Aprenda a usar o preditor de preços'}
                            </p>
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
                    {/* Sidebar Tabs */}
                    <div className="w-1/3 border-r border-slate-800 bg-slate-900/50 overflow-y-auto">
                        {Object.entries(content).map(([key, section]) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`w-full p-4 flex items-center gap-3 transition-all ${activeTab === key
                                        ? 'bg-purple-500/10 border-l-4 border-purple-500 text-white'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l-4 border-transparent'
                                    }`}
                            >
                                <span className={activeTab === key ? 'text-purple-500' : 'text-slate-500'}>
                                    {section.icon}
                                </span>
                                <span className="font-medium text-sm">{section.title}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-8 overflow-y-auto bg-slate-900">
                        <div className="space-y-8">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="p-2 rounded-lg bg-purple-500/20 text-purple-500">
                                    {(content as any)[activeTab].icon}
                                </span>
                                <h3 className="text-2xl font-bold text-white">
                                    {(content as any)[activeTab].title}
                                </h3>
                            </div>

                            <div className="space-y-6">
                                {(content as any)[activeTab].items.map((item: any, idx: number) => (
                                    <div key={idx} className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                                        <h4 className="text-lg font-semibold text-purple-400 mb-2">
                                            {item.title}
                                        </h4>
                                        <p className="text-slate-300 leading-relaxed">
                                            {item.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4" />
                        <span>{lang === 'en' ? 'Need more help? Ask in Discord.' : 'Precisa de ajuda? Pergunte no Discord.'}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                    >
                        {lang === 'en' ? 'Got it!' : 'Entendi!'}
                    </button>
                </div>
            </div>
        </div>
    );
};
