import { useState, useRef } from "react";
import axios from "axios";
import { Mic, Square, X, AlertCircle } from "lucide-react";

const STATES = { IDLE: "idle", RECORDING: "recording", PROCESSING: "processing", ERROR: "error" };

export default function MicRecorder({ onResult, onClose, apiUrl }) {
  const [state, setState] = useState(STATES.IDLE);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timerRef.current);
        setState(STATES.PROCESSING);

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const blobUrl = URL.createObjectURL(blob);

        const formData = new FormData();
        formData.append("file", blob, "recording.wav");

        try {
          const { data } = await axios.post(apiUrl, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          onResult(data, blobUrl);
        } catch (e) {
          const msg = e?.response?.data?.detail || "Analysis failed";
          setError(msg);
          setState(STATES.ERROR);
          URL.revokeObjectURL(blobUrl);
        }
      };

      mr.start(100);
      mediaRef.current = mr;
      setState(STATES.RECORDING);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (e) {
      setError("Microphone access denied. Please allow mic permissions.");
      setState(STATES.ERROR);
    }
  };

  const stopRecording = () => {
    if (mediaRef.current && state === STATES.RECORDING) {
      mediaRef.current.stop();
    }
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-testid="mic-recorder-modal">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm z-10 flex flex-col items-center gap-6 animate-fade-up">
        <button
          data-testid="close-mic-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
        </button>

        <div className="text-center">
          <h3 className="text-xl font-bold font-manrope text-gray-900">Microphone Input</h3>
          <p className="text-sm text-gray-500 mt-1">Record audio for real-time key detection</p>
        </div>

        {/* Mic button */}
        <div className="relative flex items-center justify-center">
          {state === STATES.RECORDING && (
            <>
              <div className="absolute w-28 h-28 rounded-full bg-[#FF5A1F]/20 animate-ping" />
              <div className="absolute w-24 h-24 rounded-full bg-[#FF5A1F]/10" />
            </>
          )}
          <button
            data-testid="mic-record-btn"
            onClick={state === STATES.RECORDING ? stopRecording : startRecording}
            disabled={state === STATES.PROCESSING}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-colors active:scale-95 disabled:opacity-50
              ${state === STATES.RECORDING
                ? "bg-red-500 hover:bg-red-600"
                : "bg-[#FF5A1F] hover:bg-[#e04a15]"
              }`}
          >
            {state === STATES.RECORDING ? (
              <Square className="w-7 h-7 text-white" fill="white" />
            ) : state === STATES.PROCESSING ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Mic className="w-7 h-7 text-white" strokeWidth={1.5} />
            )}
          </button>
        </div>

        {/* Status */}
        <div className="text-center min-h-[2rem]">
          {state === STATES.IDLE && (
            <p className="text-gray-500 text-sm">Press to start recording</p>
          )}
          {state === STATES.RECORDING && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-600 font-semibold text-sm font-mono">
                  REC {fmt(seconds)}
                </span>
              </div>
              {/* Sound bars */}
              <div className="flex items-end gap-0.5 h-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-[#FF5A1F] rounded-full sound-bar"
                    style={{ animationDelay: `${i * 0.12}s`, height: "100%" }}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400">Press stop when done</p>
            </div>
          )}
          {state === STATES.PROCESSING && (
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <div className="w-4 h-4 border-2 border-[#FF5A1F] border-t-transparent rounded-full animate-spin" />
              Analyzing recording...
            </div>
          )}
          {state === STATES.ERROR && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" strokeWidth={1.5} />
              {error}
            </div>
          )}
        </div>

        {state === STATES.ERROR && (
          <button
            data-testid="mic-retry-btn"
            onClick={() => setState(STATES.IDLE)}
            className="text-sm font-medium text-[#FF5A1F] hover:underline"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
