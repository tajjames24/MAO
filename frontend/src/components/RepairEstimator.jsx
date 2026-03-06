import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, ArrowRight, Calculator, Check, Info, Home, Grid3X3, Wrench, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

// ─── REHAB COST LEVELS ───────────────────────────────────────────────────────
const REHAB_LEVELS = [
  { id: 'light',  label: 'Light Rehab',    min: 15, max: 30,  color: 'bg-green-500',  ringColor: 'ring-green-500/30', textColor: 'text-green-400',  desc: 'Cosmetic updates, paint, cleaning' },
  { id: 'medium', label: 'Medium Rehab',   min: 35, max: 50,  color: 'bg-yellow-500', ringColor: 'ring-yellow-500/30', textColor: 'text-yellow-400', desc: 'Windows, A/C, cosmetics — nothing major' },
  { id: 'heavy',  label: 'Heavy Rehab',    min: 60, max: 100, color: 'bg-orange-500', ringColor: 'ring-orange-500/30', textColor: 'text-orange-400', desc: 'Major systems, structural, full renovation' },
  { id: 'ultra',  label: 'Ultra Heavy',    min: 100, max: 150, color: 'bg-red-500',   ringColor: 'ring-red-500/30', textColor: 'text-red-400',    desc: 'Gut rehab, near-new construction' },
];

// ─── REPAIR ITEMS (COMPONENT-BASED) ──────────────────────────────────────────
const REPAIR_CATEGORIES = [
  {
    name: 'Exterior',
    icon: Home,
    items: [
      { id: 'landscape',    label: 'Clean Landscape',    cost: 2000, desc: '$500–$2,000 for all new landscaping' },
      { id: 'window',       label: 'Windows (per unit)', cost: 300,  qty: true, desc: '$300 each' },
      { id: 'garageDoor',   label: 'New Garage Door',    cost: 1000 },
    ]
  },
  {
    name: 'Interior',
    icon: Grid3X3,
    items: [
      { id: 'kitchenFull',   label: 'Kitchen Renovation (Full)',  cost: 10000 },
      { id: 'kitchenLight',  label: 'Kitchen Update (Light)',     cost: 5000 },
      { id: 'bathFull',      label: 'Full Bathroom Renovation',   cost: 4000, qty: true },
      { id: 'bathHalf',      label: 'Half Bathroom Renovation',   cost: 2000, qty: true },
      { id: 'flooring',      label: 'Flooring',                   cost: 5000 },
      { id: 'tile',          label: 'Tile Work',                  cost: 3500 },
      { id: 'interiorPaint', label: 'Interior Paint',             cost: 3500 },
      { id: 'exteriorPaint', label: 'Exterior Paint',             cost: 3500 },
      { id: 'doorsTrim',     label: 'New Doors and Trim',         cost: 3000 },
    ]
  },
  {
    name: 'Mechanicals',
    icon: Wrench,
    items: [
      { id: 'hvac',         label: 'Furnace and A/C Replacement',  cost: 5000 },
      { id: 'roofRanch',    label: 'Roof Replacement (Ranch)',     cost: 6000 },
      { id: 'roofTwoStory', label: 'Roof Replacement (Two-Story)', cost: 7500 },
      { id: 'lighting',     label: 'All New Lighting',             cost: 1500 },
      { id: 'hotWater',     label: 'New Hot Water Tank',           cost: 1000 },
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

// ─── SQFT RANGE REFERENCE ────────────────────────────────────────────────────
const SQFT_RANGES = [
  { label: 'Under 1,500 Sq. Ft.', light: 18750, avg: 37500, heavy: 70000 },
  { label: '1,500–2,500 Sq. Ft.', light: 25000, avg: 50000, heavy: 90000 },
  { label: '2,500–3,500 Sq. Ft.', light: 37500, avg: 62500, heavy: 125000 },
];

const fmt = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

const formatInput = (val) => {
  if (!val) return '';
  const parts = String(val).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

export default function RepairEstimator({ onSyncToCalculator, isDark }) {
  // Quick Estimate State
  const [sqft, setSqft] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(null);
  
  // Advanced State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedItems, setSelectedItems] = useState({});
  const [itemQuantities, setItemQuantities] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({ Exterior: true, Interior: true });

  // ─── CALCULATIONS ──────────────────────────────────────────────────────────
  
  // Quick SqFt-Based Estimate
  const sqftValue = parseFloat(sqft?.replace(/,/g, '')) || 0;
  const quickEstimate = selectedLevel ? {
    min: sqftValue * selectedLevel.min,
    max: sqftValue * selectedLevel.max,
    avg: sqftValue * ((selectedLevel.min + selectedLevel.max) / 2)
  } : null;

  // Advanced Component-Based Total
  const advancedTotal = Object.entries(selectedItems).reduce((total, [id, isSelected]) => {
    if (!isSelected) return total;
    const item = REPAIR_CATEGORIES.flatMap(c => c.items).find(i => i.id === id);
    if (!item) return total;
    const qty = item.qty ? (parseInt(itemQuantities[id]) || 1) : 1;
    return total + (item.cost * qty);
  }, 0);

  const selectedItemCount = Object.values(selectedItems).filter(Boolean).length;

  // Suggested (use the higher of quick avg or advanced)
  const suggestedCost = Math.max(quickEstimate?.avg || 0, advancedTotal);

  // ─── HANDLERS ──────────────────────────────────────────────────────────────
  
  const toggleItem = (id) => {
    setSelectedItems(prev => ({ ...prev, [id]: !prev[id] }));
    if (!itemQuantities[id]) {
      setItemQuantities(prev => ({ ...prev, [id]: '1' }));
    }
    // Reset Quick Estimate when selecting advanced items
    setSqft('');
    setSelectedLevel(null);
  };

  const updateQuantity = (id, val) => {
    const num = val.replace(/[^0-9]/g, '');
    setItemQuantities(prev => ({ ...prev, [id]: num }));
  };

  const toggleCategory = (name) => {
    setExpandedCategories(prev => ({ ...prev, [name]: !prev[name] }));
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

  // Handle reference table click
  const handleReferenceClick = (amount) => {
    handleSync(amount);
  };

  return (
    <div className="space-y-6">
      
      {/* ─── QUICK ESTIMATE SECTION ─────────────────────────────────────────── */}
      <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gradient-to-br from-[#1a1a2e] to-[#16213e]' : 'bg-gradient-to-br from-white to-gray-50'} border ${isDark ? 'border-white/10' : 'border-gray-200'} shadow-xl`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#FF7A00]/20' : 'bg-[#FF7A00]/10'}`}>
              <Grid3X3 className="w-5 h-5 text-[#FF7A00]" />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Quick Estimate</h3>
              <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Calculate by square footage</p>
            </div>
          </div>
          
          {/* Square Footage Input */}
          <div className="space-y-2 mb-6">
            <label className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              <Home className="w-4 h-4 text-[#FF7A00]" />
              Square Footage
            </label>
            <input
              data-testid="repair-sqft-input"
              type="text"
              inputMode="numeric"
              value={formatInput(sqft)}
              onChange={e => setSqft(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 1,343"
              className={`w-full font-semibold text-lg py-4 px-4 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] placeholder:opacity-40 ${isDark ? 'bg-white/5 text-white border border-white/10 placeholder:text-white' : 'bg-gray-100 text-gray-900 border border-gray-200 placeholder:text-gray-400'}`}
            />
          </div>

          {/* Rehab Level Selector */}
          <div className="space-y-3">
            <label className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              <Wrench className="w-4 h-4 text-[#FF7A00]" />
              Rehab Level
            </label>
            <div className="grid grid-cols-2 gap-3">
              {REHAB_LEVELS.map(level => {
                const isSelected = selectedLevel?.id === level.id;
                return (
                  <button
                    key={level.id}
                    data-testid={`rehab-level-${level.id}`}
                    onClick={() => setSelectedLevel(level)}
                    className={`relative p-4 rounded-xl text-left transition-all duration-200 ${
                      isSelected 
                        ? `ring-2 ${level.ringColor} ${isDark ? 'bg-white/10' : 'bg-gray-100'}` 
                        : isDark 
                          ? 'bg-white/5 hover:bg-white/10 border border-white/10' 
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-3 h-3 rounded-full ${level.color} mt-1 shrink-0 ${isSelected ? 'ring-4 ring-offset-2 ring-offset-transparent ' + level.ringColor : ''}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{level.label}</p>
                        <p className={`text-base font-bold ${level.textColor}`}>
                          ${level.min}–${level.max}<span className="text-xs font-normal opacity-70">/sqft</span>
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center ${level.color}`}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Estimate Result */}
          {quickEstimate && sqftValue > 0 && (
            <div className={`mt-6 p-5 rounded-xl ${isDark ? 'bg-[#FF7A00]/10 border border-[#FF7A00]/20' : 'bg-[#FF7A00]/5 border border-[#FF7A00]/20'}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#FF7A00] mb-2">Estimated Repair Cost</p>
              <div className="flex items-baseline gap-2 mb-2">
                <span className={`font-black text-3xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {fmt(quickEstimate.avg)}
                </span>
                <span className={`text-sm font-medium ${isDark ? 'text-white/50' : 'text-gray-500'}`}>average</span>
              </div>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                Range: <strong>{fmt(quickEstimate.min)}</strong> – <strong>{fmt(quickEstimate.max)}</strong>
              </p>
              <p className={`text-xs mt-2 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                {sqftValue.toLocaleString()} sqft × ${((selectedLevel.min + selectedLevel.max) / 2).toFixed(0)}/sqft
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── ADVANCED ITEMIZED SECTION ──────────────────────────────────────── */}
      <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gradient-to-br from-[#1a1a2e] to-[#16213e]' : 'bg-gradient-to-br from-white to-gray-50'} border ${isDark ? 'border-white/10' : 'border-gray-200'} shadow-xl`}>
        <button
          data-testid="advanced-repair-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`w-full flex items-center justify-between p-5 transition-colors duration-200`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#FF7A00]/20' : 'bg-[#FF7A00]/10'}`}>
              <Wrench className="w-5 h-5 text-[#FF7A00]" />
            </div>
            <div className="text-left">
              <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Advanced Itemized</span>
              {selectedItemCount > 0 && (
                <span className="ml-2 bg-[#FF7A00] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {selectedItemCount}
                </span>
              )}
              <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Select individual repairs</p>
            </div>
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
            {showAdvanced ? <ChevronUp className="w-4 h-4 text-[#FF7A00]" /> : <ChevronDown className="w-4 h-4 text-[#FF7A00]" />}
          </div>
        </button>

        {showAdvanced && (
          <div className={`border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            {REPAIR_CATEGORIES.map(category => {
              const CategoryIcon = category.icon;
              return (
                <div key={category.name} className={`border-b last:border-b-0 ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                  <button
                    onClick={() => toggleCategory(category.name)}
                    className={`w-full flex items-center justify-between px-5 py-3 transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-2">
                      <CategoryIcon className={`w-4 h-4 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
                      <span className={`text-sm font-semibold ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{category.name}</span>
                    </div>
                    {expandedCategories[category.name] ? <ChevronUp className="w-4 h-4 opacity-40" /> : <ChevronDown className="w-4 h-4 opacity-40" />}
                  </button>
                  
                  {expandedCategories[category.name] && (
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
                                ? isDark ? 'bg-[#FF7A00]/10 border border-[#FF7A00]/30' : 'bg-[#FF7A00]/5 border border-[#FF7A00]/20'
                                : isDark ? 'bg-white/5 border border-transparent' : 'bg-gray-50 border border-transparent'
                            }`}
                          >
                            <button
                              data-testid={`repair-item-${item.id}`}
                              onClick={() => toggleItem(item.id)}
                              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                                isSelected 
                                  ? 'bg-[#FF7A00]' 
                                  : isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'
                              }`}
                            >
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </button>
                            
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.label}</p>
                              {item.desc && <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{item.desc}</p>}
                            </div>
                            
                            {item.qty && isSelected && (
                              <div className="flex items-center gap-2">
                                <span className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>Qty:</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={itemQuantities[item.id] !== undefined ? itemQuantities[item.id] : '1'}
                                  onChange={e => updateQuantity(item.id, e.target.value)}
                                  onFocus={e => e.target.select()}
                                  placeholder="1"
                                  className={`w-12 text-center rounded-lg py-1 text-sm font-semibold ${isDark ? 'bg-white/10 border-0 text-white' : 'bg-white border border-gray-200 text-gray-900'}`}
                                />
                              </div>
                            )}
                            
                            <div className="text-right shrink-0">
                              <p className={`font-bold text-sm ${isSelected ? 'text-[#FF7A00]' : isDark ? 'text-white/60' : 'text-gray-500'}`}>
                                {isSelected && item.qty ? fmt(itemTotal) : fmt(item.cost)}
                              </p>
                              {item.qty && !isSelected && <p className={`text-xs ${isDark ? 'text-white/30' : 'text-gray-400'}`}>each</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Advanced Total */}
            {advancedTotal > 0 && (
              <div className={`p-5 ${isDark ? 'bg-[#FF7A00]/10' : 'bg-[#FF7A00]/5'}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#FF7A00]">Itemized Total</p>
                  <p className={`font-black text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {fmt(advancedTotal)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── SUGGESTED REPAIR COST ──────────────────────────────────────────── */}
      {suggestedCost > 0 && (
        <div className="bg-gradient-to-r from-[#FF7A00] to-[#FF9A40] rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">Suggested Repair Cost</p>
              <p className="font-black text-white text-4xl">
                {fmt(suggestedCost)}
              </p>
              <p className="text-white/60 text-sm mt-1">
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
              className="flex items-center justify-center gap-2 bg-white text-[#FF7A00] font-bold px-6 py-4 rounded-xl shadow-lg hover:bg-gray-50 active:scale-95 transition-all text-sm whitespace-nowrap"
            >
              <Calculator className="w-5 h-5" />
              Sync to Calculator
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── REFERENCE TABLE ──────────────────────────────────────────────────── */}
      <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gradient-to-br from-[#1a1a2e] to-[#16213e]' : 'bg-gradient-to-br from-white to-gray-50'} border ${isDark ? 'border-white/10' : 'border-gray-200'} shadow-xl`}>
        <div className={`px-5 py-4 flex items-center gap-3 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#FF7A00]/20' : 'bg-[#FF7A00]/10'}`}>
            <DollarSign className="w-4 h-4 text-[#FF7A00]" />
          </div>
          <div>
            <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Reference by Size</p>
            <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Click any price to send to calculator</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Property Size</th>
                <th className={`px-4 py-3 text-center text-xs font-semibold text-green-500`}>Light</th>
                <th className={`px-4 py-3 text-center text-xs font-semibold text-yellow-500`}>Medium</th>
                <th className={`px-4 py-3 text-center text-xs font-semibold text-orange-500`}>Heavy</th>
              </tr>
            </thead>
            <tbody>
              {SQFT_RANGES.map((range, i) => (
                <tr key={i} className={`border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                  <td className={`px-4 py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{range.label}</td>
                  <td className="px-4 py-4 text-center">
                    <button
                      data-testid={`ref-light-${i}`}
                      onClick={() => handleReferenceClick(range.light)}
                      className="font-bold text-green-500 hover:text-green-400 hover:underline transition-colors cursor-pointer"
                    >
                      {fmt(range.light)}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      data-testid={`ref-medium-${i}`}
                      onClick={() => handleReferenceClick(range.avg)}
                      className="font-bold text-yellow-500 hover:text-yellow-400 hover:underline transition-colors cursor-pointer"
                    >
                      {fmt(range.avg)}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      data-testid={`ref-heavy-${i}`}
                      onClick={() => handleReferenceClick(range.heavy)}
                      className="font-bold text-orange-500 hover:text-orange-400 hover:underline transition-colors cursor-pointer"
                    >
                      {fmt(range.heavy)}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clear Button */}
      {(sqft || selectedLevel || selectedItemCount > 0) && (
        <div className="flex justify-center">
          <button
            data-testid="clear-estimator-btn"
            onClick={clearAll}
            className={`text-sm font-semibold px-6 py-2 rounded-full transition-all ${isDark ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
          >
            Clear Estimator
          </button>
        </div>
      )}
    </div>
  );
}
