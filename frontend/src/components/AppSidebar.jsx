import React from 'react';
import { X, Calculator, BarChart2 } from 'lucide-react';

const NAV = [
  { id: 'calculator', label: 'Calculator', icon: Calculator, desc: 'MAO & Deal Analyzer' },
  { id: 'comps',      label: 'Comp Generator', icon: BarChart2,  desc: 'AI-Powered Property Comps' },
];

export default function AppSidebar({ isOpen, onClose, currentView, onNavigate }) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r-2 border-[#1A1A1A] z-50 flex flex-col transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-[#1A1A1A]">
          <span
            className="text-2xl font-black text-[#FF7A00] tracking-tight"
            style={{ fontFamily: 'Chivo, sans-serif' }}
          >
            BUYWISE
          </span>
          <button
            data-testid="sidebar-close-btn"
            onClick={onClose}
            className="p-1.5 hover:text-[#FF7A00] transition-colors rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/40 px-3 mb-4">
            Tools
          </p>
          {NAV.map(({ id, label, icon: Icon, desc }) => {
            const active = currentView === id;
            return (
              <button
                key={id}
                data-testid={`nav-${id}`}
                onClick={() => onNavigate(id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-150 border-2 ${
                  active
                    ? 'bg-[#FF7A00] text-white border-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]'
                    : 'text-[#1A1A1A] border-transparent hover:bg-[#FFF7ED] hover:border-[#FFE6CC]'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold text-sm leading-tight">{label}</p>
                  <p className={`text-xs leading-tight mt-0.5 ${active ? 'text-white/65' : 'text-[#1A1A1A]/45'}`}>
                    {desc}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#E5E7EB]">
          <p className="text-xs text-[#1A1A1A]/30 font-medium">Quick Deal Analyzer</p>
        </div>
      </div>
    </>
  );
}
