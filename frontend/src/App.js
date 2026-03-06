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
    <div className={`App min-h-screen transition-colors duration-200 ${isDark ? 'bg-[#111111]' : 'bg-white'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
      <Toaster position="top-right" richColors closeButton />
      
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b-2 transition-colors duration-200 ${isDark ? 'bg-[#111111] border-[#333]' : 'bg-white border-[#E5E7EB]'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Logo */}
            <span className="text-2xl font-black text-[#FF7A00] tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
              BUYWISE
            </span>
            
            {/* Dark Mode Toggle */}
            <button 
              data-testid="theme-toggle-btn" 
              onClick={toggleDark}
              className={`p-2 rounded-full border-2 transition-all ${isDark ? 'border-[#333] text-yellow-400 hover:bg-[#2D2D2D]' : 'border-[#E5E7EB] text-[#1A1A1A] hover:bg-[#FFF7ED]'}`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex gap-1 -mb-[2px]">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-testid={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 font-bold text-sm uppercase tracking-wider border-2 border-b-0 transition-all ${
                    isActive
                      ? 'bg-[#FF7A00] text-white border-[#1A1A1A] -mb-[2px] relative z-10'
                      : isDark
                        ? 'bg-[#1E1E1E] text-white/60 border-[#333] hover:text-white hover:bg-[#2C1A00]'
                        : 'bg-[#F5F5F5] text-[#1A1A1A]/60 border-[#E5E7EB] hover:text-[#1A1A1A] hover:bg-[#FFF7ED]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 pb-24">
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
