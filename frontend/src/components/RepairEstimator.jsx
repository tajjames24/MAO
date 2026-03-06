import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, ArrowRight, Calculator, Check, Info } from 'lucide-react';
import { toast } from 'sonner';

// ─── REHAB COST LEVELS ───────────────────────────────────────────────────────
const REHAB_LEVELS = [
  { id: 'light',  label: 'Light Rehab',    min: 15, max: 30,  color: 'bg-green-500',  textColor: 'text-green-600',  desc: 'Cosmetic updates, paint, cleaning' },
  { id: 'medium', label: 'Medium Rehab',   min: 35, max: 50,  color: 'bg-yellow-500', textColor: 'text-yellow-600', desc: 'Windows, A/C, cosmetics — nothing major' },
  { id: 'heavy',  label: 'Heavy Rehab',    min: 60, max: 100, color: 'bg-orange-500', textColor: 'text-orange-600', desc: 'Major systems, structural, full renovation' },
  { id: 'ultra',  label: 'Ultra Heavy',    min: 100, max: 150, color: 'bg-red-500',   textColor: 'text-red-600',    desc: 'Gut rehab, near-new construction' },
];

// ─── REPAIR ITEMS (COMPONENT-BASED) ──────────────────────────────────────────
const REPAIR_CATEGORIES = [
  {
    name: 'Exterior',
    items: [
      { id: 'landscape',    label: 'Clean Landscape',    cost: 2000, desc: '$500–$2,000 for all new landscaping' },
      { id: 'window',       label: 'Windows (per unit)', cost: 300,  qty: true, desc: '$300 each' },
      { id: 'garageDoor',   label: 'New Garage Door',    cost: 1000 },
    ]
  },
  {
    name: 'Interior',
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
  };

  const updateQuantity = (id, val) => {
    const num = val.replace(/[^0-9]/g, '');
    setItemQuantities(prev => ({ ...prev, [id]: num }));
  };

  const toggleCategory = (name) => {
    setExpandedCategories(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSync = () => {
    if (suggestedCost <= 0) {
      toast.error('Calculate a repair estimate first');
      return;
    }
    onSyncToCalculator(suggestedCost);
    toast.success(`${fmt(suggestedCost)} synced to Calculator!`);
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
      
      {/* ─── QUICK ESTIMATE SECTION ─────────────────────────────────────────── */}
      <div className={`border-2 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] ${isDark ? 'bg-[#1E1E1E] border-[#333]' : 'bg-white border-[#1A1A1A]'}`}>
        <div className="p-5 md:p-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#FF7A00] mb-5">Quick Estimate by Square Footage</h3>
          
          {/* Square Footage Input */}
          <div className="space-y-2 mb-6">
            <label className={`flex items-center gap-1 text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-[#1A1A1A]'}`}>
              Square Footage
              <span title="Enter the total square footage of the property" className="cursor-help">
                <Info className="w-3 h-3 opacity-40" />
              </span>
            </label>
            <input
              data-testid="repair-sqft-input"
              type="text"
              inputMode="numeric"
              value={formatInput(sqft)}
              onChange={e => setSqft(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 1,343"
              className={`w-full border-2 border-transparent font-semibold text-lg py-3.5 px-4 rounded-md transition-all duration-150 focus:outline-none focus:border-[#FF7A00] placeholder:opacity-30 ${isDark ? 'bg-[#2C1A00] text-white placeholder:text-white' : 'bg-[#FFE6CC] text-[#1A1A1A] placeholder:text-[#1A1A1A]'}`}
            />
          </div>

          {/* Rehab Level Selector */}
          <div className="space-y-3">
            <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-[#1A1A1A]'}`}>
              Select Rehab Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {REHAB_LEVELS.map(level => {
                const isSelected = selectedLevel?.id === level.id;
                return (
                  <button
                    key={level.id}
                    data-testid={`rehab-level-${level.id}`}
                    onClick={() => setSelectedLevel(level)}
                    className={`relative p-4 border-2 text-left transition-all duration-200 ${
                      isSelected 
                        ? 'border-[#FF7A00] shadow-[3px_3px_0px_0px_rgba(255,122,0,1)]' 
                        : isDark 
                          ? 'border-[#333] hover:border-[#555]' 
                          : 'border-[#E5E7EB] hover:border-[#1A1A1A]'
                    } ${isDark ? 'bg-[#161616]' : 'bg-[#FAFAFA]'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${level.color} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#1A1A1A]'}`}>{level.label}</p>
                        <p className={`text-lg font-black ${level.textColor}`} style={{ fontFamily: 'Chivo, sans-serif' }}>
                          ${level.min}–${level.max}/sqft
                        </p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-[#1A1A1A]/50'}`}>{level.desc}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-[#FF7A00] rounded-full flex items-center justify-center">
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
            <div className={`mt-6 p-5 border-2 ${isDark ? 'bg-[#0D0D0D] border-[#333]' : 'bg-[#FFF7ED] border-[#FFE6CC]'}`}>
              <p className="text-xs font-bold uppercase tracking-widest text-[#FF7A00] mb-3">Estimated Repair Cost</p>
              <div className="flex items-end gap-2 mb-3">
                <span className={`font-black leading-none ${isDark ? 'text-white' : 'text-[#1A1A1A]'}`} style={{ fontFamily: 'Chivo, sans-serif', fontSize: 'clamp(1.5rem, 4vw, 2.25rem)' }}>
                  {fmt(quickEstimate.avg)}
                </span>
                <span className={`text-sm font-medium pb-1 ${isDark ? 'text-white/50' : 'text-[#1A1A1A]/50'}`}>average</span>
              </div>
              <div className={`flex flex-wrap gap-4 text-sm ${isDark ? 'text-white/60' : 'text-[#1A1A1A]/60'}`}>
                <span>Range: <strong className={isDark ? 'text-white' : 'text-[#1A1A1A]'}>{fmt(quickEstimate.min)}</strong> – <strong className={isDark ? 'text-white' : 'text-[#1A1A1A]'}>{fmt(quickEstimate.max)}</strong></span>
              </div>
              <p className={`text-xs mt-3 ${isDark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>
                {sqftValue.toLocaleString()} sqft × ${((selectedLevel.min + selectedLevel.max) / 2).toFixed(2)}/sqft (avg)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── ADVANCED ITEMIZED SECTION ──────────────────────────────────────── */}
      <div className={`border-2 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] ${isDark ? 'border-[#333]' : 'border-[#1A1A1A]'}`}>
        <button
          data-testid="advanced-repair-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`w-full flex items-center justify-between p-4 md:p-5 transition-colors duration-150 ${isDark ? 'bg-[#1E1E1E] hover:bg-[#2C1A00] text-white' : 'bg-white hover:bg-[#FFF7ED] text-[#1A1A1A]'}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest">Advanced Itemized Repairs</span>
            {selectedItemCount > 0 && (
              <span className="bg-[#FF7A00] text-white text-xs font-black px-2 py-0.5 rounded-full">
                {selectedItemCount} selected
              </span>
            )}
          </div>
          {showAdvanced ? <ChevronUp className="w-4 h-4 text-[#FF7A00]" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvanced && (
          <div className={`border-t-2 ${isDark ? 'border-[#333] bg-[#161616]' : 'border-[#1A1A1A] bg-[#FFFAF5]'}`}>
            {REPAIR_CATEGORIES.map(category => (
              <div key={category.name} className={`border-b last:border-b-0 ${isDark ? 'border-[#333]' : 'border-[#E5E7EB]'}`}>
                <button
                  onClick={() => toggleCategory(category.name)}
                  className={`w-full flex items-center justify-between px-5 py-3 transition-colors ${isDark ? 'hover:bg-[#1E1E1E]' : 'hover:bg-[#FFF7ED]'}`}
                >
                  <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white/60' : 'text-[#1A1A1A]/60'}`}>{category.name}</span>
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
                          className={`flex items-center gap-3 p-3 rounded transition-all ${
                            isSelected 
                              ? isDark ? 'bg-[#2C1A00] border border-[#FF7A00]/30' : 'bg-[#FFE6CC]/50 border border-[#FF7A00]/30'
                              : isDark ? 'bg-[#1E1E1E]' : 'bg-white'
                          }`}
                        >
                          <button
                            data-testid={`repair-item-${item.id}`}
                            onClick={() => toggleItem(item.id)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                              isSelected 
                                ? 'bg-[#FF7A00] border-[#FF7A00]' 
                                : isDark ? 'border-[#555] hover:border-[#FF7A00]' : 'border-[#D1D5DB] hover:border-[#FF7A00]'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </button>
                          
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-[#1A1A1A]'}`}>{item.label}</p>
                            {item.desc && <p className={`text-xs ${isDark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>{item.desc}</p>}
                          </div>
                          
                          {item.qty && isSelected && (
                            <div className="flex items-center gap-2">
                              <span className={`text-xs ${isDark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>Qty:</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={itemQuantities[item.id] || '1'}
                                onChange={e => updateQuantity(item.id, e.target.value)}
                                className={`w-12 text-center border rounded py-1 text-sm font-semibold ${isDark ? 'bg-[#111] border-[#333] text-white' : 'bg-white border-[#D1D5DB] text-[#1A1A1A]'}`}
                              />
                            </div>
                          )}
                          
                          <div className="text-right shrink-0">
                            <p className={`font-bold text-sm ${isSelected ? 'text-[#FF7A00]' : isDark ? 'text-white/60' : 'text-[#1A1A1A]/60'}`} style={{ fontFamily: 'Chivo, sans-serif' }}>
                              {isSelected && item.qty ? fmt(itemTotal) : fmt(item.cost)}
                            </p>
                            {item.qty && !isSelected && <p className={`text-xs ${isDark ? 'text-white/30' : 'text-[#1A1A1A]/30'}`}>each</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* Advanced Total */}
            {advancedTotal > 0 && (
              <div className={`p-5 border-t-2 ${isDark ? 'border-[#333] bg-[#0D0D0D]' : 'border-[#FFE6CC] bg-[#FFF7ED]'}`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#FF7A00]">Itemized Total</p>
                  <p className={`font-black text-2xl ${isDark ? 'text-white' : 'text-[#1A1A1A]'}`} style={{ fontFamily: 'Chivo, sans-serif' }}>
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
        <div className="bg-[#FF7A00] border-2 border-[#1A1A1A] p-6 shadow-[5px_5px_0px_0px_rgba(26,26,26,1)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">Suggested Repair Cost</p>
              <p className="font-black text-white leading-none" style={{ fontFamily: 'Chivo, sans-serif', fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
                {fmt(suggestedCost)}
              </p>
              <p className="text-white/60 text-sm mt-2">
                {advancedTotal > 0 && quickEstimate?.avg 
                  ? `Using higher of: Quick (${fmt(quickEstimate.avg)}) vs Itemized (${fmt(advancedTotal)})`
                  : advancedTotal > 0 
                    ? 'Based on itemized repairs'
                    : 'Based on sqft estimate'
                }
              </p>
            </div>
            <button
              data-testid="sync-to-calculator-btn"
              onClick={handleSync}
              className="flex items-center justify-center gap-2 bg-white text-[#1A1A1A] font-bold uppercase tracking-wider px-6 py-4 border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:bg-[#FFF7ED] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all text-sm whitespace-nowrap"
            >
              <Calculator className="w-4 h-4" />
              Sync to Calculator
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── REFERENCE TABLE ──────────────────────────────────────────────────── */}
      <div className={`border-2 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] overflow-hidden ${isDark ? 'border-[#333]' : 'border-[#1A1A1A]'}`}>
        <div className={`px-5 py-3 ${isDark ? 'bg-[#1A1A1A]' : 'bg-[#1A1A1A]'}`}>
          <p className="text-white font-bold text-xs uppercase tracking-widest">Repair Cost Reference by Size</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={isDark ? 'bg-[#1E1E1E]' : 'bg-[#FFF7ED]'}>
                <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white/60' : 'text-[#1A1A1A]/60'}`}>Property Size</th>
                <th className={`px-4 py-3 text-right text-xs font-bold uppercase tracking-widest text-green-600`}>Light</th>
                <th className={`px-4 py-3 text-right text-xs font-bold uppercase tracking-widest text-yellow-600`}>Medium</th>
                <th className={`px-4 py-3 text-right text-xs font-bold uppercase tracking-widest text-orange-600`}>Heavy</th>
              </tr>
            </thead>
            <tbody>
              {SQFT_RANGES.map((range, i) => (
                <tr key={i} className={`border-t ${isDark ? 'border-[#333]' : 'border-[#E5E7EB]'}`}>
                  <td className={`px-4 py-3 font-medium ${isDark ? 'text-white' : 'text-[#1A1A1A]'}`}>{range.label}</td>
                  <td className="px-4 py-3 text-right font-bold text-green-600" style={{ fontFamily: 'Chivo, sans-serif' }}>{fmt(range.light)}</td>
                  <td className="px-4 py-3 text-right font-bold text-yellow-600" style={{ fontFamily: 'Chivo, sans-serif' }}>{fmt(range.avg)}</td>
                  <td className="px-4 py-3 text-right font-bold text-orange-600" style={{ fontFamily: 'Chivo, sans-serif' }}>{fmt(range.heavy)}</td>
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
            className={`text-sm font-bold uppercase tracking-wider px-6 py-2 transition-colors ${isDark ? 'text-white/40 hover:text-white' : 'text-[#1A1A1A]/40 hover:text-[#1A1A1A]'}`}
          >
            Clear Estimator
          </button>
        </div>
      )}
    </div>
  );
}
