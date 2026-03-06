import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Music, FileAudio } from "lucide-react";

const ACCEPT = { "audio/*": [".mp3", ".wav", ".m4a"] };

export default function UploadZone({ onFileSelected }) {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(
    (accepted) => {
      if (accepted.length > 0) onFileSelected(accepted[0]);
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPT,
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-10 animate-fade-up">
      {/* Hero text */}
      <div className="text-center space-y-4 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FF5A1F]/10 text-[#FF5A1F] rounded-full text-xs font-semibold uppercase tracking-widest mb-2">
          <span className="w-1.5 h-1.5 bg-[#FF5A1F] rounded-full" />
          AI-Powered Key Detection
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-none text-gray-900 font-manrope">
          Find Your<br />
          <span className="text-[#FF5A1F]">Musical Key</span>
        </h1>
        <p className="text-base md:text-lg text-gray-500 max-w-md mx-auto leading-relaxed">
          Upload any audio track and instantly detect its key, scale, BPM and Camelot position.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        data-testid="upload-zone"
        className={`relative w-full max-w-2xl rounded-3xl border-2 border-dashed transition-colors duration-300 cursor-pointer group overflow-hidden
          ${isDragActive
            ? "border-[#FF5A1F] bg-[#FF5A1F]/5 shadow-[0_0_0_6px_rgba(255,90,31,0.08)]"
            : isDragReject
            ? "border-red-400 bg-red-50"
            : "border-gray-200 bg-gray-50 hover:border-[#FF5A1F]/50 hover:bg-[#FF5A1F]/[0.02]"
          }`}
        style={{ minHeight: 300 }}
      >
        <input {...getInputProps()} data-testid="file-input" />

        {/* Animated waveform background decoration */}
        <div className="absolute inset-0 flex items-end justify-center gap-0.5 px-12 pb-6 opacity-10 pointer-events-none">
          {Array.from({ length: 48 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-[#FF5A1F] rounded-full"
              style={{ height: `${20 + Math.sin(i * 0.5) * 15 + Math.random() * 20}px` }}
            />
          ))}
        </div>

        <div className="relative flex flex-col items-center justify-center py-16 px-8 gap-5">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-colors duration-300
            ${isDragActive ? "bg-[#FF5A1F]" : "bg-white border-2 border-gray-200 group-hover:border-[#FF5A1F]/40"}`}>
            {isDragActive ? (
              <Music className="w-9 h-9 text-white" strokeWidth={1.5} />
            ) : (
              <Upload className="w-9 h-9 text-gray-400 group-hover:text-[#FF5A1F] transition-colors" strokeWidth={1.5} />
            )}
          </div>

          <div className="text-center space-y-1.5">
            <p className="text-lg font-semibold text-gray-800 font-manrope">
              {isDragActive ? "Release to analyze" : "Drop your audio file here"}
            </p>
            <p className="text-sm text-gray-500">
              or <span className="text-[#FF5A1F] font-medium">click to browse</span>
            </p>
          </div>

          {/* File types */}
          <div className="flex gap-2 mt-2">
            {["MP3", "WAV", "M4A"].map((fmt) => (
              <span
                key={fmt}
                className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600"
              >
                <FileAudio className="w-3 h-3 text-[#FF5A1F]" />
                {fmt}
              </span>
            ))}
          </div>

          {isDragReject && (
            <p className="text-sm text-red-500 font-medium">
              Unsupported file format. Please use MP3, WAV, or M4A.
            </p>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-6 max-w-lg w-full text-center animate-fade-up stagger-3">
        {[
          { step: "01", label: "Upload track", desc: "Drag or click" },
          { step: "02", label: "AI analyzes", desc: "Chroma + FFT" },
          { step: "03", label: "Get results", desc: "Key, Scale, BPM" },
        ].map(({ step, label, desc }) => (
          <div key={step} className="space-y-1">
            <div className="text-xs font-mono font-bold text-[#FF5A1F] uppercase tracking-widest">{step}</div>
            <div className="text-sm font-semibold text-gray-800">{label}</div>
            <div className="text-xs text-gray-400">{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
