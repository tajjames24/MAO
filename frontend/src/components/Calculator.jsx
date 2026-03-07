import React, { useState, useEffect } from 'react';
import { useDealCalculator } from '../hooks/useDealCalculator';
import {
  ChevronDown, ChevronUp, Save, RotateCcw,
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

// Premium Deal Rating Gauge
function DealGauge({ score, isDark }) {
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
              <stop offset="0%" stopColor={isDark ? '#1A1D24' : '#E5E7EB'} />
              <stop offset="100%" stopColor={isDark ? '#1A1D24' : '#E5E7EB'} />
            </linearGradient>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <path d="M 15 100 A 85 85 0 0 1 185 100" fill="none" stroke="url(#bgGradient)" strokeWidth="12" strokeLinecap="round" />
          <path d="M 15 100 A 85 85 0 0 1 185 100" fill="none" stroke="url(#gaugeGradient)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(normalizedScore / 100) * 267} 267`} filter="url(#glow)" />
          
          <g transform={`rotate(${rotation}, 100, 100)`} style={{ transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <line x1="100" y1="100" x2="100" y2="30" stroke={isDark ? '#E5E5E5' : '#1A1D24'} strokeWidth="3" strokeLinecap="round" />
            <circle cx="100" cy="100" r="8" fill={isDark ? '#E5E5E5' : '#1A1D24'} />
            <circle cx="100" cy="100" r="4" fill={colorInfo.fill} />
          </g>
        </svg>
      </div>
      
      <div className="text-center -mt-4 relative z-10">
        <div className="flex items-baseline justify-center gap-1">
          <span className={`text-5xl font-black tabular-nums ${isDark ? 'text-[#E5E5E5]' : 'text-gray-900'}`}>{Math.round(normalizedScore)}</span>
          <span className={`text-xl font-medium ${isDark ? 'text-[#4B5563]' : 'text-gray-400'}`}>/100</span>
        </div>
        <p className="text-sm font-semibold mt-1" style={{ color: colorInfo.fill }}>{colorInfo.label}</p>
      </div>
    </div>
  );
}

// Glass Card Component
function GlassCard({ children, className = '', glow = false, isDark }) {
  return (
    <div className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${className}`}>
      {glow && isDark && (
        <div className="absolute -inset-px bg-gradient-to-b from-[#FF7A1A]/20 to-transparent rounded-2xl pointer-events-none" />
      )}
      <div className={`relative h-full ${isDark ? 'bg-[#1A1D24] border border-[#252830]' : 'bg-white border border-gray-200 shadow-xl shadow-gray-200/50'} rounded-2xl`}>
        {children}
      </div>
    </div>
  );
}

// Input Field with Icon
function InputField({ label, value, onChange, placeholder, testId, icon: Icon, isDark }) {
  return (
    <div className={`group relative rounded-xl transition-all duration-200 ${isDark ? 'bg-[#0F1115] border border-[#252830] hover:border-[#FF7A1A]/50 focus-within:border-[#FF7A1A] focus-within:shadow-lg focus-within:shadow-[#FF7A1A]/10' : 'bg-gray-50 border border-gray-200 hover:border-gray-300 focus-within:border-[#FF7A1A] focus-within:shadow-lg focus-within:shadow-[#FF7A1A]/10'}`}>
      <div className="flex items-center gap-3 p-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isDark ? 'bg-[#1A1D24] group-focus-within:bg-[#FF7A1A]/20' : 'bg-gray-100 group-focus-within:bg-[#FF7A1A]/10'}`}>
          <Icon className={`w-5 h-5 transition-colors ${isDark ? 'text-[#6B7280] group-focus-within:text-[#FF7A1A]' : 'text-gray-400 group-focus-within:text-[#FF7A1A]'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <label className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-[#6B7280]' : 'text-gray-500'}`}>{label}</label>
          <div className="flex items-center gap-1 mt-0.5">
            <span className={`font-semibold ${isDark ? 'text-[#6B7280]' : 'text-gray-400'}`}>$</span>
            <input
              data-testid={testId}
              type="text"
              inputMode="numeric"
              value={formatInput(value)}
              onChange={e => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder={placeholder || '0'}
              className={`w-full bg-transparent font-bold text-xl focus:outline-none placeholder:opacity-30 ${isDark ? 'text-[#E5E5E5] placeholder:text-[#4B5563]' : 'text-gray-900 placeholder:text-gray-400'}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Stats Card Component
function StatsCard({ label, value, icon: Icon, highlight, isDark, subtext }) {
  return (
    <div className={`relative rounded-xl p-4 transition-all duration-200 ${highlight 
      ? 'bg-gradient-to-br from-[#FF7A1A] to-[#FF9A3C] shadow-lg shadow-[#FF7A1A]/30' 
      : isDark ? 'bg-[#1A1D24] border border-[#252830]' : 'bg-white border border-gray-100 shadow-sm'}`}>
      {highlight && (
        <div className="absolute top-2 right-2">
          <Sparkles className="w-4 h-4 text-white/50" />
        </div>
      )}
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-5 h-5 ${highlight ? 'text-white/70' : isDark ? 'text-[#6B7280]' : 'text-gray-400'}`} />
        <span className={`text-xs font-medium uppercase tracking-wider ${highlight ? 'text-white/70' : isDark ? 'text-[#6B7280]' : 'text-gray-500'}`}>{label}</span>
      </div>
      <p className={`text-2xl font-black ${highlight ? 'text-white' : isDark ? 'text-[#E5E5E5]' : 'text-gray-900'}`}>{fmt(value)}</p>
      {subtext && <p className={`text-xs mt-1 ${highlight ? 'text-white/60' : isDark ? 'text-[#4B5563]' : 'text-gray-400'}`}>{subtext}</p>}
    </div>
  );
}

export default function Calculator({ prefilledValues, isDark }) {
  const [inputs, setInputs] = useState(DEFAULT);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedDeals, setSavedDeals] = useState([]);
  const [showSavedDeals, setShowSavedDeals] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
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

  const setField = (field) => (val) => setInputs(prev => ({ ...prev, [field]: val }));

  const handleReset = () => {
    setInputs(DEFAULT);
    toast.success('Calculator reset');
  };

  const handleSaveDeal = () => {
    if (!inputs.arv) { toast.error('Enter an ARV value first'); return; }
    setDealName(`Deal — ${new Date().toLocaleDateString()}`);
    setShowSaveModal(true);
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
    const OG = [255, 122, 26];
    const DARK = [26, 29, 36];
    const WHITE = [255, 255, 255];
    const GRAY = [160, 166, 176];

    doc.setFillColor(...DARK);
    doc.rect(0, 0, 210, 48, 'F');
    doc.setFillColor(...OG);
    doc.rect(0, 44, 210, 4, 'F');
    doc.setTextColor(...WHITE);
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
      doc.setTextColor(...DARK);
      doc.text(title, 14, y);
      y += 3;
      doc.setFillColor(42, 47, 58);
      doc.rect(14, y, 182, 0.5, 'F');
      y += 8;
    };

    const row = (label, value, bold = false) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...GRAY);
      doc.text(label, 18, y);
      doc.setTextColor(...DARK);
      doc.text(value, 140, y);
      y += 8;
    };

    section('PROPERTY INPUTS');
    row('After Repair Value (ARV):', fmt(parseFloat(inputs.arv) || 0));
    row('Repair Cost:', fmt(parseFloat(inputs.repairCost) || 0));
    row('Assignment Fee:', fmt(parseFloat(inputs.assignmentFee) || 0));

    y += 4;
    section('CALCULATED RESULTS');
    row('70% Rule Value:', fmt(calcs.rule70));
    row('Maximum Allowable Offer:', fmt(calcs.mao), true);
    row('First Offer:', fmt(calcs.firstOffer));
    row('Buyer Max Purchase:', fmt(calcs.buyerPrice));
    row('Investor Profit:', fmt(calcs.investorProfit), true);

    doc.setFontSize(8);
    doc.setTextColor(160, 166, 176);
    doc.text('Generated by BuyWise — Professional Wholesale Deal Analyzer', 14, 285);

    doc.save('buywise-deal-analysis.pdf');
    toast.success('PDF downloaded!');
  };

  const copyToClipboard = async () => {
    const text = `BUYWISE DEAL SUMMARY
==================
ARV: ${fmt(parseFloat(inputs.arv) || 0)}
Repair Cost: ${fmt(parseFloat(inputs.repairCost) || 0)}
Assignment Fee: ${fmt(parseFloat(inputs.assignmentFee) || 0)}

RESULTS:
MAO: ${fmt(calcs.mao)}
First Offer: ${fmt(calcs.firstOffer)}
Investor Profit: ${fmt(calcs.investorProfit)}
Deal Score: ${calcs.dealScore.label || 'N/A'}
`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Could not copy');
    }
  };

  const hasValues = parseFloat(inputs.arv) > 0;
  const getDealRatingScore = () => {
    if (!hasValues) return 0;
    const profitPct = calcs.investorProfitPct || 0;
    return Math.min(100, Math.max(0, profitPct * 4));
  };

  return (
    <div className="space-y-6">
      {/* TOP: Save Deal & Saved Deals Buttons */}
      <div className="flex items-center justify-between">
        <button data-testid="save-deal-btn" onClick={handleSaveDeal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#FF7A1A] to-[#FF9A3C] text-white hover:shadow-lg hover:shadow-[#FF7A1A]/30 transition-all duration-200">
          <Save className="w-4 h-4" />
          Save Deal
        </button>
        <button data-testid="saved-deals-header-btn" onClick={() => setShowSavedDeals(true)}
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 ${isDark ? 'text-[#6B7280] hover:text-[#E5E5E5] hover:bg-[#1A1D24]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
          <BookOpen className="w-4 h-4" />
          <span>Saved Deals</span>
          {savedDeals.length > 0 && (
            <span className="bg-[#FF7A1A] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{savedDeals.length}</span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Input Panel (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <GlassCard glow isDark={isDark}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF7A1A] to-[#FF9A3C] flex items-center justify-center shadow-lg shadow-[#FF7A1A]/20">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${isDark ? 'text-[#E5E5E5]' : 'text-gray-900'}`}>Property Details</h3>
                  <p className={`text-xs ${isDark ? 'text-[#6B7280]' : 'text-gray-500'}`}>Enter your deal information</p>
                </div>
              </div>

              <div className="space-y-4">
                <InputField label="After Repair Value" value={inputs.arv} onChange={setField('arv')} placeholder="350,000" testId="arv-input" icon={Home} isDark={isDark} />
                <InputField label="Repair Cost" value={inputs.repairCost} onChange={setField('repairCost')} placeholder="50,000" testId="repair-cost-input" icon={DollarSign} isDark={isDark} />
                <InputField label="Assignment Fee" value={inputs.assignmentFee} onChange={setField('assignmentFee')} placeholder="15,000" testId="assignment-fee-input" icon={Tag} isDark={isDark} />
              </div>
            </div>

            {/* Advanced Options */}
            <div className={`border-t ${isDark ? 'border-[#252830]' : 'border-gray-200'}`}>
              <button data-testid="advanced-options-toggle" onClick={() => setShowAdvanced(!showAdvanced)}
                className={`w-full flex items-center justify-between p-4 transition-colors ${isDark ? 'hover:bg-[#0F1115]' : 'hover:bg-gray-50'}`}>
                <span className={`text-sm font-semibold ${isDark ? 'text-[#6B7280]' : 'text-gray-600'}`}>Advanced Options</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${showAdvanced ? 'bg-[#FF7A1A] text-white rotate-180' : isDark ? 'bg-[#0F1115] text-[#6B7280]' : 'bg-gray-100 text-gray-400'}`}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>
              {showAdvanced && (
                <div className={`p-5 space-y-5 ${isDark ? 'bg-[#0F1115]' : 'bg-gray-50'}`}>
                  <div className="space-y-3">
                    <label className={`text-sm font-medium ${isDark ? 'text-[#6B7280]' : 'text-gray-600'}`}>ARV Rule %</label>
                    <div className="flex items-center gap-4">
                      <input data-testid="arv-rule-percent-slider" type="range" min="60" max="85" step="1"
                        value={inputs.arvRulePercent || 70} onChange={e => setField('arvRulePercent')(e.target.value)}
                        className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-[#FF7A1A]" 
                        style={{ background: isDark ? `linear-gradient(to right, #FF7A1A ${((inputs.arvRulePercent - 60) / 25) * 100}%, #252830 ${((inputs.arvRulePercent - 60) / 25) * 100}%)` : `linear-gradient(to right, #FF7A1A ${((inputs.arvRulePercent - 60) / 25) * 100}%, #E5E7EB ${((inputs.arvRulePercent - 60) / 25) * 100}%)` }} />
                      <div className="bg-gradient-to-r from-[#FF7A1A] to-[#FF9A3C] text-white px-3 py-2 min-w-[56px] text-center font-bold rounded-lg text-sm">
                        {inputs.arvRulePercent || 70}%
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className={`text-sm font-medium ${isDark ? 'text-[#6B7280]' : 'text-gray-600'}`}>Negotiation Discount</label>
                    <div className="relative">
                      <input data-testid="negotiation-discount-input" type="text" inputMode="numeric"
                        value={inputs.negotiationDiscount} onChange={e => setField('negotiationDiscount')(e.target.value.replace(/[^0-9.]/g, ''))}
                        className={`w-full font-semibold text-lg py-3 px-4 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A1A] transition-all ${isDark ? 'bg-[#1A1D24] text-[#E5E5E5] border border-[#252830]' : 'bg-white text-gray-900 border border-gray-200'}`} />
                      <span className={`absolute right-4 top-1/2 -translate-y-1/2 font-bold ${isDark ? 'text-[#6B7280]' : 'text-gray-400'}`}>%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button data-testid="reset-btn" onClick={handleReset}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${isDark ? 'bg-[#1A1D24] text-[#6B7280] hover:text-[#E5E5E5] hover:bg-[#252830] border border-[#252830]' : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-sm'}`}>
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button data-testid="export-pdf-btn" onClick={exportPDF}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${isDark ? 'bg-[#1A1D24] text-[#6B7280] hover:text-[#E5E5E5] hover:bg-[#252830] border border-[#252830]' : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-sm'}`}>
              <FileText className="w-4 h-4" />
              Export PDF
            </button>
            <button data-testid="copy-clipboard-btn" onClick={copyToClipboard}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${isDark ? 'bg-[#1A1D24] text-[#6B7280] hover:text-[#E5E5E5] hover:bg-[#252830] border border-[#252830]' : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-sm'}`}>
              <Copy className="w-4 h-4" />
              Copy
            </button>
          </div>
        </div>

        {/* Right: Results Panel (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deal Rating */}
          <GlassCard isDark={isDark}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF7A1A] to-[#FF9A3C] flex items-center justify-center shadow-lg shadow-[#FF7A1A]/20">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${isDark ? 'text-[#E5E5E5]' : 'text-gray-900'}`}>Deal Rating</h3>
                  <p className={`text-xs ${isDark ? 'text-[#6B7280]' : 'text-gray-500'}`}>Overall deal quality</p>
                </div>
              </div>
              
              <DealGauge score={getDealRatingScore()} isDark={isDark} />
            </div>
          </GlassCard>

          {/* Offer Summary */}
          <GlassCard isDark={isDark}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#0F1115]' : 'bg-gray-100'}`}>
                  <ShoppingCart className={`w-5 h-5 ${isDark ? 'text-[#6B7280]' : 'text-gray-500'}`} />
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${isDark ? 'text-[#E5E5E5]' : 'text-gray-900'}`}>Offer Summary</h3>
                  <p className={`text-xs ${isDark ? 'text-[#6B7280]' : 'text-gray-500'}`}>Key calculations</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: '70% Rule', value: calcs.rule70, icon: Percent },
                  { label: 'MAO', value: calcs.mao, icon: ShoppingCart, highlight: true },
                  { label: 'First Offer', value: calcs.firstOffer, icon: Tag },
                  { label: 'Buyer Max', value: calcs.buyerPrice, icon: Home },
                ].map(item => (
                  <div key={item.label} className={`flex items-center justify-between p-3 rounded-xl transition-all ${item.highlight ? 'bg-gradient-to-r from-[#FF7A1A]/10 to-[#FF9A3C]/10 border border-[#FF7A1A]/30' : isDark ? 'bg-[#0F1115]' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2">
                      <item.icon className={`w-4 h-4 ${item.highlight ? 'text-[#FF7A1A]' : isDark ? 'text-[#6B7280]' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${isDark ? 'text-[#6B7280]' : 'text-gray-600'}`}>{item.label}</span>
                    </div>
                    <span className={`font-bold ${item.highlight ? 'text-[#FF7A1A]' : isDark ? 'text-[#E5E5E5]' : 'text-gray-900'}`}>{fmt(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* BOTTOM: Stats Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <StatsCard label="After Repair Value" value={parseFloat(inputs.arv) || 0} icon={Home} isDark={isDark} subtext="Target sale price" />
        <StatsCard label="Maximum Allowable Offer" value={calcs.mao} icon={ShoppingCart} highlight isDark={isDark} subtext="Your max purchase price" />
        <StatsCard label="Estimated Profit" value={calcs.investorProfit} icon={TrendingUp} isDark={isDark} subtext={`${calcs.investorProfitPct.toFixed(1)}% margin`} />
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSaveModal(false)}>
          <div className={`rounded-2xl p-6 w-full max-w-md shadow-2xl ${isDark ? 'bg-[#1A1D24] border border-[#252830]' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`font-bold text-xl ${isDark ? 'text-[#E5E5E5]' : 'text-gray-900'}`}>Save Deal</h3>
              <button onClick={() => setShowSaveModal(false)} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-[#0F1115]' : 'hover:bg-gray-100'}`}>
                <X className={`w-5 h-5 ${isDark ? 'text-[#6B7280]' : 'text-gray-500'}`} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#6B7280]' : 'text-gray-600'}`}>Deal Name</label>
                <input type="text" data-testid="deal-name-input" value={dealName} onChange={e => setDealName(e.target.value)} onKeyDown={e => e.key === 'Enter' && confirmSave()}
                  className={`w-full font-semibold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A1A] ${isDark ? 'bg-[#0F1115] text-[#E5E5E5] border border-[#252830]' : 'bg-gray-50 text-gray-900 border border-gray-200'}`} autoFocus />
              </div>
              <div className={`p-4 rounded-xl space-y-2 ${isDark ? 'bg-[#0F1115]' : 'bg-gray-50'}`}>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-[#6B7280]' : 'text-gray-500'}>MAO</span>
                  <strong className="text-[#FF7A1A]">{fmt(calcs.mao)}</strong>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-[#6B7280]' : 'text-gray-500'}>Score</span>
                  <strong className={calcs.dealScore.color === 'green' ? 'text-green-500' : calcs.dealScore.color === 'yellow' ? 'text-yellow-500' : 'text-red-500'}>
                    {calcs.dealScore.label || 'N/A'}
                  </strong>
                </div>
              </div>
              <div className="flex gap-3">
                <button data-testid="confirm-save-btn" onClick={confirmSave} className="flex-1 bg-gradient-to-r from-[#FF7A1A] to-[#FF9A3C] text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-[#FF7A1A]/30 transition-all">
                  Save Deal
                </button>
                <button onClick={() => setShowSaveModal(false)} className={`px-6 font-bold py-3 rounded-xl transition-all ${isDark ? 'bg-[#0F1115] text-[#6B7280] hover:bg-[#252830]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
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
          <div className={`rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl ${isDark ? 'bg-[#1A1D24] border border-[#252830]' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-[#252830]' : 'border-gray-200'}`}>
              <h3 className={`font-bold text-xl ${isDark ? 'text-[#E5E5E5]' : 'text-gray-900'}`}>
                Saved Deals <span className="text-[#FF7A1A]">({savedDeals.length})</span>
              </h3>
              <button data-testid="close-saved-deals-btn" onClick={() => setShowSavedDeals(false)} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-[#0F1115]' : 'hover:bg-gray-100'}`}>
                <X className={`w-5 h-5 ${isDark ? 'text-[#6B7280]' : 'text-gray-500'}`} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {savedDeals.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-[#252830]' : 'text-gray-300'}`} />
                  <p className={`font-medium ${isDark ? 'text-[#6B7280]' : 'text-gray-400'}`}>No saved deals yet</p>
                </div>
              ) : (
                savedDeals.map(deal => (
                  <div key={deal.id} data-testid="saved-deal-item" className={`p-4 rounded-xl flex items-center justify-between transition-colors ${isDark ? 'bg-[#0F1115] hover:bg-[#0F1115]/80' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    <div className="min-w-0">
                      <p className={`font-bold truncate ${isDark ? 'text-[#E5E5E5]' : 'text-gray-900'}`}>{deal.name}</p>
                      <p className={`text-xs ${isDark ? 'text-[#6B7280]' : 'text-gray-500'}`}>{new Date(deal.date).toLocaleDateString()}</p>
                      <p className="text-sm mt-1">MAO: <strong className="text-[#FF7A1A]">{fmt(deal.mao)}</strong></p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        deal.dealScore === 'Excellent Deal' ? 'bg-green-500/20 text-green-400' 
                        : deal.dealScore === 'Average Deal' ? 'bg-yellow-500/20 text-yellow-400' 
                        : 'bg-red-500/20 text-red-400'
                      }`}>{deal.dealScore || 'N/A'}</span>
                      <button data-testid="delete-deal-btn" onClick={() => deleteDeal(deal.id)} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-50'} hover:text-red-500`}>
                        <X className={`w-4 h-4 ${isDark ? 'text-[#6B7280]' : 'text-gray-500'}`} />
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
