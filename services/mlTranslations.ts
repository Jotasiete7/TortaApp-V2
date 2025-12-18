import { useState } from 'react';

type Language = 'en' | 'pt';

interface Translations {
    [key: string]: {
        en: string;
        pt: string;
    };
}

export const mlTranslations: Translations = {
    // Header
    'ml_title': { en: 'Price Predictor Engine', pt: 'Motor de PrevisÃ£o de PreÃ§os' },
    'ml_subtitle': { en: 'Advanced statistical inference based on', pt: 'InferÃªncia estatÃ­stica avanÃ§ada baseada em' },
    'records': { en: 'records', pt: 'registros' },

    // Help & Guide
    'user_guide': { en: 'User Guide', pt: 'Guia do UsuÃ¡rio' },
    'help': { en: 'Help', pt: 'Ajuda' },

    // Inputs
    'prediction_context': { en: 'Prediction Context', pt: 'Contexto da PrevisÃ£o' },
    'item_name': { en: 'Item Name', pt: 'Nome do Item' },
    'item_placeholder': { en: 'e.g., Stone Brick', pt: 'ex: Tijolo de Pedra' },
    'material_type': { en: 'Material / Type', pt: 'Material / Tipo' },
    'any_material': { en: 'Any Material', pt: 'Qualquer Material' },
    'target_quality': { en: 'Target Quality (QL)', pt: 'Qualidade Alvo (QL)' },
    'calculate_button': { en: 'Calculate Fair Price', pt: 'Calcular PreÃ§o Justo' },

    // Bulk
    'bulk_quantity': { en: 'Bulk Quantity / Batch Size', pt: 'Quantidade em Lote / Tamanho do Lote' },
    'sizes_found': { en: 'sizes found', pt: 'tamanhos encontrados' },
    'no_bulk_trades': { en: 'No bulk trades found', pt: 'Nenhum lote encontrado' },
    'single': { en: 'Single', pt: 'Ãšnico' },
    'best_value': { en: 'Best Value', pt: 'Melhor Valor' },

    // Results
    'ready_to_predict': { en: 'Ready to Predict', pt: 'Pronto para Prever' },
    'ready_subtitle': { en: 'Select an item to analyze historical trends and calculate a fair market value.', pt: 'Selecione um item para analisar tendÃªncias histÃ³ricas e calcular um valor justo de mercado.' },
    'crunching_numbers': { en: 'Crunching numbers...', pt: 'Processando nÃºmeros...' },
    'analyzing': { en: 'Analyzing', pt: 'Analisando' },
    'removing_outliers': { en: 'Removing outliers', pt: 'Removendo outliers' },
    'calculating_quartiles': { en: 'Calculating quartiles', pt: 'Calculando quartis' },

    // Main result
    'fair_market_value': { en: 'Fair Market Value', pt: 'Valor Justo de Mercado' },
    'unit': { en: 'Unit', pt: 'Unidade' },
    'batch': { en: 'Batch', pt: 'Lote' },
    'based_on': { en: 'Based on', pt: 'Baseado em' },
    'trades': { en: 'trades', pt: 'negociaÃ§Ãµes' },
    'outliers_removed': { en: 'outliers removed', pt: 'outliers removidos' },

    // Metrics
    'confidence': { en: 'Confidence', pt: 'ConfianÃ§a' },
    'volatility': { en: 'Volatility', pt: 'Volatilidade' },
    'buy_zone': { en: 'Buy Zone', pt: 'Zona de Compra' },
    'sell_zone': { en: 'Sell Zone', pt: 'Zona de Venda' },

    // Chart
    'price_distribution': { en: 'Price Distribution', pt: 'DistribuiÃ§Ã£o de PreÃ§os' },

    // Table
    'analysis_source': { en: 'Analysis Source Data (Top 20)', pt: 'Dados de Origem da AnÃ¡lise (Top 20)' },
    'item': { en: 'Item', pt: 'Item' },
    'qty': { en: 'Qty', pt: 'Qtd' },
    'unit_price': { en: 'Unit Price', pt: 'PreÃ§o UnitÃ¡rio' },
    'bulk_1k': { en: 'Bulk (1k)', pt: 'Lote (1k)' },
    'seller': { en: 'Seller', pt: 'Vendedor' },

    // Errors
    'no_trades_found': { en: 'No trades found for', pt: 'Nenhuma negociaÃ§Ã£o encontrada para' },
    'with_material': { en: 'with material', pt: 'com material' },

    // Tooltips
    'tooltip_confidence': { en: 'How reliable this prediction is based on data quality and volume', pt: 'QuÃ£o confiÃ¡vel Ã© esta previsÃ£o baseada na qualidade e volume dos dados' },
    'tooltip_volatility': { en: 'Standard deviation of prices - higher means more price fluctuation', pt: 'Desvio padrÃ£o dos preÃ§os - maior significa mais flutuaÃ§Ã£o de preÃ§o' },
    'tooltip_buy_zone': { en: 'Prices below 25th percentile (P25) - good buying opportunities', pt: 'PreÃ§os abaixo do percentil 25 (P25) - boas oportunidades de compra' },
    'tooltip_sell_zone': { en: 'Prices above 75th percentile (P75) - good selling opportunities', pt: 'PreÃ§os acima do percentil 75 (P75) - boas oportunidades de venda' },
    'tooltip_fair_price': { en: 'Median price after removing statistical outliers - most reliable estimate', pt: 'PreÃ§o mediano apÃ³s remover outliers estatÃ­sticos - estimativa mais confiÃ¡vel' },
    'tooltip_outliers': { en: 'Extreme prices removed from calculation to improve accuracy', pt: 'PreÃ§os extremos removidos do cÃ¡lculo para melhorar precisÃ£o' }
};

export const useMLTranslation = () => {
    const [language, setLanguage] = useState<Language>('pt'); // Default PT

    const t = (key: string): string => {
        const entry = mlTranslations[key];
        if (!entry) return key;
        return entry[language] || entry['en'];
    };

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'pt' : 'en');
    };

    return { t, language, setLanguage, toggleLanguage };
};
