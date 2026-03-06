import React, { useState, useEffect } from "react";
import { Toaster } from "sonner";
import Calculator from "./components/Calculator";
import CompGenerator from "./components/CompGenerator";
import AppSidebar from "./components/AppSidebar";
import "./App.css";

function App() {
  const [view, setView] = useState("calculator");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const handleNavigate = (v) => { setView(v); setSidebarOpen(false); };
  const handleUseInCalculator = (arv, repairCost) => {
    setPrefilledValues({ arv: String(Math.round(arv || 0)), repairCost: repairCost ? String(Math.round(repairCost)) : "" });
    setView("calculator");
  };

  return (
    <div className="App">
      <Toaster position="top-right" richColors closeButton />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentView={view} onNavigate={handleNavigate} isDark={isDark} />
      {view === "calculator" ? (
        <Calculator onMenuClick={() => setSidebarOpen(true)} prefilledValues={prefilledValues} isDark={isDark} onToggleDark={toggleDark} />
      ) : (
        <CompGenerator onMenuClick={() => setSidebarOpen(true)} onUseInCalculator={handleUseInCalculator} isDark={isDark} onToggleDark={toggleDark} />
      )}
    </div>
  );
}

export default App;
