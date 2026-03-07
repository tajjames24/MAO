import React, { useState, useEffect } from "react";
import { Toaster } from "sonner";
import Calculator from "./components/Calculator";
import RepairEstimator from "./components/RepairEstimator";
import { Sun, Moon, Calculator as CalcIcon, Wrench } from "lucide-react";
import "./App.css";

const TABS = [
  { id: 'calculator', label: 'Calculator', icon: CalcIcon },
  { id: 'repair', label: 'Repair Estimator', icon: Wrench },
];

function App() {
  const [activeTab, setActiveTab] = useState("calculator");
  const [prefilledValues, setPrefilledValues] = useState(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("buywise_theme") === "dark");

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
  
  // Handle sync from Repair Estimator to Calculator
  const handleSyncRepairCost = (repairCost) => {
    setPrefilledValues({ repairCost: String(Math.round(repairCost || 0)) });
    setActiveTab("calculator");
  };

  return (
    <div className={`App min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0a0a1a]' : 'bg-gray-50'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
      <Toaster position="top-right" richColors closeButton />
      
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl transition-colors duration-300 ${isDark ? 'bg-[#0a0a1a]/80 border-b border-white/10' : 'bg-white/80 border-b border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#FF7A00] to-[#FF9A40] rounded-lg flex items-center justify-center">
                <CalcIcon className="w-4 h-4 text-white" />
              </div>
              <span className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <span className="text-[#FF7A00]">BUY</span>WISE
              </span>
            </div>
            
            {/* Dark Mode Toggle */}
            <button 
              data-testid="theme-toggle-btn" 
              onClick={toggleDark}
              className={`p-2.5 rounded-xl transition-all ${isDark ? 'bg-white/10 text-yellow-400 hover:bg-white/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex gap-2 pb-4">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-testid={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF7A00] to-[#FF9A40] text-white shadow-lg shadow-orange-500/25'
                      : isDark
                        ? 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                        : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 pb-24">
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
    </div>
  );
}

export default App;
