import { RotateCcw, Music, Clock, Activity, TrendingUp } from "lucide-react";
import WaveformViewer from "./WaveformViewer";
import CamelotWheel from "./CamelotWheel";

const formatDuration = (sec) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const SCALE_COLORS = {
  Major: "text-emerald-600 bg-emerald-50 border-emerald-200",
  Minor: "text-blue-600 bg-blue-50 border-blue-200",
  "Harmonic Minor": "text-purple-600 bg-purple-50 border-purple-200",
  "Melodic Minor": "text-amber-600 bg-amber-50 border-amber-200",
};

export default function ResultsPanel({ result, audioUrl, onReset, onExport }) {
  const { key, scale, bpm, confidence, duration, camelot, compatible_keys, filename } = result;
  const scaleColor = SCALE_COLORS[scale] || "text-gray-600 bg-gray-50 border-gray-200";

  return (
    <div className="space-y-6 animate-fade-up" data-testid="results-panel">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest">Analysis Complete</p>
          <h2 className="text-lg font-bold text-gray-800 font-manrope truncate max-w-sm">{filename}</h2>
        </div>
        <div className="flex gap-2">
          <button
            data-testid="reset-btn"
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#CC5500] rounded-full hover:bg-[#AA4400] transition-colors"
          >
            <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
            New Track
          </button>
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Key – large card */}
        <div
          data-testid="key-card"
          className="col-span-2 md:col-span-1 bg-[#CC5500] text-white rounded-2xl p-6 flex flex-col gap-2 animate-fade-up stagger-1 shadow-sm"
        >
          <div className="flex items-center gap-2 opacity-80">
            <Music className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-xs font-mono uppercase tracking-widest">Detected Key</span>
          </div>
          <div className="text-6xl md:text-7xl font-black tracking-tighter font-manrope leading-none" data-testid="detected-key">
            {key}
          </div>
          <div className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full border ${scaleColor}`}>
            {scale}
          </div>
        </div>

        {/* Scale */}
        <div data-testid="scale-card" className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-3 animate-fade-up stagger-2 shadow-sm hover:border-[#CC5500]/20 transition-colors">
          <div className="flex items-center gap-2 text-gray-400">
            <TrendingUp className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-xs font-mono uppercase tracking-widest">Scale</span>
          </div>
          <div className="text-2xl md:text-3xl font-black tracking-tight font-manrope text-gray-900" data-testid="detected-scale">
            {scale}
          </div>
          <div className="text-xs text-gray-400">
            Camelot: <span className="font-mono font-bold text-gray-700" data-testid="camelot-code">{camelot}</span>
          </div>
        </div>

        {/* BPM */}
        <div data-testid="bpm-card" className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-3 animate-fade-up stagger-3 shadow-sm hover:border-[#CC5500]/20 transition-colors">
          <div className="flex items-center gap-2 text-gray-400">
            <Activity className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-xs font-mono uppercase tracking-widest">Tempo</span>
          </div>
          <div className="text-2xl md:text-3xl font-black tracking-tight font-manrope text-gray-900" data-testid="bpm-value">
            {bpm}
            <span className="text-base font-medium text-gray-400 ml-1">BPM</span>
          </div>
          <div className="text-xs text-gray-400 font-mono">
            {formatDuration(duration)} duration
          </div>
        </div>

        {/* Confidence */}
        <div data-testid="confidence-card" className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-3 animate-fade-up stagger-4 shadow-sm hover:border-[#CC5500]/20 transition-colors">
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-xs font-mono uppercase tracking-widest">Confidence</span>
          </div>
          <div className="text-2xl md:text-3xl font-black tracking-tight font-manrope text-gray-900" data-testid="confidence-value">
            {confidence}
            <span className="text-base font-medium text-gray-400 ml-0.5">%</span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#CC5500] rounded-full transition-all duration-700"
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>
      </div>

      {/* Waveform + Camelot row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 animate-fade-up stagger-5 shadow-sm">
          <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-4">Waveform</p>
          <WaveformViewer audioUrl={audioUrl} />
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center animate-fade-up stagger-6 shadow-sm">
          <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-4 self-start">Camelot Wheel</p>
          <CamelotWheel activeCode={camelot} compatibleCodes={compatible_keys?.map((k) => k.code)} />
        </div>
      </div>

      {/* Compatible Keys */}
      {compatible_keys && compatible_keys.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 animate-fade-up shadow-sm" data-testid="compatible-keys">
          <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-4">Compatible Keys</p>
          <div className="flex flex-wrap gap-3">
            {compatible_keys.map((ck) => (
              <div
                key={ck.code}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-100 rounded-xl hover:border-[#CC5500]/30 transition-colors group"
                data-testid={`compatible-key-${ck.code}`}
              >
                <div className="w-8 h-8 bg-[#CC5500]/10 text-[#CC5500] rounded-lg flex items-center justify-center text-xs font-bold font-mono group-hover:bg-[#CC5500] group-hover:text-white transition-colors">
                  {ck.code}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{ck.key}</div>
                  <div className="text-xs text-gray-400">{ck.scale}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
