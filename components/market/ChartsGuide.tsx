import React, { useState } from 'react';
import { X, BookOpen, Activity, Zap, Brain, Search, TrendingUp, HelpCircle } from 'lucide-react';
import { useChartsTranslation } from '../../services/chartsTranslations';

interface ChartsGuideProps {
    isOpen: boolean;
    onClose: () => void;
    lang: 'en' | 'pt';
}

export const ChartsGuide: React.FC<ChartsGuideProps> = ({ isOpen, onClose, lang }) => {
    const [activeTab, setActiveTab] = useState('basics');

    if (!isOpen) return null;

    const content = {
        basics: {
            title: lang === 'en' ? 'Getting Started' : 'Primeiros Passos',
            icon: <Search className="w-5 h-5" />,
            items: [
                {
                    title: lang === 'en' ? 'Smart Search' : 'Busca Inteligente',
                    desc: lang === 'en'
                        ? 'Type any part of an item name. Our fuzzy search will find it even if you make typo.'
                        : 'Digite qualquer parte do nome. Nossa busca inteligente encontra mesmo com erros de digitação.'
                },
                {
                    title: lang === 'en' ? 'Chart Types' : 'Tipos de Gráfico',
                    desc: lang === 'en'
                        ? 'Toggle between Line Chart (trends), Candlestick (price action), and Heatmap (supply density).'
                        : 'Alterne entre Linha (tendências), Candlestick (ação de preço) e Mapa de Calor (densidade de supply).'
                }
            ]
        },
        volatility: {
            title: lang === 'en' ? 'Volatility Analysis' : 'Análise de Volatilidade',
            icon: <Activity className="w-5 h-5" />,
            items: [
                {
                    title: lang === 'en' ? 'Volatility Score (0-100)' : 'Score de Volatilidade (0-100)',
                    desc: lang === 'en'
                        ? 'Lower scores (0-30) mean stable prices. Higher scores (70+) mean high risk/reward.'
                        : 'Scores baixos (0-30) indicam preços estáveis. Altos (70+) indicam alto risco/recompensa.'
                },
                {
                    title: lang === 'en' ? 'Trading Strategy' : 'Estratégia de Trading',
                    desc: lang === 'en'
                        ? 'Buy low volatility items for stability. Trade high volatility items for quick profits.'
                        : 'Compre itens estáveis para segurança. Negocie itens voláteis para lucros rápidos.'
                }
            ]
        },
        forecast: {
            title: lang === 'en' ? 'Price Forecasting' : 'Previsão de Preços',
            icon: <Brain className="w-5 h-5" />,
            items: [
                {
                    title: lang === 'en' ? '7-Day Prediction' : 'Previsão de 7 Dias',
                    desc: lang === 'en'
                        ? 'We use linear regression on last 30 days data to project future trends.'
                        : 'Usamos regressão linear nos dados dos últimos 30 dias para projetar tendências futuras.'
                },
                {
                    title: lang === 'en' ? 'Confidence Score' : 'Score de Confiança',
                    desc: lang === 'en'
                        ? 'Only trust predictions with >70% confidence. Low confidence means the market is unpredictable.'
                        : 'Confie apenas em previsões com >70% de confiança. Confiança baixa significa mercado imprevisível.'
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
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {lang === 'en' ? 'Charts Engine Guide' : 'Guia do Charts Engine'}
                            </h2>
                            <p className="text-sm text-slate-400">
                                {lang === 'en' ? 'Master the market tools' : 'Domine as ferramentas de mercado'}
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
                                        ? 'bg-amber-500/10 border-l-4 border-amber-500 text-white'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l-4 border-transparent'
                                    }`}
                            >
                                <span className={activeTab === key ? 'text-amber-500' : 'text-slate-500'}>
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
                                <span className="p-2 rounded-lg bg-amber-500/20 text-amber-500">
                                    {(content as any)[activeTab].icon}
                                </span>
                                <h3 className="text-2xl font-bold text-white">
                                    {(content as any)[activeTab].title}
                                </h3>
                            </div>

                            <div className="space-y-6">
                                {(content as any)[activeTab].items.map((item: any, idx: number) => (
                                    <div key={idx} className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                                        <h4 className="text-lg font-semibold text-amber-400 mb-2">
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
                        className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
                    >
                        {lang === 'en' ? 'Got it!' : 'Entendi!'}
                    </button>
                </div>
            </div>
        </div>
    );
};
