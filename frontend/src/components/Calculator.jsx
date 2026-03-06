import React, { useState, useEffect } from 'react';
import { useDealCalculator } from '../hooks/useDealCalculator';
import {
  ChevronDown, ChevronUp, Save, RotateCcw,
  BookOpen, Copy, FileText, X, Info, Menu
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

const SCORE_STYLES = {
  green:  { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-500',  dot: 'bg-green-500'  },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-500', dot: 'bg-yellow-500' },
  red:    { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-500',    dot: 'bg-red-500'    },
  gray:   { bg: 'bg-gray-50',   text: 'text-gray-400',   border: 'border-gray-200',   dot: 'bg-gray-300'   },
};

const formatInput = (val) => {
  if (!val) return '';
  const parts = String(val).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

function NumberInput({ label, value, onChange, placeholder, testId, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-[#1A1A1A]">
        {label}
        {hint && (
          <span title={hint} className="cursor-help">
            <Info className="w-3 h-3 text-[#1A1A1A]/40" />
          </span>
        )}
      </label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#1A1A1A]/50 text-lg select-none">$</span>
        <input
          data-testid={testId}
          type="text"
          inputMode="numeric"
          value={formatInput(value)}
          onChange={e => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
          placeholder={placeholder || '0'}
          className="w-full bg-[#FFE6CC] border-2 border-transparent focus:border-[#FF7A00] focus:outline-none text-[#1A1A1A] font-semibold text-lg py-3.5 pl-9 pr-4 rounded-md transition-all duration-150 placeholder:text-[#1A1A1A]/30"
        />
      </div>
    </div>
  );
}

function ResultCard({ label, value, isHero, colorClass, testId, subtext }) {
  if (isHero) {
    return (
      <div
        data-testid={testId}
        className="bg-[#FF7A00] border-2 border-[#1A1A1A] p-6 shadow-[5px_5px_0px_0px_rgba(26,26,26,1)] transition-all duration-200"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">{label}</p>
        <p
          className="font-black text-white leading-none"
          style={{ fontFamily: 'Chivo, sans-serif', fontSize: 'clamp(2.2rem, 6vw, 3.75rem)' }}
        >
          {fmt(value)}
        </p>
        {subtext && <p className="text-white/60 text-sm mt-2 font-medium">{subtext}</p>}
      </div>
    );
  }
  return (
    <div
      data-testid={testId}
      className="bg-white border-2 border-[#1A1A1A] p-4 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] transition-all duration-200"
    >
      <p className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/50 mb-1 leading-tight">{label}</p>
      <p
        className={`font-black text-2xl md:text-3xl ${colorClass || 'text-[#1A1A1A]'}`}
        style={{ fontFamily: 'Chivo, sans-serif' }}
      >
        {fmt(value)}
      </p>
    </div>
  );
}

export default function Calculator({ onMenuClick, prefilledValues }) {
  const [inputs, setInputs] = useState(DEFAULT);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedDeals, setSavedDeals] = useState([]);
  const [showSavedDeals, setShowSavedDeals] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [dealName, setDealName] = useState('');

  const calcs = useDealCalculator(inputs);
  const ss = SCORE_STYLES[calcs.dealScore.color || 'gray'];

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('wholesale_deals') || '[]');
    setSavedDeals(saved);
  }, []);

  useEffect(() => {
    if (prefilledValues?.arv) {
      setInputs(prev => ({
        ...prev,
        arv: prefilledValues.arv,
        ...(prefilledValues.repairCost ? { repairCost: prefilledValues.repairCost } : {}),
      }));
      toast.success('ARV loaded from Comp Generator!');
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

    // Header band
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

    // Deal Score badge
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

    // Footer
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

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b-2 border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              data-testid="calc-menu-btn"
              onClick={onMenuClick}
              className="p-1.5 hover:bg-[#FFF7ED] rounded transition-colors"
            >
              <Menu className="w-5 h-5 text-[#1A1A1A]" />
            </button>
            <span
              className="text-2xl font-black text-[#FF7A00] tracking-tight"
              style={{ fontFamily: 'Chivo, sans-serif' }}
            >
              BUYWISE
            </span>
          </div>
          <button
            data-testid="saved-deals-header-btn"
            onClick={() => setShowSavedDeals(true)}
            className="flex items-center gap-2 text-sm font-bold text-[#1A1A1A] hover:text-[#FF7A00] transition-colors duration-150"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Saved Deals</span>
            {savedDeals.length > 0 && (
              <span className="bg-[#FF7A00] text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                {savedDeals.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">

          {/* ─── LEFT: INPUT PANEL ─── */}
          <div className="space-y-5">

            {/* Core Inputs */}
            <div className="bg-white border-2 border-[#1A1A1A] p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#FF7A00] mb-6">Property Inputs</h2>
              <div className="space-y-5">
                <NumberInput
                  label="After Repair Value (ARV)"
                  value={inputs.arv}
                  onChange={setField('arv')}
                  placeholder="300,000"
                  testId="arv-input"
                  hint="The estimated market value after all repairs are complete"
                />
                <NumberInput
                  label="Repair Cost"
                  value={inputs.repairCost}
                  onChange={setField('repairCost')}
                  placeholder="30,000"
                  testId="repair-cost-input"
                  hint="Total estimated cost to repair/rehab the property"
                />
                <NumberInput
                  label="Assignment Fee"
                  value={inputs.assignmentFee}
                  onChange={setField('assignmentFee')}
                  placeholder="10,000"
                  testId="assignment-fee-input"
                  hint="Your wholesale fee for assigning the contract"
                />
              </div>
            </div>

            {/* Advanced Options */}
            <div className="border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
              <button
                data-testid="advanced-options-toggle"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between p-4 md:p-5 bg-white hover:bg-[#FFF7ED] transition-colors duration-150"
              >
                <span className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]">Advanced Options</span>
                {showAdvanced
                  ? <ChevronUp className="w-4 h-4 text-[#FF7A00]" />
                  : <ChevronDown className="w-4 h-4" />
                }
              </button>

              {showAdvanced && (
                <div className="border-t-2 border-[#1A1A1A] p-5 md:p-6 bg-[#FFFAF5] space-y-6">
                  {/* ARV Rule Percentage */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#1A1A1A]">
                      ARV Rule Percentage
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        data-testid="arv-rule-percent-slider"
                        type="range"
                        min="60"
                        max="85"
                        step="1"
                        value={inputs.arvRulePercent || 70}
                        onChange={e => setField('arvRulePercent')(e.target.value)}
                        className="flex-1 h-2 accent-[#FF7A00] cursor-pointer"
                      />
                      <div
                        className="bg-[#FF7A00] text-white px-3 py-2 min-w-[60px] text-center font-black border-2 border-[#1A1A1A]"
                        style={{ fontFamily: 'Chivo, sans-serif' }}
                        data-testid="arv-rule-percent-value"
                      >
                        {inputs.arvRulePercent || 70}%
                      </div>
                    </div>
                    <p className="text-xs text-[#1A1A1A]/50">Standard: 70% — Adjust based on market conditions</p>
                  </div>

                  {/* Negotiation Discount */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#1A1A1A]">
                      Negotiation Discount
                    </label>
                    <div className="relative">
                      <input
                        data-testid="negotiation-discount-input"
                        type="text"
                        inputMode="numeric"
                        value={inputs.negotiationDiscount}
                        onChange={e => setField('negotiationDiscount')(e.target.value.replace(/[^0-9.]/g, ''))}
                        className="w-full bg-[#FFE6CC] border-2 border-transparent focus:border-[#FF7A00] focus:outline-none text-[#1A1A1A] font-semibold text-lg py-3.5 pl-4 pr-10 rounded-md transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#1A1A1A]/50 text-lg">%</span>
                    </div>
                    <p className="text-xs text-[#1A1A1A]/50">Used to calculate your First Offer (anchor strategy)</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                data-testid="reset-btn"
                onClick={handleReset}
                className="flex items-center gap-2 bg-white text-[#1A1A1A] border-2 border-[#1A1A1A] font-bold uppercase tracking-wider px-5 py-3 shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:bg-gray-50 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                data-testid="save-deal-btn"
                onClick={handleSaveDeal}
                className="flex items-center gap-2 bg-white text-[#1A1A1A] border-2 border-[#1A1A1A] font-bold uppercase tracking-wider px-5 py-3 shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:bg-gray-50 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                Save Deal
              </button>
              <button
                data-testid="export-pdf-btn"
                onClick={exportPDF}
                className="flex items-center gap-2 bg-[#FF7A00] text-white border-2 border-[#1A1A1A] font-bold uppercase tracking-wider px-5 py-3 shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:bg-[#E66E00] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all text-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                Export PDF
              </button>
              <button
                data-testid="copy-clipboard-btn"
                onClick={copyToClipboard}
                className="flex items-center gap-2 bg-white text-[#1A1A1A] border-2 border-[#1A1A1A] font-bold uppercase tracking-wider px-5 py-3 shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:bg-gray-50 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all text-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
            </div>
          </div>

          {/* ─── RIGHT: RESULTS PANEL ─── */}
          <div className="space-y-4" id="results-section">

            {/* Deal Score Badge */}
            <div
              data-testid="deal-score-badge"
              className={`border-2 ${ss.border} p-4 flex items-center gap-3 ${ss.bg} transition-all duration-300`}
            >
              <div className={`w-4 h-4 rounded-full border-2 border-[#1A1A1A] ${ss.dot} shrink-0`} />
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/50">Deal Score</p>
                <p
                  className={`font-black text-xl leading-tight ${ss.text}`}
                  style={{ fontFamily: 'Chivo, sans-serif' }}
                  data-testid="deal-score-label"
                >
                  {calcs.dealScore.label || 'Enter values to analyze'}
                </p>
              </div>
              {hasValues && (
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/50">Investor %</p>
                  <p className={`font-black text-lg ${ss.text}`} style={{ fontFamily: 'Chivo, sans-serif' }} data-testid="investor-profit-pct">
                    {calcs.investorProfitPct.toFixed(1)}%
                  </p>
                </div>
              )}
            </div>

            {/* MAO — Hero */}
            <ResultCard
              label="Maximum Allowable Offer (MAO)"
              value={calcs.mao}
              isHero
              testId="mao-result"
              subtext={hasValues ? `Your max bid to ensure profitability` : null}
            />

            {/* 2-col grid */}
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="70% Rule Value" value={calcs.rule70} testId="rule70-result" />
              <ResultCard label="First Offer (Anchor)" value={calcs.firstOffer} testId="first-offer-result" colorClass="text-[#FF7A00]" />
              <ResultCard label="Buyer Max Price" value={calcs.buyerPrice} testId="buyer-price-result" />
              <ResultCard label="Assignment Fee" value={parseFloat(inputs.assignmentFee) || 0} testId="assignment-fee-display" />
            </div>

            {/* Investor Profit — wide card */}
            <div
              data-testid="investor-profit-result"
              className="bg-white border-2 border-[#1A1A1A] p-5 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/50 mb-1">Investor Profit Estimate</p>
                  <p
                    className={`font-black leading-none ${
                      calcs.dealScore.color === 'green' ? 'text-green-600' :
                      calcs.dealScore.color === 'red'   ? 'text-red-600'   :
                      calcs.dealScore.color === 'yellow' ? 'text-yellow-600' :
                      'text-[#1A1A1A]'
                    }`}
                    style={{ fontFamily: 'Chivo, sans-serif', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
                    data-testid="investor-profit-value"
                  >
                    {fmt(calcs.investorProfit)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/50 mb-1">Formula</p>
                  <p className="text-xs text-[#1A1A1A]/60 font-mono leading-snug">
                    ARV − MAO − Repairs
                  </p>
                </div>
              </div>
            </div>

            {/* Score legend */}
            <div className="border border-[#E5E7EB] p-4 bg-[#FAFAFA]">
              <p className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/50 mb-3">Deal Score Guide</p>
              <div className="flex flex-col sm:flex-row gap-2 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
                  <span className="text-[#1A1A1A]/70">Excellent: Profit &ge;25% ARV &amp; Repairs &le;25%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 shrink-0" />
                  <span className="text-[#1A1A1A]/70">Average: Profit &ge;15% &amp; Repairs &le;40%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                  <span className="text-[#1A1A1A]/70">Bad: Otherwise</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── SAVE DEAL MODAL ─── */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowSaveModal(false)}>
          <div
            className="bg-white border-2 border-[#1A1A1A] p-6 w-full max-w-md shadow-[6px_6px_0px_0px_rgba(26,26,26,1)]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-xl text-[#1A1A1A]" style={{ fontFamily: 'Chivo, sans-serif' }}>Save Deal</h3>
              <button data-testid="close-save-modal-btn" onClick={() => setShowSaveModal(false)} className="p-1 hover:text-[#FF7A00] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#1A1A1A] mb-2">Deal Name</label>
                <input
                  data-testid="deal-name-input"
                  type="text"
                  value={dealName}
                  onChange={e => setDealName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmSave()}
                  className="w-full bg-[#FFE6CC] border-2 border-transparent focus:border-[#FF7A00] focus:outline-none text-[#1A1A1A] font-semibold py-3 px-4 rounded-md"
                  autoFocus
                />
              </div>
              <div className="bg-[#FFF7ED] border border-[#FFE6CC] p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#1A1A1A]/60">MAO</span>
                  <strong className="text-[#FF7A00]">{fmt(calcs.mao)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#1A1A1A]/60">Score</span>
                  <strong className={ss.text}>{calcs.dealScore.label || 'N/A'}</strong>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  data-testid="confirm-save-btn"
                  onClick={confirmSave}
                  className="flex-1 bg-[#FF7A00] text-white font-bold uppercase tracking-wider py-3 border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:bg-[#E66E00] active:shadow-none transition-all text-sm"
                >
                  Save Deal
                </button>
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-6 bg-white text-[#1A1A1A] font-bold uppercase tracking-wider py-3 border-2 border-[#1A1A1A] hover:bg-gray-50 transition-all text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SAVED DEALS MODAL ─── */}
      {showSavedDeals && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowSavedDeals(false)}>
          <div
            className="bg-white border-2 border-[#1A1A1A] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-[6px_6px_0px_0px_rgba(26,26,26,1)]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b-2 border-[#1A1A1A]">
              <h3 className="font-black text-xl text-[#1A1A1A]" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Saved Deals <span className="text-[#FF7A00]">({savedDeals.length})</span>
              </h3>
              <button data-testid="close-saved-deals-btn" onClick={() => setShowSavedDeals(false)} className="p-1 hover:text-[#FF7A00] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {savedDeals.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="w-10 h-10 text-[#1A1A1A]/20 mx-auto mb-3" />
                  <p className="text-[#1A1A1A]/40 font-medium">No saved deals yet.</p>
                  <p className="text-[#1A1A1A]/30 text-sm">Analyze and save your first deal!</p>
                </div>
              ) : (
                savedDeals.map(deal => {
                  const dss = SCORE_STYLES[
                    deal.dealScore === 'Excellent Deal' ? 'green' :
                    deal.dealScore === 'Average Deal'  ? 'yellow' : 'red'
                  ] || SCORE_STYLES.gray;
                  return (
                    <div
                      key={deal.id}
                      data-testid={`saved-deal-item`}
                      className="border-2 border-[#1A1A1A] p-4 flex items-center justify-between hover:bg-[#FFF7ED] transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[#1A1A1A] truncate">{deal.name}</p>
                        <p className="text-xs text-[#1A1A1A]/50">{new Date(deal.date).toLocaleDateString()}</p>
                        <p className="text-sm mt-0.5">
                          MAO: <strong className="text-[#FF7A00]" style={{ fontFamily: 'Chivo, sans-serif' }}>{fmt(deal.mao)}</strong>
                          {deal.investorProfit != null && (
                            <span className="text-[#1A1A1A]/50 ml-2">· Profit: {fmt(deal.investorProfit)}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span className={`text-xs font-bold uppercase px-2 py-1 border ${dss.border} ${dss.bg} ${dss.text}`}>
                          {deal.dealScore || 'N/A'}
                        </span>
                        <button
                          data-testid="delete-deal-btn"
                          onClick={() => deleteDeal(deal.id)}
                          className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
