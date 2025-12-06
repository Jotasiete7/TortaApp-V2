
import { MarketItem, ChartDataPoint, PredictionResult } from '../types';

const MATERIALS = ['Iron', 'Steel', 'Seryll', 'Glimmersteel', 'Adamantite', 'Wood', 'Cotton', 'Linden', 'Oak', 'Cedar', 'Maple'];
const ITEMS = ['Longsword', 'Large Shield', 'Plate Jacket', 'Great Helm', 'Pickaxe', 'Hatchet', 'Shovel', 'Rake', 'Saw', 'Hammer', 'Nails'];
const LOCATIONS = ['Freedom Market', 'Exodus', 'Celebration', 'Chaos', 'Pristine', 'Independence', 'Deliverance', 'Xanadu'];
const SELLERS = ['TraderJo', 'SmithyBoi', 'WurmFarmer', 'CrafterX', 'MinerMike', 'LumberJack', 'BlacksmithPro', 'MerchantGuild'];

// Optimized generator for large datasets
export const generateMarketData = (count: number): MarketItem[] => {
  console.time('Data Generation');
  const data = new Array(count);
  
  for (let i = 0; i < count; i++) {
    const material = MATERIALS[i % MATERIALS.length]; 
    const itemType = ITEMS[i % ITEMS.length];
    const quality = (Math.random() * 99) + 1;
    
    // Base Price calculation (in Copper now)
    // Old: quality * 0.05 (silver)
    // New: quality * 5 (copper)
    let basePriceCopper = quality * 5; 
    
    if (material === 'Glimmersteel' || material === 'Adamantite') basePriceCopper *= 5;
    
    // Add randomness (+/- 200 copper = 2s)
    const finalPrice = Math.floor(basePriceCopper + (Math.random() * 200));

    // Randomly assign WTB/WTS
    const orderType = Math.random() > 0.3 ? 'WTS' : 'WTB';
    const name = `${quality.toFixed(1)}ql ${material} ${itemType}`;
    const seller = SELLERS[i % SELLERS.length];

    data[i] = {
      id: `item-${i}`,
      name: name,
      material,
      quality,
      rarity: Math.random() > 0.98 ? 'Rare' : 'Common',
      price: finalPrice, // COPPER
      orderType,
      seller: seller,
      location: LOCATIONS[i % LOCATIONS.length],
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split('T')[0],
      searchableText: (name + " " + seller + " " + material).toLowerCase()
    };
  }
  
  console.timeEnd('Data Generation');
  return data;
};

export const generateChartData = (): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  let currentPrice = 5000; // 50s in copper
  const today = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    const change = (Math.random() - 0.5) * 500; // change by up to 5s
    currentPrice = Math.max(1000, currentPrice + change);
    
    data.push({
      date: date.toISOString().split('T')[0].slice(5), 
      avgPrice: Math.floor(currentPrice), // Copper
      volume: Math.floor(Math.random() * 100) + 20
    });
  }
  return data;
};

export const getPrediction = async (quality: number, material: string): Promise<PredictionResult> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  let multiplier = 1;
  if (material === 'Glimmersteel') multiplier = 4;
  if (material === 'Iron') multiplier = 0.8;
  
  // Predict in Copper
  // Base 75 copper per ql * multiplier
  const predicted = (quality * 75 * multiplier);
  const zScore = (Math.random() * 2) - 1; 
  
  return {
    predictedPrice: Math.floor(predicted),
    confidence: 0.85 + (Math.random() * 0.1),
    zScore: parseFloat(zScore.toFixed(2)),
    trend: zScore > 0 ? 'up' : 'down'
  };
};
