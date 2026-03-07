import React, { useState, useEffect } from "react";
import { Toaster } from "sonner";
import Calculator from "./components/Calculator";
import RepairEstimator from "./components/RepairEstimator";
import { Sun, Moon, Calculator as CalcIcon, Wrench, Home } from "lucide-react";
import "./App.css";

const TABS = [
  { id: 'calculator', label: 'Calculator', icon: CalcIcon },
  { id: 'repair', label: 'Repair Estimator', icon: Wrench },
];

function App() {
  const [activeTab, setActiveTab] = useState("calculator");
  const [prefilledValues, setPrefilledValues] = useState(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("buywise_theme") !== "light");

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

  return (
    <div className={`App min-h-screen transition-colors duration-300 relative overflow-hidden ${isDark ? 'bg-[#0F1115]' : 'bg-[#F8F9FB]'}`} style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      
      {/* Animated Grid Background - Dark Mode Only */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,122,26,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,122,26,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#FF7A1A] opacity-[0.03] blur-[150px] rounded-full" />
        </div>
      )}
      
      <Toaster position="top-right" richColors closeButton theme={isDark ? "dark" : "light"} />
      
      {/* Top Navigation Bar - Matching Background */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${isDark ? 'bg-[#0F1115] border-b border-[#1A1D24]' : 'bg-[#F8F9FB] border-b border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-br from-[#FF7A1A] to-[#FF9A3C] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF7A1A]/20">
                  <Home className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-[#E5E5E5]' : 'text-gray-900'}`}>
                  Buy<span className="text-[#FF7A1A]">Wise</span>
                </span>
                <div className="h-0.5 w-full bg-gradient-to-r from-[#FF7A1A] to-transparent rounded-full mt-0.5" />
              </div>
            </div>
            
            {/* Right Nav */}
            <div className="flex items-center gap-3">
              <button 
                data-testid="theme-toggle-btn" 
                onClick={toggleDark}
                className={`p-2.5 rounded-xl transition-all duration-200 ${isDark ? 'bg-[#1A1D24] text-[#FF7A1A] hover:bg-[#252830]' : 'bg-gray-100 text-gray-600 hover:text-[#FF7A1A] hover:bg-gray-200'}`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Title always visible */}
      <div className={`relative pt-8 pb-6 px-6 md:px-8 ${isDark ? 'bg-[#0F1115]' : 'bg-[#F8F9FB]'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className={`text-3xl md:text-4xl font-bold mb-3 ${isDark ? 'text-[#E5E5E5]' : 'text-gray-900'}`}>
              Wholesale Real Estate Calculator
            </h1>
            <p className={`text-base md:text-lg ${isDark ? 'text-[#6B7280]' : 'text-gray-500'}`}>
              Know the Deal Before You Buy
            </p>
          </div>

          {/* Tab Navigation - Centered */}
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
                      : isDark
                        ? 'bg-[#1A1D24] text-[#6B7280] hover:text-[#E5E5E5] hover:bg-[#252830] border border-[#252830]'
                        : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-sm'
                  }`}
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
            onToggleDark={toggleDark} 
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
      <footer className={`fixed bottom-0 left-0 right-0 py-3 text-center text-xs ${isDark ? 'text-[#4B5563] bg-gradient-to-t from-[#0F1115] to-transparent' : 'text-gray-400 bg-gradient-to-t from-[#F8F9FB] to-transparent'}`}>
        <span>BuyWise • Professional Wholesale Deal Analyzer</span>
      </footer>
    </div>
  );
}

export default App;
