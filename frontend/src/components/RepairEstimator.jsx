import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowRight, Calculator, Check, Home, Grid3X3, Wrench, DollarSign, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

// ─── REHAB COST LEVELS ───────────────────────────────────────────────────────
const REHAB_LEVELS = [
  { id: 'light',  label: 'Light',    min: 15, max: 30,  color: '#22c55e', desc: 'Cosmetic updates' },
  { id: 'medium', label: 'Medium',   min: 35, max: 50,  color: '#eab308', desc: 'Windows, A/C' },
  { id: 'heavy',  label: 'Heavy',    min: 60, max: 100, color: '#f97316', desc: 'Major systems' },
  { id: 'ultra',  label: 'Ultra',    min: 100, max: 150, color: '#ef4444', desc: 'Gut rehab' },
];

// ─── REPAIR ITEMS ────────────────────────────────────────────────────────────
const REPAIR_CATEGORIES = [
  {
    name: 'Exterior',
    icon: Home,
    items: [
      { id: 'landscape',    label: 'Clean Landscape',    cost: 2000 },
      { id: 'window',       label: 'Windows (per unit)', cost: 300,  qty: true },
      { id: 'garageDoor',   label: 'New Garage Door',    cost: 1000 },
    ]
  },
  {
    name: 'Interior',
    icon: Grid3X3,
    items: [
      { id: 'kitchenFull',   label: 'Kitchen Full',     cost: 10000 },
      { id: 'kitchenLight',  label: 'Kitchen Light',    cost: 5000 },
      { id: 'bathFull',      label: 'Full Bathroom',    cost: 4000, qty: true },
      { id: 'bathHalf',      label: 'Half Bathroom',    cost: 2000, qty: true },
      { id: 'flooring',      label: 'Flooring',         cost: 5000 },
      { id: 'tile',          label: 'Tile Work',        cost: 3500 },
      { id: 'interiorPaint', label: 'Interior Paint',   cost: 3500 },
      { id: 'exteriorPaint', label: 'Exterior Paint',   cost: 3500 },
      { id: 'doorsTrim',     label: 'Doors & Trim',     cost: 3000 },
    ]
  },
  {
    name: 'Mechanicals',
    icon: Wrench,
    items: [
      { id: 'hvac',         label: 'HVAC System',      cost: 5000 },
      { id: 'roofRanch',    label: 'Roof (Ranch)',     cost: 6000 },
      { id: 'roofTwoStory', label: 'Roof (Two-Story)', cost: 7500 },
      { id: 'lighting',     label: 'All Lighting',     cost: 1500 },
      { id: 'hotWater',     label: 'Hot Water Tank',   cost: 1000 },
    ]
  },
  {
    name: 'Other',
    icon: DollarSign,
    items: [
      { id: 'demo',     label: 'Cosmetic Demo',  cost: 1500 },
      { id: 'cleaning', label: 'Cleaning',       cost: 350 },
    ]
  },
];

const SQFT_RANGES = [
  { label: 'Under 1,500 sqft', light: 18750, avg: 37500, heavy: 70000 },
  { label: '1,500–2,500 sqft', light: 25000, avg: 50000, heavy: 90000 },
  { label: '2,500–3,500 sqft', light: 37500, avg: 62500, heavy: 125000 },
];

const fmt = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);
const formatInput = (val) => {
  if (!val) return '';
  const parts = String(val).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

// Glass Card Component
function GlassCard({ children, className = '', glow = false, isDark }) {
  return (
    <div className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${className}`}>
      {glow && isDark && (
        <div className="absolute -inset-px bg-gradient-to-b from-[#FF7A1A]/20 to-transparent rounded-2xl pointer-events-none" />
      )}
      <div className={`relative h-full ${isDark ? 'bg-[#1A1D24]/80 backdrop-blur-xl border border-[#2A2F3A]' : 'bg-white border border-gray-200 shadow-xl shadow-gray-200/50'} rounded-2xl`}>
        {children}
      </div>
    </div>
  );
}

export default function RepairEstimator({ onSyncToCalculator, isDark }) {
  const [sqft, setSqft] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedItems, setSelectedItems] = useState({});
  const [itemQuantities, setItemQuantities] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({ Exterior: true, Interior: true });

  const sqftValue = parseFloat(sqft?.replace(/,/g, '')) || 0;
  const quickEstimate = selectedLevel ? {
    min: sqftValue * selectedLevel.min,
    max: sqftValue * selectedLevel.max,
    avg: sqftValue * ((selectedLevel.min + selectedLevel.max) / 2)
  } : null;

  const advancedTotal = Object.entries(selectedItems).reduce((total, [id, isSelected]) => {
    if (!isSelected) return total;
    const item = REPAIR_CATEGORIES.flatMap(c => c.items).find(i => i.id === id);
    if (!item) return total;
    const qty = item.qty ? (parseInt(itemQuantities[id]) || 1) : 1;
    return total + (item.cost * qty);
  }, 0);

  const selectedItemCount = Object.values(selectedItems).filter(Boolean).length;
  const suggestedCost = Math.max(quickEstimate?.avg || 0, advancedTotal);

  const toggleItem = (id) => {
    setSelectedItems(prev => ({ ...prev, [id]: !prev[id] }));
    if (!itemQuantities[id]) setItemQuantities(prev => ({ ...prev, [id]: '1' }));
    setSqft('');
    setSelectedLevel(null);
  };

  const updateQuantity = (id, val) => {
    setItemQuantities(prev => ({ ...prev, [id]: val.replace(/[^0-9]/g, '') }));
  };

  const handleSync = (amount) => {
    const costToSync = amount || suggestedCost;
    if (costToSync <= 0) {
      toast.error('Select a repair estimate first');
      return;
    }
    onSyncToCalculator(costToSync);
    toast.success(`${fmt(costToSync)} synced to Calculator!`);
  };

  const clearAll = () => {
    setSqft('');
    setSelectedLevel(null);
    setSelectedItems({});
    setItemQuantities({});
    toast.success('Estimator cleared');
  };

  return (
    <div className="space-y-6">
      {/* Quick Estimate Card */}
      <GlassCard glow isDark={isDark}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF7A1A] to-[#FF9A3C] flex items-center justify-center shadow-lg shadow-[#FF7A1A]/20">
              <Grid3X3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Quick Estimate</h3>
              <p className={`text-xs ${isDark ? 'text-[#A0A6B0]' : 'text-gray-500'}`}>Calculate by square footage</p>
            </div>
          </div>
          
          {/* Square Footage Input */}
          <div className={`group relative rounded-xl mb-5 transition-all duration-200 ${isDark ? 'bg-[#0F1115] border border-[#2A2F3A] focus-within:border-[#FF7A1A] focus-within:shadow-lg focus-within:shadow-[#FF7A1A]/10' : 'bg-gray-50 border border-gray-200 focus-within:border-[#FF7A1A]'}`}>
            <div className="flex items-center gap-3 p-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-[#1A1D24]' : 'bg-gray-100'}`}>
                <Home className={`w-5 h-5 ${isDark ? 'text-[#A0A6B0]' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1">
                <label className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-[#A0A6B0]' : 'text-gray-500'}`}>Square Footage</label>
                <input
                  data-testid="repair-sqft-input"
                  type="text"
                  inputMode="numeric"
                  value={formatInput(sqft)}
                  onChange={e => setSqft(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 1,343"
                  className={`w-full bg-transparent font-bold text-xl mt-0.5 focus:outline-none placeholder:opacity-30 ${isDark ? 'text-white' : 'text-gray-900'}`}
                />
              </div>
            </div>
          </div>

          {/* Rehab Level Selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {REHAB_LEVELS.map(level => {
              const isSelected = selectedLevel?.id === level.id;
              return (
                <button
                  key={level.id}
                  data-testid={`rehab-level-${level.id}`}
                  onClick={() => setSelectedLevel(level)}
                  className={`relative p-4 rounded-xl text-left transition-all duration-200 group ${
                    isSelected 
                      ? 'ring-2 ring-offset-2 shadow-lg' 
                      : isDark 
                        ? 'bg-[#0F1115] border border-[#2A2F3A] hover:border-[#FF7A1A]/50' 
                        : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
                  }`}
                  style={isSelected ? { 
                    ringColor: level.color, 
                    boxShadow: `0 10px 25px -5px ${level.color}30`,
                    ringOffsetColor: isDark ? '#1A1D24' : '#fff'
                  } : {}}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: level.color, boxShadow: isSelected ? `0 0 10px ${level.color}` : 'none' }} />
                    <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{level.label}</span>
                  </div>
                  <p className="font-black text-lg" style={{ color: level.color }}>
                    ${level.min}–${level.max}
                    <span className={`text-xs font-normal ${isDark ? 'text-[#A0A6B0]' : 'text-gray-500'}`}>/sqft</span>
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-[#A0A6B0]' : 'text-gray-500'}`}>{level.desc}</p>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: level.color }}>
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Estimate Result */}
          {quickEstimate && sqftValue > 0 && (
            <div className={`mt-6 p-5 rounded-xl border ${isDark ? 'bg-[#0F1115] border-[#2A2F3A]' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#FF7A1A]" />
                <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-[#A0A6B0]' : 'text-gray-500'}`}>Estimated Repair Cost</p>
              </div>
              <p className={`font-black text-4xl mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {fmt(quickEstimate.avg)}
              </p>
              <p className={`text-sm ${isDark ? 'text-[#A0A6B0]' : 'text-gray-500'}`}>
                Range: <strong>{fmt(quickEstimate.min)}</strong> – <strong>{fmt(quickEstimate.max)}</strong>
              </p>
              <p className={`text-xs mt-2 ${isDark ? 'text-[#A0A6B0]/60' : 'text-gray-400'}`}>
                {sqftValue.toLocaleString()} sqft × ${((selectedLevel.min + selectedLevel.max) / 2).toFixed(0)}/sqft
              </p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Advanced Itemized Card */}
      <GlassCard isDark={isDark}>
        <button
          data-testid="advanced-repair-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`w-full flex items-center justify-between p-5 transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#0F1115]' : 'bg-gray-100'}`}>
              <Wrench className={`w-5 h-5 ${isDark ? 'text-[#A0A6B0]' : 'text-gray-500'}`} />
            </div>
            <div className="text-left">
              <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Advanced Itemized</span>
              {selectedItemCount > 0 && (
                <span className="ml-2 bg-[#FF7A1A] text-white text-xs font-bold px-2 py-0.5 rounded-full">{selectedItemCount}</span>
              )}
              <p className={`text-xs ${isDark ? 'text-[#A0A6B0]' : 'text-gray-500'}`}>Select individual repairs</p>
            </div>
          </div>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${showAdvanced ? 'bg-[#FF7A1A] text-white rotate-180' : isDark ? 'bg-[#0F1115] text-[#A0A6B0]' : 'bg-gray-100 text-gray-400'}`}>
            <ChevronDown className="w-4 h-4" />
          </div>
        </button>

        {showAdvanced && (
          <div className={`border-t ${isDark ? 'border-[#2A2F3A]' : 'border-gray-200'}`}>
            {REPAIR_CATEGORIES.map(category => {
              const CategoryIcon = category.icon;
              const isExpanded = expandedCategories[category.name];
              return (
                <div key={category.name} className={`border-b last:border-b-0 ${isDark ? 'border-[#2A2F3A]/50' : 'border-gray-100'}`}>
                  <button
                    onClick={() => setExpandedCategories(prev => ({ ...prev, [category.name]: !prev[category.name] }))}
                    className={`w-full flex items-center justify-between px-5 py-3 transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-2">
                      <CategoryIcon className={`w-4 h-4 ${isDark ? 'text-[#A0A6B0]' : 'text-gray-400'}`} />
                      <span className={`text-sm font-semibold ${isDark ? 'text-[#A0A6B0]' : 'text-gray-600'}`}>{category.name}</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 opacity-40" /> : <ChevronDown className="w-4 h-4 opacity-40" />}
                  </button>
                  
                  {isExpanded && (
                    <div className="px-5 pb-4 space-y-2">
                      {category.items.map(item => {
                        const isSelected = selectedItems[item.id];
                        const qty = parseInt(itemQuantities[item.id]) || 1;
                        const itemTotal = item.cost * qty;
                        
                        return (
                          <div 
                            key={item.id}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                              isSelected 
                                ? 'bg-gradient-to-r from-[#FF7A1A]/10 to-[#FF9A3C]/5 border border-[#FF7A1A]/30'
                                : isDark ? 'bg-[#0F1115]' : 'bg-gray-50'
                            }`}
                          >
                            <button
                              data-testid={`repair-item-${item.id}`}
                              onClick={() => toggleItem(item.id)}
                              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                                isSelected 
                                  ? 'bg-gradient-to-br from-[#FF7A1A] to-[#FF9A3C] shadow-lg shadow-[#FF7A1A]/30' 
                                  : isDark ? 'bg-[#1A1D24] hover:bg-[#2A2F3A]' : 'bg-gray-200 hover:bg-gray-300'
                              }`}
                            >
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </button>
                            
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.label}</p>
                            </div>
                            
                            {item.qty && isSelected && (
                              <div className="flex items-center gap-2">
                                <span className={`text-xs ${isDark ? 'text-[#A0A6B0]' : 'text-gray-400'}`}>Qty:</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={itemQuantities[item.id] !== undefined ? itemQuantities[item.id] : '1'}
                                  onChange={e => updateQuantity(item.id, e.target.value)}
                                  onFocus={e => e.target.select()}
                                  placeholder="1"
                                  className={`w-12 text-center rounded-lg py-1 text-sm font-semibold ${isDark ? 'bg-[#1A1D24] text-white' : 'bg-white border border-gray-200 text-gray-900'}`}
                                />
                              </div>
                            )}
                            
                            <div className="text-right shrink-0">
                              <p className={`font-bold text-sm ${isSelected ? 'text-[#FF7A1A]' : isDark ? 'text-[#A0A6B0]' : 'text-gray-500'}`}>
                                {isSelected && item.qty ? fmt(itemTotal) : fmt(item.cost)}
                              </p>
                              {item.qty && !isSelected && <p className={`text-xs ${isDark ? 'text-[#A0A6B0]/50' : 'text-gray-400'}`}>each</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {advancedTotal > 0 && (
              <div className={`p-5 ${isDark ? 'bg-[#0F1115]/50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-semibold ${isDark ? 'text-[#A0A6B0]' : 'text-gray-600'}`}>Itemized Total</p>
                  <p className={`font-black text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{fmt(advancedTotal)}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </GlassCard>

      {/* Suggested Repair Cost - Hero CTA */}
      {suggestedCost > 0 && (
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF7A1A] to-[#FF9A3C]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyek0zNiAyNnYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          <div className="relative p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-white/70" />
                <p className="text-sm font-semibold text-white/70 uppercase tracking-wider">Suggested Repair Cost</p>
              </div>
              <p className="font-black text-white text-5xl">{fmt(suggestedCost)}</p>
              <p className="text-white/60 text-sm mt-2">
                {advancedTotal > 0 && quickEstimate?.avg 
                  ? `Higher of: Quick (${fmt(quickEstimate.avg)}) vs Itemized (${fmt(advancedTotal)})`
                  : advancedTotal > 0 
                    ? 'Based on itemized repairs'
                    : 'Based on sqft estimate'
                }
              </p>
            </div>
            <button
              data-testid="sync-to-calculator-btn"
              onClick={() => handleSync()}
              className="flex items-center justify-center gap-2 bg-white text-[#FF7A1A] font-bold px-6 py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm whitespace-nowrap"
            >
              <Calculator className="w-5 h-5" />
              Sync to Calculator
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Reference Table */}
      <GlassCard isDark={isDark}>
        <div className={`px-5 py-4 flex items-center gap-3 border-b ${isDark ? 'border-[#2A2F3A]' : 'border-gray-200'}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#0F1115]' : 'bg-gray-100'}`}>
            <DollarSign className={`w-4 h-4 ${isDark ? 'text-[#A0A6B0]' : 'text-gray-500'}`} />
          </div>
          <div>
            <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Reference by Size</p>
            <p className={`text-xs ${isDark ? 'text-[#A0A6B0]' : 'text-gray-500'}`}>Click any price to send to calculator</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={isDark ? 'bg-[#0F1115]/50' : 'bg-gray-50'}>
                <th className={`px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-[#A0A6B0]' : 'text-gray-500'}`}>Property Size</th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-green-500">Light</th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-yellow-500">Medium</th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-orange-500">Heavy</th>
              </tr>
            </thead>
            <tbody>
              {SQFT_RANGES.map((range, i) => (
                <tr key={i} className={`border-t ${isDark ? 'border-[#2A2F3A]/50' : 'border-gray-100'}`}>
                  <td className={`px-5 py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{range.label}</td>
                  <td className="px-5 py-4 text-center">
                    <button
                      data-testid={`ref-light-${i}`}
                      onClick={() => handleSync(range.light)}
                      className="font-bold text-green-500 hover:text-green-400 hover:underline transition-all cursor-pointer hover:scale-105"
                    >
                      {fmt(range.light)}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button
                      data-testid={`ref-medium-${i}`}
                      onClick={() => handleSync(range.avg)}
                      className="font-bold text-yellow-500 hover:text-yellow-400 hover:underline transition-all cursor-pointer hover:scale-105"
                    >
                      {fmt(range.avg)}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button
                      data-testid={`ref-heavy-${i}`}
                      onClick={() => handleSync(range.heavy)}
                      className="font-bold text-orange-500 hover:text-orange-400 hover:underline transition-all cursor-pointer hover:scale-105"
                    >
                      {fmt(range.heavy)}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Clear Button */}
      {(sqft || selectedLevel || selectedItemCount > 0) && (
        <div className="flex justify-center">
          <button
            data-testid="clear-estimator-btn"
            onClick={clearAll}
            className={`text-sm font-semibold px-6 py-2 rounded-xl transition-all ${isDark ? 'text-[#A0A6B0] hover:text-white hover:bg-[#1A1D24]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
          >
            Clear Estimator
          </button>
        </div>
      )}
    </div>
  );
}
