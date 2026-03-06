import React, { useState } from "react";
import { Toaster } from "sonner";
import Calculator from "./components/Calculator";
import CompGenerator from "./components/CompGenerator";
import AppSidebar from "./components/AppSidebar";
import "./App.css";

function App() {
  const [view, setView] = useState("calculator");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prefilledValues, setPrefilledValues] = useState(null);

  const handleNavigate = (v) => { setView(v); setSidebarOpen(false); };

  const handleUseInCalculator = (arv, repairCost) => {
    setPrefilledValues({
      arv: String(Math.round(arv || 0)),
      repairCost: repairCost ? String(Math.round(repairCost)) : "",
    });
    setView("calculator");
  };

  return (
    <div className="App">
      <Toaster position="top-right" richColors closeButton />
      <AppSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentView={view}
        onNavigate={handleNavigate}
      />
      {view === "calculator" ? (
        <Calculator
          onMenuClick={() => setSidebarOpen(true)}
          prefilledValues={prefilledValues}
        />
      ) : (
        <CompGenerator
          onMenuClick={() => setSidebarOpen(true)}
          onUseInCalculator={handleUseInCalculator}
        />
      )}
    </div>
  );
}

export default App;
