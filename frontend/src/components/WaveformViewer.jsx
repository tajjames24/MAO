import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, Volume2 } from "lucide-react";

export default function WaveformViewer({ audioUrl }) {
  const containerRef = useRef(null);
  const wsRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    // Destroy previous instance
    if (wsRef.current) {
      wsRef.current.destroy();
      wsRef.current = null;
    }

    setIsReady(false);
    setIsPlaying(false);
    setCurrentTime(0);

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#E5E7EB",
      progressColor: "#FF5A1F",
      cursorColor: "#FF5A1F",
      height: 72,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      normalize: true,
      interact: true,
    });

    ws.load(audioUrl);

    ws.on("ready", () => {
      setIsReady(true);
      setTotalDuration(ws.getDuration());
    });

    ws.on("audioprocess", () => {
      setCurrentTime(ws.getCurrentTime());
    });

    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("finish", () => setIsPlaying(false));

    wsRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (wsRef.current && isReady) {
      wsRef.current.playPause();
    }
  };

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (!audioUrl) {
    return (
      <div className="flex items-center justify-center h-20 bg-gray-50 rounded-xl text-sm text-gray-400 font-mono">
        No audio loaded
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="waveform-viewer">
      {/* Waveform container */}
      <div
        ref={containerRef}
        className={`rounded-xl overflow-hidden transition-opacity duration-500 ${isReady ? "opacity-100" : "opacity-50"}`}
      />

      {!isReady && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-3 h-3 border-2 border-[#FF5A1F] border-t-transparent rounded-full animate-spin" />
          Loading waveform...
        </div>
      )}

      {/* Controls */}
      {isReady && (
        <div className="flex items-center gap-3">
          <button
            data-testid="waveform-play-btn"
            onClick={togglePlay}
            className="w-8 h-8 flex items-center justify-center bg-[#FF5A1F] text-white rounded-full hover:bg-[#e04a15] transition-colors shadow-sm active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5" fill="currentColor" />
            ) : (
              <Play className="w-3.5 h-3.5" fill="currentColor" />
            )}
          </button>

          <div className="flex items-center gap-1 text-xs font-mono text-gray-500">
            <span>{fmt(currentTime)}</span>
            <span className="text-gray-300">/</span>
            <span>{fmt(totalDuration)}</span>
          </div>

          <div className="flex items-center gap-1 ml-auto text-gray-400">
            <Volume2 className="w-3.5 h-3.5" strokeWidth={1.5} />
          </div>
        </div>
      )}
    </div>
  );
}
