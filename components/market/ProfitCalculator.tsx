import React, { useState, useEffect } from 'react';
import { Calculator, ArrowRight, Coins } from 'lucide-react';
import { formatWurmPrice } from '../../services/priceUtils';

interface ProfitCalculatorProps {
    fairPrice: number;
    buyPrice?: number;
}

export const ProfitCalculator: React.FC<ProfitCalculatorProps> = ({ fairPrice, buyPrice = 0 }) => {
    const [buyAt, setBuyAt] = useState(buyPrice || fairPrice * 0.8);
    const [sellAt, setSellAt] = useState(fairPrice);
    const [quantity, setQuantity] = useState(100);

    useEffect(() => {
        if (buyPrice) setBuyAt(buyPrice);
        setSellAt(fairPrice);
    }, [fairPrice, buyPrice]);

    const totalCost = buyAt * quantity;
    const totalRevenue = sellAt * quantity;
    const profit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Profit Simulator</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="text-xs text-slate-400 uppercase font-bold">Buy Price (Unit)</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={buyAt}
                            onChange={(e) => setBuyAt(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono focus:ring-2 focus:ring-emerald-500/50 outline-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                            {formatWurmPrice(buyAt)}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs text-slate-400 uppercase font-bold">Sell Price (Unit)</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={sellAt}
                            onChange={(e) => setSellAt(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono focus:ring-2 focus:ring-purple-500/50 outline-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                            {formatWurmPrice(sellAt)}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs text-slate-400 uppercase font-bold">Quantity</label>
                    <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono focus:ring-2 focus:ring-blue-500/50 outline-none"
                    />
                </div>
            </div>

            <div className="bg-slate-900 rounded-lg p-4 flex items-center justify-between border border-slate-800">
                <div className="text-center">
                    <div className="text-xs text-slate-500 mb-1">Total Cost</div>
                    <div className="font-mono text-slate-300">{formatWurmPrice(totalCost)}</div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-600" />
                <div className="text-center">
                    <div className="text-xs text-slate-500 mb-1">Total Revenue</div>
                    <div className="font-mono text-slate-300">{formatWurmPrice(totalRevenue)}</div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-600" />
                <div className="text-center">
                    <div className="text-xs text-slate-500 mb-1">Net Profit</div>
                    <div className={`font-mono font-bold text-lg ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {profit >= 0 ? '+' : ''}{formatWurmPrice(profit)}
                    </div>
                    <div className={`text-[10px] ${profit >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                        {margin.toFixed(1)}% Margin
                    </div>
                </div>
            </div>
        </div>
    );
};
