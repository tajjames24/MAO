import React from 'react';
import { X, Calculator, BarChart2, Sun, Moon } from 'lucide-react';

const NAV = [
  { id: 'calculator', label: 'Calculator',      icon: Calculator, desc: 'MAO & Deal Analyzer'          },
  { id: 'comps',      label: 'Comp Generator',  icon: BarChart2,  desc: 'AI-Powered Property Comps'   },
];

export default function AppSidebar({ isOpen, onClose, currentView, onNavigate, isDark }) {
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />}
      <div className={`fixed top-0 left-0 h-full w-72 z-50 flex flex-col transform transition-transform duration-300 ease-out border-r-2 ${isDark ? 'bg-[#111111] border-[#333]' : 'bg-white border-[#1A1A1A]'} ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className={`flex items-center justify-between px-5 py-4 border-b-2 ${isDark ? 'border-[#333]' : 'border-[#1A1A1A]'}`}>
          <span className="text-2xl font-black text-[#FF7A00] tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>BUYWISE</span>
          <button data-testid="sidebar-close-btn" onClick={onClose} className={`p-1.5 rounded transition-colors ${isDark ? 'hover:text-[#FF7A00] text-white' : 'hover:text-[#FF7A00]'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <p className={`text-xs font-bold uppercase tracking-[0.2em] px-3 mb-4 ${isDark ? 'text-white/30' : 'text-[#1A1A1A]/40'}`}>Tools</p>
          {NAV.map(({ id, label, icon: Icon, desc }) => {
            const active = currentView === id;
            return (
              <button key={id} data-testid={`nav-${id}`} onClick={() => onNavigate(id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all border-2 ${
                  active ? 'bg-[#FF7A00] text-white border-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]'
                  : isDark ? 'text-white border-transparent hover:bg-[#2C1A00] hover:border-[#3D2200]'
                  : 'text-[#1A1A1A] border-transparent hover:bg-[#FFF7ED] hover:border-[#FFE6CC]'
                }`}>
                <Icon className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold text-sm leading-tight">{label}</p>
                  <p className={`text-xs leading-tight mt-0.5 ${active ? 'text-white/65' : isDark ? 'text-white/40' : 'text-[#1A1A1A]/45'}`}>{desc}</p>
                </div>
              </button>
            );
          })}
        </nav>
        <div className={`px-5 py-4 border-t ${isDark ? 'border-[#2D2D2D]' : 'border-[#E5E7EB]'}`}>
          <p className={`text-xs font-medium ${isDark ? 'text-white/20' : 'text-[#1A1A1A]/30'}`}>Quick Deal Analyzer</p>
        </div>
      </div>
    </>
  );
}
