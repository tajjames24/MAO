import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { MapPin, Search, ArrowRight, AlertCircle, Menu, Info } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const fmt = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

const fmtInput = (val) => {
  if (!val) return '';
  const parts = String(val).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

const STEPS = [
  'Searching MLS data...',
  'Locating comparable sales...',
  'Filtering & adjusting comps...',
  'Calculating ARV & MAO...',
  'Generating deal score...',
];

const scoreStyle = (s) =>
  s >= 7 ? { text: 'text-green-600', bg: 'bg-green-50', bar: 'bg-green-500', label: 'Excellent' }
  : s >= 5 ? { text: 'text-yellow-600', bg: 'bg-yellow-50', bar: 'bg-yellow-500', label: 'Average' }
  : { text: 'text-red-600', bg: 'bg-red-50', bar: 'bg-red-500', label: 'Below Average' };

const confStyle = {
  High:   { text: 'text-green-700',  bg: 'bg-green-100',  dot: 'bg-green-500'  },
  Medium: { text: 'text-yellow-700', bg: 'bg-yellow-100', dot: 'bg-yellow-500' },
  Low:    { text: 'text-red-700',    bg: 'bg-red-100',    dot: 'bg-red-500'    },
};

function Stat({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/50 mb-0.5">{label}</p>
      <p className="font-black text-xl text-[#1A1A1A]" style={{ fontFamily: 'Chivo, sans-serif' }}>{value}</p>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="bg-white border-2 border-[#1A1A1A] p-4 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
      <p className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/50 mb-1">{label}</p>
      <p className="font-black text-xl text-[#1A1A1A]" style={{ fontFamily: 'Chivo, sans-serif' }}>{value}</p>
    </div>
  );
}

export default function CompGenerator({ onMenuClick, onUseInCalculator }) {
  const [address, setAddress]           = useState('');
  const [repairCost, setRepairCost]     = useState('');
  const [loading, setLoading]           = useState(false);
  const [step, setStep]                 = useState(0);
  const [results, setResults]           = useState(null);
  const [error, setError]               = useState(null);
  const [suggestions, setSuggestions]   = useState([]);
  const [sugLoading, setSugLoading]     = useState(false);
  const [showSug, setShowSug]           = useState(false);
  const [activeSug, setActiveSug]       = useState(-1);
  const debounceRef  = useRef(null);
  const wrapperRef   = useRef(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSug(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formatSuggestion = (item) => {
    const a = item.address || {};
    const street = [a.house_number, a.road].filter(Boolean).join(' ');
    const city   = a.city || a.town || a.village || a.hamlet || a.county || '';
    const state  = a.state || '';
    const zip    = a.postcode || '';
    const parts  = [street, city, state, zip].filter(Boolean);
    return parts.length >= 2 ? parts.join(', ') : item.display_name;
  };

  const getPropertyType = (item) => {
    const type  = item.type  || '';
    const cls   = item.class || '';
    if (type === 'house' || type === 'residential') return 'Residential';
    if (type === 'apartments')                       return 'Multi-Family';
    if (cls  === 'building')                         return 'Building';
    if (cls  === 'place' || cls === 'boundary')      return 'Area';
    return 'Property';
  };

  const fetchSuggestions = useCallback(async (query) => {
    if (query.length < 4) { setSuggestions([]); setShowSug(false); return; }
    setSugLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&countrycodes=us&limit=6`;
      const res  = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      const items = data
        .filter(d => d.address?.road || d.address?.house_number)
        .slice(0, 5)
        .map(d => ({
          label:    formatSuggestion(d),
          type:     getPropertyType(d),
          display:  d.display_name,
          lat:      d.lat,
          lon:      d.lon,
        }));
      setSuggestions(items);
      setShowSug(items.length > 0);
      setActiveSug(-1);
    } catch { /* silently fail */ }
    finally { setSugLoading(false); }
  }, []);

  const handleAddressChange = (val) => {
    setAddress(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 380);
  };

  const selectSuggestion = (sug) => {
    setAddress(sug.label);
    setSuggestions([]);
    setShowSug(false);
  };

  const handleAddressKeyDown = (e) => {
    if (!showSug || suggestions.length === 0) {
      if (e.key === 'Enter') generate();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSug(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSug(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSug >= 0) selectSuggestion(suggestions[activeSug]);
      else { setShowSug(false); generate(); }
    } else if (e.key === 'Escape') {
      setShowSug(false);
    }
  };

  const generate = async () => {
    if (!address.trim()) { toast.error('Enter a property address'); return; }
    setLoading(true); setError(null); setResults(null); setStep(0);

    const interval = setInterval(() =>
      setStep(prev => Math.min(prev + 1, STEPS.length - 1)), 3000);

    try {
      const { data } = await axios.post(`${API}/comps/generate`, {
        address: address.trim(),
        repair_cost: parseFloat(repairCost.replace(/,/g, '')) || 0,
      }, { timeout: 90000 });
      setResults(data);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Analysis failed. Try a full address (e.g. 123 Main St, Atlanta, GA).';
      setError(msg);
      toast.error('Could not generate comps');
    } finally {
      setLoading(false);
      clearInterval(interval);
    }
  };

  const sp  = results?.subject_property;
  const ss  = results ? scoreStyle(results.deal_score) : null;
  const cs  = results ? (confStyle[results.comp_confidence] || confStyle.Medium) : null;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white border-b-2 border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button data-testid="comp-menu-btn" onClick={onMenuClick}
              className="p-1.5 hover:bg-[#FFF7ED] rounded transition-colors">
              <Menu className="w-5 h-5 text-[#1A1A1A]" />
            </button>
            <span className="text-2xl font-black text-[#FF7A00] tracking-tight"
              style={{ fontFamily: 'Chivo, sans-serif' }}>BUYWISE</span>
          </div>
          <div className="flex items-center gap-2 bg-[#FFF7ED] border border-[#FFE6CC] px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-[#FF7A00]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#FF7A00]">Comp Generator</span>
          </div>
        </div>
      </header>

      {/* ── SEARCH HERO ── */}
      <div className="bg-[#FFF7ED] border-b-2 border-[#FFE6CC] py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-5">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-[#1A1A1A] tracking-tight"
              style={{ fontFamily: 'Chivo, sans-serif' }}>Comp Generator</h2>
            <p className="text-[#1A1A1A]/50 text-sm mt-1">
              AI-powered comparable sales analysis — enter any US property address
            </p>
          </div>

          {/* Address with Autocomplete */}
          <div className="relative" ref={wrapperRef}>
            <MapPin className="absolute left-4 top-[1.1rem] w-5 h-5 text-[#FF7A00] z-10" />
            {sugLoading && (
              <div className="absolute right-4 top-[1.1rem] z-10">
                <div className="w-4 h-4 border-2 border-[#FFE6CC] border-t-[#FF7A00] rounded-full animate-spin" />
              </div>
            )}
            <input
              data-testid="comp-address-input"
              type="text"
              autoComplete="off"
              value={address}
              onChange={e => handleAddressChange(e.target.value)}
              onKeyDown={handleAddressKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSug(true)}
              placeholder="123 Main St, Atlanta, GA 30301"
              className="w-full bg-white border-2 border-[#1A1A1A] focus:border-[#FF7A00] focus:outline-none text-[#1A1A1A] font-semibold text-lg py-4 pl-12 pr-10 transition-all shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] focus:shadow-[3px_3px_0px_0px_rgba(255,122,0,1)] placeholder:text-[#1A1A1A]/30"
            />

            {/* Suggestions Dropdown */}
            {showSug && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 bg-white border-2 border-[#1A1A1A] border-t-0 shadow-[3px_4px_0px_0px_rgba(26,26,26,1)] overflow-hidden">
                <div className="px-4 py-2 bg-[#FFF7ED] border-b border-[#FFE6CC]">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#FF7A00]">
                    Property Suggestions
                  </p>
                </div>
                {suggestions.map((sug, i) => (
                  <button
                    key={i}
                    data-testid={`address-suggestion-${i}`}
                    onMouseDown={() => selectSuggestion(sug)}
                    className={`w-full text-left px-4 py-3 border-b border-[#F0F0F0] last:border-none transition-colors ${
                      activeSug === i ? 'bg-[#FFF7ED]' : 'hover:bg-[#FFF7ED]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-6 h-6 bg-[#FFE6CC] rounded-full flex items-center justify-center shrink-0">
                        <MapPin className="w-3 h-3 text-[#FF7A00]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-[#1A1A1A] leading-tight truncate">{sug.label}</p>
                        <p className="text-xs text-[#1A1A1A]/40 mt-0.5">{sug.type}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Repair Cost */}
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#1A1A1A]/50">$</span>
              <input
                data-testid="comp-repair-cost-input"
                type="text"
                inputMode="numeric"
                value={fmtInput(repairCost)}
                onChange={e => setRepairCost(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="Repair cost (optional)"
                className="w-full bg-[#FFE6CC] border-2 border-transparent focus:border-[#FF7A00] focus:outline-none text-[#1A1A1A] font-semibold text-base py-4 pl-8 pr-4 rounded-md transition-all"
              />
            </div>
            {/* Generate */}
            <button
              data-testid="generate-comps-btn"
              onClick={generate}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-[#FF7A00] text-white font-bold uppercase tracking-wider px-8 py-4 border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:bg-[#E66E00] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-60 min-w-[170px]"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Search className="w-4 h-4" />}
              {loading ? 'Analyzing...' : 'Generate Comps'}
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 pb-24">

        {/* Loading */}
        {loading && (
          <div className="text-center py-20 space-y-6">
            <div className="w-14 h-14 border-4 border-[#FFE6CC] border-t-[#FF7A00] rounded-full animate-spin mx-auto" />
            <div>
              <p className="font-bold text-lg text-[#1A1A1A]">{STEPS[step]}</p>
              <p className="text-sm text-[#1A1A1A]/50 mt-1">This takes 10–25 seconds</p>
            </div>
            <div className="flex justify-center gap-2">
              {STEPS.map((_, i) => (
                <div key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-[#FF7A00] w-8' : 'bg-[#FFE6CC] w-4'}`} />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className={`border-2 p-5 flex items-start gap-3 ${
            error.includes('balance') || error.includes('Balance')
              ? 'border-yellow-500 bg-yellow-50'
              : 'border-red-500 bg-red-50'
          } shadow-[3px_3px_0px_0px_rgba(26,26,26,0.15)]`}>
            <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${error.includes('balance') || error.includes('Balance') ? 'text-yellow-600' : 'text-red-600'}`} />
            <div>
              <p className={`font-bold ${error.includes('balance') || error.includes('Balance') ? 'text-yellow-700' : 'text-red-700'}`}>
                {error.includes('balance') || error.includes('Balance') ? 'Low AI Key Balance' : 'Analysis Failed'}
              </p>
              <p className={`text-sm mt-0.5 ${error.includes('balance') || error.includes('Balance') ? 'text-yellow-600' : 'text-red-600'}`}>{error}</p>
              {!error.includes('balance') && !error.includes('Balance') && (
                <button onClick={generate} className="mt-2 text-sm font-bold text-red-700 underline">
                  Try again
                </button>
              )}
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && !results && (
          <div className="text-center py-20 space-y-3">
            <div className="w-16 h-16 bg-[#FFF7ED] border-2 border-[#FFE6CC] rounded-full flex items-center justify-center mx-auto">
              <Search className="w-7 h-7 text-[#FF7A00]/50" />
            </div>
            <p className="font-bold text-[#1A1A1A]/60 text-lg">Enter an address to generate comps</p>
            <p className="text-[#1A1A1A]/40 text-sm max-w-sm mx-auto">
              Our AI searches MLS data and calculates ARV, MAO, and a deal score in seconds.
            </p>
          </div>
        )}

        {/* ── RESULTS ── */}
        {results && !loading && (
          <div className="space-y-5">

            {/* Badges row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-[#1A1A1A]/50">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="font-medium">{results.data_source}</span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${cs.bg} ${cs.text}`}>
                <div className={`w-2 h-2 rounded-full ${cs.dot}`} />
                Comp Confidence: {results.comp_confidence}
              </div>
            </div>

            {/* Subject Property */}
            <div className="bg-white border-2 border-[#1A1A1A] p-5 md:p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <p className="text-xs font-bold uppercase tracking-widest text-[#FF7A00] mb-3">Subject Property</p>
              <p className="font-bold text-[#1A1A1A] mb-4 text-sm">{sp?.address}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-t border-[#E5E7EB]">
                <Stat label="Bedrooms" value={sp?.beds} />
                <Stat label="Bathrooms" value={sp?.baths} />
                <Stat label="Sqft" value={(sp?.sqft || 0).toLocaleString()} />
                <Stat label="Year Built" value={sp?.year_built} />
              </div>
              <div className="flex flex-wrap gap-4 text-sm mt-2">
                <span className="text-[#1A1A1A]/50">Type: <strong className="text-[#1A1A1A]">{sp?.property_type}</strong></span>
                <span className="text-[#1A1A1A]/50">Lot: <strong className="text-[#1A1A1A]">{sp?.lot_size}</strong></span>
              </div>
            </div>

            {/* Comps Table */}
            <div className="border-2 border-[#1A1A1A] overflow-hidden shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <div className="bg-[#1A1A1A] px-5 py-3 flex items-center justify-between">
                <p className="text-white font-bold text-sm uppercase tracking-widest">Comparable Sales</p>
                <span className="text-white/50 text-xs">{results.metrics?.comp_count || results.comps?.length} comps</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="comps-table">
                  <thead>
                    <tr className="bg-[#FFF7ED] border-b-2 border-[#FFE6CC]">
                      {['Address','Bed/Bath','Sqft','Sold Price','$/Sqft','Distance','Sale Date'].map(h => (
                        <th key={h} className={`px-4 py-3 text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/60 ${h === 'Address' ? 'text-left' : 'text-right'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.comps?.map((c, i) => (
                      <tr key={i} className={`border-b border-[#E5E7EB] hover:bg-[#FFF7ED] transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}`}>
                        <td className="px-4 py-3 font-medium text-[#1A1A1A] max-w-[160px] truncate" title={c.address}>{c.address}</td>
                        <td className="px-4 py-3 text-right text-[#1A1A1A]/70">{c.beds}/{c.baths}</td>
                        <td className="px-4 py-3 text-right text-[#1A1A1A]/70">{(c.sqft || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-bold text-[#1A1A1A]" style={{ fontFamily: 'Chivo, sans-serif' }}>{fmt(c.sold_price)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-[#FF7A00]">${c.price_per_sqft}/ft²</td>
                        <td className="px-4 py-3 text-right text-[#1A1A1A]/60">{c.distance_miles} mi</td>
                        <td className="px-4 py-3 text-right text-[#1A1A1A]/60 text-xs">{c.sale_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard label="Avg Price/Sqft"    value={`$${results.metrics?.avg_price_per_sqft}/ft²`} />
              <MetricCard label="Median Price/Sqft" value={`$${results.metrics?.median_price_per_sqft}/ft²`} />
              <MetricCard label="Highest Comp"      value={fmt(results.metrics?.highest_comp)} />
              <MetricCard label="Lowest Comp"       value={fmt(results.metrics?.lowest_comp)} />
            </div>

            {/* ARV / MAO / Deal Score */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* ARV */}
              <div className="bg-[#FF7A00] border-2 border-[#1A1A1A] p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]" data-testid="comp-arv">
                <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">Estimated ARV</p>
                <p className="font-black text-white leading-none" style={{ fontFamily: 'Chivo, sans-serif', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
                  {fmt(results.arv)}
                </p>
                <p className="text-white/60 text-xs mt-2">Avg $/sqft × Subject sqft</p>
              </div>
              {/* MAO */}
              <div className="bg-white border-2 border-[#1A1A1A] p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]" data-testid="comp-mao">
                <p className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/50 mb-1">Max Allowable Offer</p>
                <p className="font-black text-[#1A1A1A] leading-none" style={{ fontFamily: 'Chivo, sans-serif', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
                  {fmt(results.mao)}
                </p>
                <p className="text-[#1A1A1A]/50 text-xs mt-2">(ARV × 70%) − Repairs</p>
              </div>
              {/* Deal Score */}
              <div className={`border-2 border-[#1A1A1A] p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] ${ss.bg}`} data-testid="comp-deal-score">
                <p className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/50 mb-1">Deal Score</p>
                <div className="flex items-end gap-2">
                  <p className={`font-black leading-none ${ss.text}`} style={{ fontFamily: 'Chivo, sans-serif', fontSize: 'clamp(2rem, 5vw, 2.75rem)' }}>
                    {results.deal_score}
                  </p>
                  <p className="text-[#1A1A1A]/40 font-bold text-lg mb-0.5">/10</p>
                </div>
                <div className="w-full bg-[#E5E7EB] rounded-full h-2 mt-3">
                  <div className={`h-2 rounded-full ${ss.bar}`} style={{ width: `${(results.deal_score / 10) * 100}%` }} />
                </div>
                <p className={`text-xs font-bold mt-1.5 ${ss.text}`}>{ss.label}</p>
              </div>
            </div>

            {/* Investor Spread */}
            <div className="bg-white border-2 border-[#1A1A1A] p-5 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]" data-testid="comp-investor-spread">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/50 mb-1">Investor Spread</p>
                  <p className="font-black text-green-600" style={{ fontFamily: 'Chivo, sans-serif', fontSize: 'clamp(1.5rem, 4vw, 2.25rem)' }}>
                    {fmt(results.investor_spread)}
                  </p>
                </div>
                <p className="text-xs text-[#1A1A1A]/50 font-mono">
                  {fmt(results.arv)} − {fmt(results.mao)} − {fmt(results.repair_cost)}
                </p>
              </div>
            </div>

            {/* Summary */}
            {results.summary && (
              <div className="bg-[#FFF7ED] border-2 border-[#FFE6CC] p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-[#FF7A00] mb-3">Deal Summary</p>
                <p className="text-[#1A1A1A]/80 text-sm leading-relaxed">{results.summary}</p>
                {results.deal_quality_notes?.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {results.deal_quality_notes.map((n, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#1A1A1A]/70">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF7A00] mt-1.5 shrink-0" />
                        {n}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* CTA */}
            <button
              data-testid="use-in-calculator-btn"
              onClick={() => onUseInCalculator(results.arv, results.repair_cost)}
              className="w-full flex items-center justify-center gap-3 bg-[#FF7A00] text-white font-bold uppercase tracking-wider py-4 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-[#E66E00] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all text-sm"
            >
              <ArrowRight className="w-4 h-4" />
              Use ARV &amp; Repair Cost in Calculator
            </button>

          </div>
        )}
      </main>
    </div>
  );
}
