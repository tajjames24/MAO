import React, { useState, useEffect } from 'react';
import { useDealCalculator } from '../hooks/useDealCalculator';
import {
  ChevronDown, ChevronUp, Save, RotateCcw,
  BookOpen, Copy, FileText, X, Info, Home, DollarSign, 
  TrendingUp, Tag, ShoppingCart, Percent
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

// Deal Rating Gauge Component
function DealGauge({ score, label, isDark }) {
  // Score ranges from 0-100
  const normalizedScore = Math.min(100, Math.max(0, score));
  const rotation = (normalizedScore / 100) * 180 - 90; // -90 to 90 degrees
  
  // Color based on score
  const getColor = () => {
    if (normalizedScore >= 70) return { fill: '#22c55e', label: 'Great Deal' };
    if (normalizedScore >= 40) return { fill: '#eab308', label: 'Average Deal' };
    return { fill: '#ef4444', label: 'Bad Deal' };
  };
  
  const colorInfo = getColor();
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-20 overflow-hidden">
        {/* Background arc */}
        <div className={`absolute inset-0 ${isDark ? 'opacity-20' : 'opacity-30'}`}>
          <svg viewBox="0 0 200 100" className="w-full h-full">
            <path
              d="M 10 100 A 90 90 0 0 1 190 100"
              fill="none"
              stroke={isDark ? '#ffffff' : '#000000'}
              strokeWidth="20"
              strokeLinecap="round"
            />
          </svg>
        </div>
        {/* Colored arc */}
        <div className="absolute inset-0">
          <svg viewBox="0 0 200 100" className="w-full h-full">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
            <path
              d="M 10 100 A 90 90 0 0 1 190 100"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="20"
              strokeLinecap="round"
              strokeDasharray={`${(normalizedScore / 100) * 283} 283`}
            />
          </svg>
        </div>
        {/* Needle */}
        <div 
          className="absolute bottom-0 left-1/2 origin-bottom"
          style={{ 
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            transition: 'transform 0.5s ease-out'
          }}
        >
          <div className={`w-1 h-16 rounded-full ${isDark ? 'bg-white' : 'bg-gray-900'}`} />
        </div>
        {/* Center dot */}
        <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full ${isDark ? 'bg-white' : 'bg-gray-900'}`} />
      </div>
      {/* Score display */}
      <div className="text-center -mt-2">
        <span className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{Math.round(normalizedScore)}</span>
        <span className={`text-lg ${isDark ? 'text-white/50' : 'text-gray-400'}`}>/100</span>
      </div>
      <p className={`text-sm font-semibold mt-1`} style={{ color: colorInfo.fill }}>{colorInfo.label}</p>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, testId, icon: Icon, isDark }) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl transition-all ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-[#FF7A00]/20' : 'bg-[#FF7A00]/10'}`}>
        <Icon className="w-5 h-5 text-[#FF7A00]" />
      </div>
      <div className="flex-1 min-w-0">
        <label className={`text-xs font-medium ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{label}</label>
        <div className="relative">
          <span className={`absolute left-0 top-1/2 -translate-y-1/2 font-semibold ${isDark ? 'text-white/40' : 'text-gray-400'}`}>$</span>
          <input
            data-testid={testId}
            type="text"
            inputMode="numeric"
            value={formatInput(value)}
            onChange={e => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder={placeholder || '0'}
            className={`w-full bg-transparent font-bold text-lg pl-4 focus:outline-none placeholder:opacity-40 ${isDark ? 'text-white placeholder:text-white' : 'text-gray-900 placeholder:text-gray-400'}`}
          />
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, icon: Icon, highlight, isDark }) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${highlight ? 'text-[#FF7A00]' : isDark ? 'text-white/40' : 'text-gray-400'}`} />
        <span className={`font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{label}</span>
      </div>
      <span className={`font-bold text-lg ${highlight ? 'text-[#FF7A00]' : isDark ? 'text-white' : 'text-gray-900'}`}>{fmt(value)}</span>
    </div>
  );
}

export default function Calculator({ prefilledValues, isDark, onToggleDark }) {
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
      } else if (prefilledValues.arv) {
        toast.success('Values loaded!');
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
    const OG = [255, 122, 0];
    const DARK = [26, 26, 26];
    const WHITE = [255, 255, 255];
    const GRAY = [100, 100, 100];

    doc.setFillColor(...OG);
    doc.rect(0, 0, 210, 48, 'F');
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('BUYWISE — WHOLESALE OFFER CALCULATOR', 14, 19);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Deal Analysis Summary', 14, 29);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 37);

    let y = 56;

    const scColor = calcs.dealScore.color === 'green' ? [22,163,74] : calcs.dealScore.color === 'yellow' ? [202,138,4] : calcs.dealScore.color === 'red' ? [220,38,38] : [120,120,120];
    doc.setFillColor(...scColor);
    doc.roundedRect(14, y - 6, 85, 12, 2, 2, 'F');
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`DEAL SCORE: ${(calcs.dealScore.label || 'N/A').toUpperCase()}`, 18, y + 1.5);

    y += 18;
    doc.setTextColor(...DARK);

    const section = (title) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...DARK);
      doc.text(title, 14, y);
      y += 3;
      doc.setFillColor(220, 220, 220);
      doc.rect(14, y, 182, 0.5, 'F');
      y += 7;
    };

    const row = (label, value, bold = false) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...GRAY);
      doc.text(label, 18, y);
      doc.setTextColor(...DARK);
      doc.text(value, 140, y);
      y += 7.5;
    };

    section('PROPERTY INPUTS');
    row('After Repair Value (ARV):', fmt(parseFloat(inputs.arv) || 0));
    row('Repair Cost:', fmt(parseFloat(inputs.repairCost) || 0));
    row('Assignment Fee:', fmt(parseFloat(inputs.assignmentFee) || 0));
    row('ARV Rule Percentage:', `${inputs.arvRulePercent || 70}%`);
    row('Negotiation Discount:', `${inputs.negotiationDiscount || 10}%`);

    y += 4;
    section('CALCULATED RESULTS');
    row('70% Rule Value:', fmt(calcs.rule70));
    row('Maximum Allowable Offer (MAO):', fmt(calcs.mao), true);
    row('First Offer (Anchor):', fmt(calcs.firstOffer));
    row('Buyer Max Purchase Price:', fmt(calcs.buyerPrice));
    row('Assignment Fee:', fmt(parseFloat(inputs.assignmentFee) || 0));
    row('Investor Profit Estimate:', fmt(calcs.investorProfit), true);

    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text('Generated by Buywise — Wholesale Offer Calculator | Quick Deal Analyzer for Real Estate Wholesalers', 14, 285);

    doc.save('wholesale-deal-analysis.pdf');
    toast.success('PDF downloaded!');
  };

  const copyToClipboard = async () => {
    const text = `BUYWISE — WHOLESALE DEAL SUMMARY
======================
Date: ${new Date().toLocaleDateString()}

INPUTS:
After Repair Value (ARV): ${fmt(parseFloat(inputs.arv) || 0)}
Repair Cost:              ${fmt(parseFloat(inputs.repairCost) || 0)}
Assignment Fee:           ${fmt(parseFloat(inputs.assignmentFee) || 0)}
ARV Rule:                 ${inputs.arvRulePercent || 70}%
Negotiation Discount:     ${inputs.negotiationDiscount || 10}%

RESULTS:
70% Rule Value:           ${fmt(calcs.rule70)}
Max Allowable Offer (MAO):${fmt(calcs.mao)}
First Offer (Anchor):     ${fmt(calcs.firstOffer)}
Buyer Max Purchase Price: ${fmt(calcs.buyerPrice)}
Assignment Fee:           ${fmt(parseFloat(inputs.assignmentFee) || 0)}
Investor Profit Estimate: ${fmt(calcs.investorProfit)}

DEAL SCORE: ${(calcs.dealScore.label || 'N/A').toUpperCase()}
`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Could not copy — try exporting as PDF');
    }
  };

  const hasValues = parseFloat(inputs.arv) > 0;
  
  // Calculate deal rating score (0-100)
  const getDealRatingScore = () => {
    if (!hasValues) return 0;
    const profitPct = calcs.investorProfitPct || 0;
    // Score based on profit percentage: 25%+ = 100, 0% = 0
    return Math.min(100, Math.max(0, profitPct * 4));
  };

  return (
    <div className="space-y-6">
      {/* Saved Deals Button */}
      <div className="flex justify-end">
        <button data-testid="saved-deals-header-btn" onClick={() => setShowSavedDeals(true)}
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full transition-all ${isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
          <BookOpen className="w-4 h-4" />
          <span>Saved Deals</span>
          {savedDeals.length > 0 && (
            <span className="bg-[#FF7A00] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{savedDeals.length}</span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── LEFT: INPUT PANEL ─── */}
        <div className="space-y-6">
          {/* Property Info Card */}
          <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gradient-to-br from-[#1a1a2e] to-[#16213e]' : 'bg-gradient-to-br from-white to-gray-50'} border ${isDark ? 'border-white/10' : 'border-gray-200'} shadow-xl`}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#FF7A00]/20' : 'bg-[#FF7A00]/10'}`}>
                  <Home className="w-5 h-5 text-[#FF7A00]" />
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Property Info</h3>
                  <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Enter deal details</p>
                </div>
              </div>

              <div className="space-y-3">
                <InputField label="After Repair Value" value={inputs.arv} onChange={setField('arv')} placeholder="350,000" testId="arv-input" icon={Home} isDark={isDark} />
                <InputField label="Repair Cost" value={inputs.repairCost} onChange={setField('repairCost')} placeholder="50,000" testId="repair-cost-input" icon={DollarSign} isDark={isDark} />
                <InputField label="Assignment Fee" value={inputs.assignmentFee} onChange={setField('assignmentFee')} placeholder="15,000" testId="assignment-fee-input" icon={Tag} isDark={isDark} />
              </div>
            </div>

            {/* Advanced Options */}
            <div className={`border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <button data-testid="advanced-options-toggle" onClick={() => setShowAdvanced(!showAdvanced)}
                className={`w-full flex items-center justify-between p-4 transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                <span className={`text-sm font-semibold ${isDark ? 'text-white/70' : 'text-gray-600'}`}>Advanced Options</span>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                  {showAdvanced ? <ChevronUp className="w-4 h-4 text-[#FF7A00]" /> : <ChevronDown className="w-4 h-4 text-[#FF7A00]" />}
                </div>
              </button>
              {showAdvanced && (
                <div className={`p-5 space-y-5 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>ARV Rule Percentage</label>
                    <div className="flex items-center gap-4">
                      <input data-testid="arv-rule-percent-slider" type="range" min="60" max="85" step="1"
                        value={inputs.arvRulePercent || 70} onChange={e => setField('arvRulePercent')(e.target.value)}
                        className="flex-1 h-2 accent-[#FF7A00] cursor-pointer" />
                      <div className="bg-[#FF7A00] text-white px-3 py-2 min-w-[60px] text-center font-bold rounded-lg">
                        {inputs.arvRulePercent || 70}%
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>Negotiation Discount</label>
                    <div className="relative">
                      <input data-testid="negotiation-discount-input" type="text" inputMode="numeric"
                        value={inputs.negotiationDiscount} onChange={e => setField('negotiationDiscount')(e.target.value.replace(/[^0-9.]/g, ''))}
                        className={`w-full font-semibold text-lg py-3 px-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A00] ${isDark ? 'bg-white/10 text-white' : 'bg-white text-gray-900 border border-gray-200'}`} />
                      <span className={`absolute right-4 top-1/2 -translate-y-1/2 font-bold ${isDark ? 'text-white/40' : 'text-gray-400'}`}>%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button data-testid="reset-btn" onClick={handleReset}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button data-testid="save-deal-btn" onClick={handleSaveDeal}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm bg-[#FF7A00] text-white hover:bg-[#E66E00] transition-all">
              <Save className="w-4 h-4" />
              Save Deal
            </button>
            <button data-testid="export-pdf-btn" onClick={exportPDF}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              <FileText className="w-4 h-4" />
              Export PDF
            </button>
            <button data-testid="copy-clipboard-btn" onClick={copyToClipboard}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              <Copy className="w-4 h-4" />
              Copy
            </button>
          </div>
        </div>

        {/* ─── RIGHT: RESULTS PANEL ─── */}
        <div className="space-y-6">
          {/* Offer Summary Card */}
          <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gradient-to-br from-[#1a1a2e] to-[#16213e]' : 'bg-gradient-to-br from-white to-gray-50'} border ${isDark ? 'border-white/10' : 'border-gray-200'} shadow-xl`}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#FF7A00]/20' : 'bg-[#FF7A00]/10'}`}>
                  <TrendingUp className="w-5 h-5 text-[#FF7A00]" />
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Offer Summary</h3>
                  <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Calculated results</p>
                </div>
              </div>

              <div className="space-y-3">
                <SummaryRow label="70% Rule" value={calcs.rule70} icon={Percent} isDark={isDark} />
                <SummaryRow label="Maximum Allowable Offer" value={calcs.mao} icon={ShoppingCart} highlight isDark={isDark} />
                <SummaryRow label="First Offer (Anchor)" value={calcs.firstOffer} icon={Tag} isDark={isDark} />
                <SummaryRow label="Buyer Max Purchase" value={calcs.buyerPrice} icon={Home} isDark={isDark} />
              </div>
            </div>
          </div>

          {/* Deal Rating Card */}
          <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gradient-to-br from-[#1a1a2e] to-[#16213e]' : 'bg-gradient-to-br from-white to-gray-50'} border ${isDark ? 'border-white/10' : 'border-gray-200'} shadow-xl p-6`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#FF7A00]/20' : 'bg-[#FF7A00]/10'}`}>
                <TrendingUp className="w-5 h-5 text-[#FF7A00]" />
              </div>
              <div>
                <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Deal Rating</h3>
                <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Based on profit margin</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <DealGauge score={getDealRatingScore()} label={calcs.dealScore.label} isDark={isDark} />
              
              <div className="flex-1 space-y-3 w-full">
                <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <span className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Investor Profit</span>
                  <span className={`font-bold text-lg ${calcs.investorProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {calcs.investorProfit >= 0 ? '+' : ''}{fmt(calcs.investorProfit)}
                  </span>
                </div>
                <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <span className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Assignment Fee</span>
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{fmt(parseFloat(inputs.assignmentFee) || 0)}</span>
                </div>
                <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <span className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Profit %</span>
                  <span className={`font-bold ${calcs.investorProfitPct >= 15 ? 'text-green-500' : calcs.investorProfitPct >= 10 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {calcs.investorProfitPct.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSaveModal(false)}>
          <div className={`rounded-2xl p-6 w-full max-w-md shadow-2xl ${isDark ? 'bg-[#1a1a2e] border border-white/10' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>Save Deal</h3>
              <button data-testid="close-save-modal-btn" onClick={() => setShowSaveModal(false)} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>Deal Name</label>
                <input data-testid="deal-name-input" type="text" value={dealName} onChange={e => setDealName(e.target.value)} onKeyDown={e => e.key === 'Enter' && confirmSave()}
                  className={`w-full font-semibold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A00] ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'}`} autoFocus />
              </div>
              <div className={`p-4 rounded-xl space-y-2 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-white/50' : 'text-gray-500'}>MAO</span>
                  <strong className="text-[#FF7A00]">{fmt(calcs.mao)}</strong>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-white/50' : 'text-gray-500'}>Score</span>
                  <strong className={calcs.dealScore.color === 'green' ? 'text-green-500' : calcs.dealScore.color === 'yellow' ? 'text-yellow-500' : 'text-red-500'}>
                    {calcs.dealScore.label || 'N/A'}
                  </strong>
                </div>
              </div>
              <div className="flex gap-3">
                <button data-testid="confirm-save-btn" onClick={confirmSave} className="flex-1 bg-[#FF7A00] text-white font-bold py-3 rounded-xl hover:bg-[#E66E00] transition-all">
                  Save Deal
                </button>
                <button onClick={() => setShowSaveModal(false)} className={`px-6 font-bold py-3 rounded-xl transition-all ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
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
          <div className={`rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl ${isDark ? 'bg-[#1a1a2e] border border-white/10' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <h3 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Saved Deals <span className="text-[#FF7A00]">({savedDeals.length})</span>
              </h3>
              <button data-testid="close-saved-deals-btn" onClick={() => setShowSavedDeals(false)} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {savedDeals.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-white/20' : 'text-gray-300'}`} />
                  <p className={`font-medium ${isDark ? 'text-white/40' : 'text-gray-400'}`}>No saved deals yet.</p>
                </div>
              ) : (
                savedDeals.map(deal => (
                  <div key={deal.id} data-testid="saved-deal-item" className={`p-4 rounded-xl flex items-center justify-between transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    <div className="min-w-0">
                      <p className={`font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{deal.name}</p>
                      <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{new Date(deal.date).toLocaleDateString()}</p>
                      <p className="text-sm mt-1">MAO: <strong className="text-[#FF7A00]">{fmt(deal.mao)}</strong></p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        deal.dealScore === 'Excellent Deal' ? 'bg-green-500/20 text-green-500' 
                        : deal.dealScore === 'Average Deal' ? 'bg-yellow-500/20 text-yellow-500' 
                        : 'bg-red-500/20 text-red-500'
                      }`}>{deal.dealScore || 'N/A'}</span>
                      <button data-testid="delete-deal-btn" onClick={() => deleteDeal(deal.id)} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-50'} hover:text-red-500`}>
                        <X className="w-4 h-4" />
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
