import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, Volume2 } from "lucide-react";

/** Extract normalised peaks [-1..1] from an AudioBuffer for WaveSurfer. */
function extractPeaks(audioBuffer, samples = 800) {
  const raw = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(raw.length / samples);
  const peaks = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    let max = 0;
    const start = i * blockSize;
    for (let j = 0; j < blockSize; j++) {
      const v = Math.abs(raw[start + j] || 0);
      if (v > max) max = v;
    }
    peaks[i] = max;
  }
  return peaks;
}

export default function WaveformViewer({ audioUrl }) {
  const containerRef = useRef(null);
  const wsRef        = useRef(null);
  const audioRef     = useRef(null);          // stable HTMLAudioElement
  const mountedRef   = useRef(true);

  const [isPlaying,    setIsPlaying]    = useState(false);
  const [isReady,      setIsReady]      = useState(false);
  const [currentTime,  setCurrentTime]  = useState(0);
  const [totalDuration,setTotalDuration]= useState(0);

  /* track mount state */
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    // --- tear down previous instance (no fetch = no AbortError) ---
    if (wsRef.current) {
      try { wsRef.current.destroy(); } catch (_) {}
      wsRef.current = null;
    }
    if (mountedRef.current) {
      setIsReady(false);
      setIsPlaying(false);
      setCurrentTime(0);
    }

    // We use a stable HTMLAudioElement as the media source for WaveSurfer.
    // This means WaveSurfer will NEVER make its own fetch() call,
    // so destroy() has nothing to abort → AbortError impossible.
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    audio.src = audioUrl;
    audio.preload = "auto";

    // Pre-decode to extract peaks so WaveSurfer can draw the waveform
    // without fetching. Wrap everything so errors never propagate.
    let cancelled = false;
    const ac = new AudioContext();

    fetch(audioUrl)
      .then((r) => r.arrayBuffer())
      .then((buf) => ac.decodeAudioData(buf))
      .then((decoded) => {
        if (cancelled || !mountedRef.current || !containerRef.current) return;

        const peaks = extractPeaks(decoded);

        const ws = WaveSurfer.create({
          container:     containerRef.current,
          waveColor:     "#E5E7EB",
          progressColor: "#CC5500",
          cursorColor:   "#CC5500",
          height:        72,
          barWidth:      2,
          barGap:        1,
          barRadius:     2,
          normalize:     true,
          interact:      true,
          // Hand WaveSurfer a pre-existing media element + pre-computed peaks.
          // It will draw immediately and control playback via `audio`,
          // but will NOT issue any fetch of its own.
          media:         audio,
          peaks:         [Array.from(peaks)],
          duration:      decoded.duration,
        });

        ws.on("ready", () => {
          if (!mountedRef.current) return;
          setIsReady(true);
          setTotalDuration(ws.getDuration());
        });
        ws.on("audioprocess", () => {
          if (mountedRef.current) setCurrentTime(ws.getCurrentTime());
        });
        ws.on("play",   () => { if (mountedRef.current) setIsPlaying(true);  });
        ws.on("pause",  () => { if (mountedRef.current) setIsPlaying(false); });
        ws.on("finish", () => { if (mountedRef.current) setIsPlaying(false); });
        // Absorb any remaining WaveSurfer errors silently
        ws.on("error",  (e) => { if (e?.name !== "AbortError") console.warn(e); });

        wsRef.current = ws;
      })
      .catch(() => {
        // Fetch/decode failed or was cancelled — just show nothing
        if (mountedRef.current) setIsReady(false);
      })
      .finally(() => ac.close().catch(() => {}));

    return () => {
      cancelled = true;
      // By this point ws has NO active fetch, so destroy() is safe.
      if (wsRef.current) {
        try { wsRef.current.destroy(); } catch (_) {}
        wsRef.current = null;
      }
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (wsRef.current && isReady) wsRef.current.playPause();
  };

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
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
      <div
        ref={containerRef}
        className={`rounded-xl overflow-hidden transition-opacity duration-500 ${isReady ? "opacity-100" : "opacity-40"}`}
      />

      {!isReady && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-3 h-3 border-2 border-[#CC5500] border-t-transparent rounded-full animate-spin" />
          Loading waveform…
        </div>
      )}

      {isReady && (
        <div className="flex items-center gap-3">
          <button
            data-testid="waveform-play-btn"
            onClick={togglePlay}
            className="w-8 h-8 flex items-center justify-center bg-[#CC5500] text-white rounded-full hover:bg-[#AA4400] transition-colors shadow-sm active:scale-95"
          >
            {isPlaying
              ? <Pause className="w-3.5 h-3.5" fill="currentColor" />
              : <Play  className="w-3.5 h-3.5" fill="currentColor" />}
          </button>

          <span className="text-xs font-mono text-gray-500">
            {fmt(currentTime)} / {fmt(totalDuration)}
          </span>

          <Volume2 className="w-3.5 h-3.5 text-gray-400 ml-auto" strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}
