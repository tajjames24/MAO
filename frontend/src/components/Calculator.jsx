import React, { useState, useEffect } from 'react';
import { useDealCalculator } from '../hooks/useDealCalculator';
import {
  ChevronDown, ChevronUp, RotateCcw,
  BookOpen, Copy, FileText, X, Home, DollarSign, 
  TrendingUp, Tag, ShoppingCart, Percent, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

const fmt = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

const DEFAULT = {
  arv: '',
  repairCost: '',
  assignmentFee: '',
  arvRulePercent: '70',
  negotiationDiscount: '10',
};

const formatInput = (val) => {
  if (!val) return '';
  const parts = String(val).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

// Get consistent colors
const getColors = (isDark) => ({
  bg: isDark ? '#0F1115' : '#F8F9FB',
  card: isDark ? '#1A1D24' : '#FFFFFF',
  cardInner: isDark ? '#0F1115' : '#F3F4F6',
  border: isDark ? '#252830' : '#E5E7EB',
  textPrimary: isDark ? '#9CA3AF' : '#374151',
  textSecondary: isDark ? '#6B7280' : '#9CA3AF',
  textMuted: isDark ? '#4B5563' : '#D1D5DB',
});

// Deal Rating Gauge
function DealGauge({ score, isDark }) {
  const colors = getColors(isDark);
  const normalizedScore = Math.min(100, Math.max(0, score));
  const rotation = (normalizedScore / 100) * 180 - 90;
  
  const getColor = () => {
    if (normalizedScore >= 70) return { fill: '#22c55e', glow: 'rgba(34,197,94,0.3)', label: 'Great Deal' };
    if (normalizedScore >= 40) return { fill: '#eab308', glow: 'rgba(234,179,8,0.3)', label: 'Average Deal' };
    return { fill: '#ef4444', glow: 'rgba(239,68,68,0.3)', label: 'Risky Deal' };
  };
  
  const colorInfo = getColor();
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-24">
        <div className="absolute inset-0 blur-xl opacity-50" style={{ background: `radial-gradient(ellipse at center bottom, ${colorInfo.glow}, transparent 70%)` }} />
        
        <svg viewBox="0 0 200 110" className="w-full h-full">
          <defs>
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.border} />
              <stop offset="100%" stopColor={colors.border} />
            </linearGradient>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          
          <path d="M 15 100 A 85 85 0 0 1 185 100" fill="none" stroke="url(#bgGradient)" strokeWidth="12" strokeLinecap="round" />
          <path d="M 15 100 A 85 85 0 0 1 185 100" fill="none" stroke="url(#gaugeGradient)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(normalizedScore / 100) * 267} 267`} />
          
          <g transform={`rotate(${rotation}, 100, 100)`} style={{ transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <line x1="100" y1="100" x2="100" y2="30" stroke={colors.textPrimary} strokeWidth="3" strokeLinecap="round" />
            <circle cx="100" cy="100" r="8" fill={colors.textPrimary} />
            <circle cx="100" cy="100" r="4" fill={colorInfo.fill} />
          </g>
        </svg>
      </div>
      
      <div className="text-center -mt-4 relative z-10">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-5xl font-black tabular-nums" style={{ color: colors.textPrimary }}>{Math.round(normalizedScore)}</span>
          <span className="text-xl font-medium" style={{ color: colors.textMuted }}>/100</span>
        </div>
        <p className="text-sm font-semibold mt-1" style={{ color: colorInfo.fill }}>{colorInfo.label}</p>
      </div>
    </div>
  );
}

// Glass Card Component
function GlassCard({ children, className = '', glow = false, isDark }) {
  const colors = getColors(isDark);
  return (
    <div className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${className}`}>
      {glow && isDark && (
        <div className="absolute -inset-px bg-gradient-to-b from-[#FF7A1A]/10 to-transparent rounded-2xl pointer-events-none" />
      )}
      <div className="relative h-full rounded-2xl" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
        {children}
      </div>
    </div>
  );
}

// Input Field
function InputField({ label, value, onChange, placeholder, testId, icon: Icon, isDark }) {
  const colors = getColors(isDark);
  return (
    <div className="group relative rounded-xl transition-all duration-200 focus-within:ring-2 focus-within:ring-[#FF7A1A]/50" style={{ backgroundColor: colors.cardInner, border: `1px solid ${colors.border}` }}>
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: colors.card }}>
          <Icon className="w-5 h-5" style={{ color: colors.textSecondary }} />
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-xs font-medium uppercase tracking-wider" style={{ color: colors.textSecondary }}>{label}</label>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="font-semibold" style={{ color: colors.textSecondary }}>$</span>
            <input
              data-testid={testId}
              type="text"
              inputMode="numeric"
              value={formatInput(value)}
              onChange={e => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder={placeholder || '0'}
              className="w-full bg-transparent font-bold text-xl focus:outline-none"
              style={{ color: colors.textPrimary }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Stats Card
function StatsCard({ label, value, icon: Icon, highlight, isDark, subtext }) {
  const colors = getColors(isDark);
  return (
    <div className="relative rounded-xl p-4 transition-all duration-200" style={highlight ? {} : { backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
      {highlight && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF7A1A] to-[#FF9A3C] rounded-xl" />
          <div className="absolute top-2 right-2">
            <Sparkles className="w-4 h-4 text-white/50" />
          </div>
        </>
      )}
      <div className="relative">
        <div className="flex items-center gap-3 mb-2">
          <Icon className="w-5 h-5" style={{ color: highlight ? 'rgba(255,255,255,0.7)' : colors.textSecondary }} />
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: highlight ? 'rgba(255,255,255,0.7)' : colors.textSecondary }}>{label}</span>
        </div>
        <p className="text-2xl font-black" style={{ color: highlight ? '#FFFFFF' : colors.textPrimary }}>{fmt(value)}</p>
        {subtext && <p className="text-xs mt-1" style={{ color: highlight ? 'rgba(255,255,255,0.6)' : colors.textMuted }}>{subtext}</p>}
      </div>
    </div>
  );
}

export default function Calculator({ prefilledValues, isDark, showSaveModal, setShowSaveModal, showSavedDeals, setShowSavedDeals }) {
  const colors = getColors(isDark);
  const [inputs, setInputs] = useState(DEFAULT);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedDeals, setSavedDeals] = useState([]);
  const [dealName, setDealName] = useState('');

  const calcs = useDealCalculator(inputs);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('wholesale_deals') || '[]');
    setSavedDeals(saved);
  }, []);

  useEffect(() => {
    if (prefilledValues?.arv || prefilledValues?.repairCost) {
      setInputs(prev => ({
        ...prev,
        ...(prefilledValues.arv ? { arv: prefilledValues.arv } : {}),
        ...(prefilledValues.repairCost ? { repairCost: prefilledValues.repairCost } : {}),
      }));
      if (prefilledValues.repairCost && !prefilledValues.arv) {
        toast.success('Repair cost synced from Estimator!');
      }
    }
  }, [prefilledValues]);

  useEffect(() => {
    if (showSaveModal && inputs.arv) {
      setDealName(`Deal — ${new Date().toLocaleDateString()}`);
    } else if (showSaveModal && !inputs.arv) {
      toast.error('Enter an ARV value first');
      setShowSaveModal(false);
    }
  }, [showSaveModal, inputs.arv, setShowSaveModal]);

  const setField = (field) => (val) => setInputs(prev => ({ ...prev, [field]: val }));

  const handleReset = () => {
    setInputs(DEFAULT);
    toast.success('Calculator reset');
  };

  const confirmSave = () => {
    const deal = {
      id: Date.now(),
      name: dealName || `Deal ${savedDeals.length + 1}`,
      date: new Date().toISOString(),
      inputs: { ...inputs },
      mao: calcs.mao,
      investorProfit: calcs.investorProfit,
      dealScore: calcs.dealScore.label,
    };
    const updated = [deal, ...savedDeals];
    localStorage.setItem('wholesale_deals', JSON.stringify(updated));
    setSavedDeals(updated);
    setShowSaveModal(false);
    toast.success(`"${deal.name}" saved!`);
  };

  const deleteDeal = (id) => {
    const updated = savedDeals.filter(d => d.id !== id);
    localStorage.setItem('wholesale_deals', JSON.stringify(updated));
    setSavedDeals(updated);
    toast.success('Deal removed');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(26, 29, 36);
    doc.rect(0, 0, 210, 48, 'F');
    doc.setFillColor(255, 122, 26);
    doc.rect(0, 44, 210, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('BuyWise', 14, 22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Wholesale Deal Analysis', 14, 32);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 40);

    let y = 60;
    const section = (title) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(26, 29, 36);
      doc.text(title, 14, y);
      y += 3;
      doc.setFillColor(42, 47, 58);
      doc.rect(14, y, 182, 0.5, 'F');
      y += 8;
    };
    const row = (label, value, bold = false) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(10);
      doc.setTextColor(160, 166, 176);
      doc.text(label, 18, y);
      doc.setTextColor(26, 29, 36);
      doc.text(value, 140, y);
      y += 8;
    };

    section('PROPERTY INPUTS');
    row('After Repair Value:', fmt(parseFloat(inputs.arv) || 0));
    row('Repair Cost:', fmt(parseFloat(inputs.repairCost) || 0));
    row('Assignment Fee:', fmt(parseFloat(inputs.assignmentFee) || 0));
    y += 4;
    section('RESULTS');
    row('70% Rule:', fmt(calcs.rule70));
    row('Maximum Allowable Offer:', fmt(calcs.mao), true);
    row('First Offer:', fmt(calcs.firstOffer));
    row('Investor Profit:', fmt(calcs.investorProfit), true);

    doc.setFontSize(8);
    doc.setTextColor(160, 166, 176);
    doc.text('Generated by BuyWise', 14, 285);
    doc.save('buywise-deal.pdf');
    toast.success('PDF downloaded!');
  };

  const copyToClipboard = async () => {
    const text = `BUYWISE DEAL\n============\nARV: ${fmt(parseFloat(inputs.arv) || 0)}\nRepair: ${fmt(parseFloat(inputs.repairCost) || 0)}\nMAO: ${fmt(calcs.mao)}\nProfit: ${fmt(calcs.investorProfit)}\nScore: ${calcs.dealScore.label || 'N/A'}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied!');
    } catch {
      toast.error('Could not copy');
    }
  };

  const hasValues = parseFloat(inputs.arv) > 0;
  const getDealRatingScore = () => {
    if (!hasValues) return 0;
    return Math.min(100, Math.max(0, (calcs.investorProfitPct || 0) * 4));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Input Panel */}
        <div className="lg:col-span-3 space-y-6">
          <GlassCard glow isDark={isDark}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF7A1A] to-[#FF9A3C] flex items-center justify-center shadow-lg shadow-[#FF7A1A]/20">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: colors.textPrimary }}>Property Details</h3>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>Enter your deal information</p>
                </div>
              </div>

              <div className="space-y-4">
                <InputField label="After Repair Value" value={inputs.arv} onChange={setField('arv')} placeholder="350,000" testId="arv-input" icon={Home} isDark={isDark} />
                <InputField label="Repair Cost" value={inputs.repairCost} onChange={setField('repairCost')} placeholder="50,000" testId="repair-cost-input" icon={DollarSign} isDark={isDark} />
                <InputField label="Assignment Fee" value={inputs.assignmentFee} onChange={setField('assignmentFee')} placeholder="15,000" testId="assignment-fee-input" icon={Tag} isDark={isDark} />
              </div>
            </div>

            {/* Advanced Options */}
            <div style={{ borderTop: `1px solid ${colors.border}` }}>
              <button data-testid="advanced-options-toggle" onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between p-4 transition-colors hover:opacity-80">
                <span className="text-sm font-semibold" style={{ color: colors.textSecondary }}>Advanced Options</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-all" style={{ backgroundColor: showAdvanced ? '#FF7A1A' : colors.cardInner, color: showAdvanced ? '#fff' : colors.textSecondary, transform: showAdvanced ? 'rotate(180deg)' : 'none' }}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>
              {showAdvanced && (
                <div className="p-5 space-y-5" style={{ backgroundColor: colors.cardInner }}>
                  <div className="space-y-3">
                    <label className="text-sm font-medium" style={{ color: colors.textSecondary }}>ARV Rule %</label>
                    <div className="flex items-center gap-4">
                      <input data-testid="arv-rule-percent-slider" type="range" min="60" max="85" step="1"
                        value={inputs.arvRulePercent || 70} onChange={e => setField('arvRulePercent')(e.target.value)}
                        className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-[#FF7A1A]" 
                        style={{ background: `linear-gradient(to right, #FF7A1A ${((inputs.arvRulePercent - 60) / 25) * 100}%, ${colors.border} ${((inputs.arvRulePercent - 60) / 25) * 100}%)` }} />
                      <div className="bg-gradient-to-r from-[#FF7A1A] to-[#FF9A3C] text-white px-3 py-2 min-w-[56px] text-center font-bold rounded-lg text-sm">
                        {inputs.arvRulePercent || 70}%
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium" style={{ color: colors.textSecondary }}>Negotiation Discount</label>
                    <div className="relative">
                      <input data-testid="negotiation-discount-input" type="text" inputMode="numeric"
                        value={inputs.negotiationDiscount} onChange={e => setField('negotiationDiscount')(e.target.value.replace(/[^0-9.]/g, ''))}
                        className="w-full font-semibold text-lg py-3 px-4 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A1A]/50 transition-all"
                        style={{ backgroundColor: colors.card, color: colors.textPrimary, border: `1px solid ${colors.border}` }} />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold" style={{ color: colors.textSecondary }}>%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'reset', icon: RotateCcw, label: 'Reset', onClick: handleReset },
              { id: 'pdf', icon: FileText, label: 'PDF', onClick: exportPDF },
              { id: 'copy', icon: Copy, label: 'Copy', onClick: copyToClipboard },
            ].map(btn => (
              <button key={btn.id} data-testid={`${btn.id}-btn`} onClick={btn.onClick}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-80"
                style={{ backgroundColor: colors.card, color: colors.textPrimary, border: `1px solid ${colors.border}` }}>
                <btn.icon className="w-4 h-4" />
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard isDark={isDark}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF7A1A] to-[#FF9A3C] flex items-center justify-center shadow-lg shadow-[#FF7A1A]/20">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: colors.textPrimary }}>Deal Rating</h3>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>Overall deal quality</p>
                </div>
              </div>
              <DealGauge score={getDealRatingScore()} isDark={isDark} />
            </div>
          </GlassCard>

          <GlassCard isDark={isDark}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: colors.cardInner }}>
                  <ShoppingCart className="w-5 h-5" style={{ color: colors.textSecondary }} />
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: colors.textPrimary }}>Offer Summary</h3>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>Key calculations</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: '70% Rule', value: calcs.rule70, icon: Percent },
                  { label: 'MAO', value: calcs.mao, icon: ShoppingCart, highlight: true },
                  { label: 'First Offer', value: calcs.firstOffer, icon: Tag },
                  { label: 'Buyer Max', value: calcs.buyerPrice, icon: Home },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-xl transition-all"
                    style={item.highlight ? { background: 'linear-gradient(to right, rgba(255,122,26,0.1), rgba(255,154,60,0.1))', border: '1px solid rgba(255,122,26,0.3)' } : { backgroundColor: colors.cardInner }}>
                    <div className="flex items-center gap-2">
                      <item.icon className="w-4 h-4" style={{ color: item.highlight ? '#FF7A1A' : colors.textSecondary }} />
                      <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>{item.label}</span>
                    </div>
                    <span className="font-bold" style={{ color: item.highlight ? '#FF7A1A' : colors.textPrimary }}>{fmt(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Stats Cards at Bottom */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <StatsCard label="After Repair Value" value={parseFloat(inputs.arv) || 0} icon={Home} isDark={isDark} subtext="Target sale price" />
        <StatsCard label="Maximum Allowable Offer" value={calcs.mao} icon={ShoppingCart} highlight isDark={isDark} subtext="Your max purchase price" />
        <StatsCard label="Estimated Profit" value={calcs.investorProfit} icon={TrendingUp} isDark={isDark} subtext={`${calcs.investorProfitPct.toFixed(1)}% margin`} />
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSaveModal(false)}>
          <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-xl" style={{ color: colors.textPrimary }}>Save Deal</h3>
              <button onClick={() => setShowSaveModal(false)} className="p-2 rounded-xl transition-colors hover:opacity-80" style={{ backgroundColor: colors.cardInner }}>
                <X className="w-5 h-5" style={{ color: colors.textSecondary }} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Deal Name</label>
                <input type="text" data-testid="deal-name-input" value={dealName} onChange={e => setDealName(e.target.value)} onKeyDown={e => e.key === 'Enter' && confirmSave()}
                  className="w-full font-semibold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A1A]/50"
                  style={{ backgroundColor: colors.cardInner, color: colors.textPrimary, border: `1px solid ${colors.border}` }} autoFocus />
              </div>
              <div className="p-4 rounded-xl space-y-2" style={{ backgroundColor: colors.cardInner }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: colors.textSecondary }}>MAO</span>
                  <strong className="text-[#FF7A1A]">{fmt(calcs.mao)}</strong>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: colors.textSecondary }}>Score</span>
                  <strong style={{ color: calcs.dealScore.color === 'green' ? '#22c55e' : calcs.dealScore.color === 'yellow' ? '#eab308' : '#ef4444' }}>
                    {calcs.dealScore.label || 'N/A'}
                  </strong>
                </div>
              </div>
              <div className="flex gap-3">
                <button data-testid="confirm-save-btn" onClick={confirmSave} className="flex-1 bg-gradient-to-r from-[#FF7A1A] to-[#FF9A3C] text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-[#FF7A1A]/30 transition-all">
                  Save Deal
                </button>
                <button onClick={() => setShowSaveModal(false)} className="px-6 font-bold py-3 rounded-xl transition-all hover:opacity-80"
                  style={{ backgroundColor: colors.cardInner, color: colors.textSecondary }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved Deals Modal */}
      {showSavedDeals && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSavedDeals(false)}>
          <div className="rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${colors.border}` }}>
              <h3 className="font-bold text-xl" style={{ color: colors.textPrimary }}>
                Saved Deals <span className="text-[#FF7A1A]">({savedDeals.length})</span>
              </h3>
              <button data-testid="close-saved-deals-btn" onClick={() => setShowSavedDeals(false)} className="p-2 rounded-xl transition-colors hover:opacity-80" style={{ backgroundColor: colors.cardInner }}>
                <X className="w-5 h-5" style={{ color: colors.textSecondary }} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {savedDeals.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="w-12 h-12 mx-auto mb-3" style={{ color: colors.border }} />
                  <p className="font-medium" style={{ color: colors.textSecondary }}>No saved deals yet</p>
                </div>
              ) : (
                savedDeals.map(deal => (
                  <div key={deal.id} data-testid="saved-deal-item" className="p-4 rounded-xl flex items-center justify-between transition-colors hover:opacity-90" style={{ backgroundColor: colors.cardInner }}>
                    <div className="min-w-0">
                      <p className="font-bold truncate" style={{ color: colors.textPrimary }}>{deal.name}</p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>{new Date(deal.date).toLocaleDateString()}</p>
                      <p className="text-sm mt-1">MAO: <strong className="text-[#FF7A1A]">{fmt(deal.mao)}</strong></p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        deal.dealScore === 'Excellent Deal' ? 'bg-green-500/20 text-green-400' 
                        : deal.dealScore === 'Average Deal' ? 'bg-yellow-500/20 text-yellow-400' 
                        : 'bg-red-500/20 text-red-400'
                      }`}>{deal.dealScore || 'N/A'}</span>
                      <button data-testid="delete-deal-btn" onClick={() => deleteDeal(deal.id)} className="p-2 rounded-xl transition-colors hover:bg-red-500/20 hover:text-red-500">
                        <X className="w-4 h-4" style={{ color: colors.textSecondary }} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
