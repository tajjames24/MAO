import React, { useState, useEffect } from "react";
import { Toaster } from "sonner";
import Calculator from "./components/Calculator";
import RepairEstimator from "./components/RepairEstimator";
import { Sun, Moon, Calculator as CalcIcon, Wrench, Home, Save, BookOpen } from "lucide-react";
import "./App.css";

const TABS = [
  { id: 'calculator', label: 'Calculator', icon: CalcIcon },
  { id: 'repair', label: 'Repair Estimator', icon: Wrench },
];

function App() {
  const [activeTab, setActiveTab] = useState("calculator");
  const [prefilledValues, setPrefilledValues] = useState(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("buywise_theme") !== "light");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSavedDeals, setShowSavedDeals] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("buywise_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("buywise_theme", "light");
    }
  }, [isDark]);

  const toggleDark = () => setIsDark(d => !d);
  
  const handleSyncRepairCost = (repairCost) => {
    setPrefilledValues({ repairCost: String(Math.round(repairCost || 0)) });
    setActiveTab("calculator");
  };

  // Colors - consistent throughout
  const colors = {
    bg: isDark ? '#0F1115' : '#F8F9FB',
    card: isDark ? '#1A1D24' : '#FFFFFF',
    border: isDark ? '#252830' : '#E5E7EB',
    textPrimary: isDark ? '#9CA3AF' : '#374151',
    textSecondary: isDark ? '#6B7280' : '#9CA3AF',
    textMuted: isDark ? '#4B5563' : '#D1D5DB',
  };

  return (
    <div className="App min-h-screen transition-colors duration-300 relative overflow-hidden" style={{ backgroundColor: colors.bg, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      
      {/* Grid Background - Dark Mode Only */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,122,26,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,122,26,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#FF7A1A] opacity-[0.02] blur-[150px] rounded-full" />
        </div>
      )}
      
      <Toaster position="top-right" richColors closeButton theme={isDark ? "dark" : "light"} />
      
      {/* Header */}
      <header className="sticky top-0 z-50 transition-all duration-300" style={{ backgroundColor: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-[#FF7A1A] to-[#FF9A3C] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF7A1A]/20">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight" style={{ color: colors.textPrimary }}>
                  Buy<span className="text-[#FF7A1A]">Wise</span>
                </span>
                <div className="h-0.5 w-full bg-gradient-to-r from-[#FF7A1A] to-transparent rounded-full mt-0.5" />
              </div>
            </div>
            
            {/* Right: Save Buttons + Theme Toggle */}
            <div className="flex items-center gap-2">
              <button 
                data-testid="save-deal-btn"
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#FF7A1A] to-[#FF9A3C] text-white hover:shadow-lg hover:shadow-[#FF7A1A]/30 transition-all duration-200"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save</span>
              </button>
              <button 
                data-testid="saved-deals-header-btn"
                onClick={() => setShowSavedDeals(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200"
                style={{ backgroundColor: colors.card, color: colors.textPrimary, border: `1px solid ${colors.border}` }}
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Saved</span>
              </button>
              <button 
                data-testid="theme-toggle-btn" 
                onClick={toggleDark}
                className="p-2.5 rounded-xl transition-all duration-200"
                style={{ backgroundColor: colors.card, color: '#FF7A1A', border: `1px solid ${colors.border}` }}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative pt-8 pb-6 px-6 md:px-8" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: colors.textPrimary }}>
              Wholesale Real Estate Calculator
            </h1>
            <p className="text-base md:text-lg" style={{ color: colors.textSecondary }}>
              Know the Deal Before You Buy
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center gap-2 mb-6">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-testid={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex items-center gap-2 px-6 py-3 font-semibold text-sm rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF7A1A] to-[#FF9A3C] text-white shadow-lg shadow-[#FF7A1A]/30'
                      : ''
                  }`}
                  style={!isActive ? { 
                    backgroundColor: colors.card, 
                    color: colors.textPrimary, 
                    border: `1px solid ${colors.border}` 
                  } : {}}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 md:px-8 pb-24">
        {activeTab === 'calculator' && (
          <Calculator 
            prefilledValues={prefilledValues} 
            isDark={isDark}
            showSaveModal={showSaveModal}
            setShowSaveModal={setShowSaveModal}
            showSavedDeals={showSavedDeals}
            setShowSavedDeals={setShowSavedDeals}
          />
        )}
        {activeTab === 'repair' && (
          <RepairEstimator 
            onSyncToCalculator={handleSyncRepairCost} 
            isDark={isDark} 
          />
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-3 text-center text-xs" style={{ color: colors.textMuted, background: `linear-gradient(to top, ${colors.bg}, transparent)` }}>
        <span>BuyWise • Professional Wholesale Deal Analyzer</span>
      </footer>
    </div>
  );
}

export default App;
