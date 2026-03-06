import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Mic, Square, X, AlertCircle, CheckCircle } from "lucide-react";

const STATES = {
  IDLE: "idle",
  RECORDING: "recording",
  ANALYZING: "analyzing",
  DONE: "done",
  ERROR: "error",
};

// Minimum recording before we attempt analysis
const MIN_RECORD_SECS = 8;
// Auto-stop if no result after this many seconds
const MAX_RECORD_SECS = 45;

export default function MicRecorder({ onResult, onClose, apiUrl }) {
  const [state, setState] = useState(STATES.IDLE);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");

  const mediaRef  = useRef(null);
  const chunksRef = useRef([]);
  const timerRef  = useRef(null);
  const secondsRef = useRef(0);
  const analyzingRef = useRef(false);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const sendForAnalysis = async (chunks) => {
    if (analyzingRef.current) return;
    analyzingRef.current = true;

    const blob = new Blob(chunks, { type: "audio/webm" });
    const blobUrl = URL.createObjectURL(blob);
    setState(STATES.ANALYZING);

    const formData = new FormData();
    formData.append("file", blob, "recording.webm");

    try {
      const { data } = await axios.post(apiUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setState(STATES.DONE);
      setTimeout(() => onResult(data, blobUrl), 600);
    } catch (e) {
      URL.revokeObjectURL(blobUrl);
      const msg = e?.response?.data?.detail || "Analysis failed";
      setError(msg);
      setState(STATES.ERROR);
    } finally {
      analyzingRef.current = false;
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    if (mediaRef.current?.state === "recording") {
      mediaRef.current.stop();
    }
  };

  const startRecording = async () => {
    setError("");
    analyzingRef.current = false;
    chunksRef.current = [];
    secondsRef.current = 0;
    setSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        sendForAnalysis([...chunksRef.current]);
      };

      mr.start(500); // collect chunks every 500ms
      mediaRef.current = mr;
      setState(STATES.RECORDING);

      timerRef.current = setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);

        // Auto-stop at max duration
        if (secondsRef.current >= MAX_RECORD_SECS) {
          stopRecording();
        }
      }, 1000);
    } catch (e) {
      setError("Microphone access denied. Please allow mic permissions.");
      setState(STATES.ERROR);
    }
  };

  const handleStopClick = () => stopRecording();

  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const progress = Math.min(100, (seconds / MAX_RECORD_SECS) * 100);

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
          <p className="text-sm text-gray-500 mt-1">
            {state === STATES.IDLE
              ? `Records up to ${MAX_RECORD_SECS}s — stops automatically when key is found`
              : state === STATES.RECORDING
              ? "Listening… will stop when key is detected"
              : state === STATES.ANALYZING
              ? "Analyzing recording..."
              : state === STATES.DONE
              ? "Done!"
              : ""}
          </p>
        </div>

        {/* Mic button */}
        <div className="relative flex items-center justify-center">
          {state === STATES.RECORDING && (
            <>
              <div className="absolute w-28 h-28 rounded-full bg-[#CC5500]/20 animate-ping" />
              <div className="absolute w-24 h-24 rounded-full bg-[#CC5500]/10" />
            </>
          )}
          {state === STATES.DONE && (
            <div className="absolute w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-emerald-500" strokeWidth={1.5} />
            </div>
          )}

          <button
            data-testid="mic-record-btn"
            onClick={state === STATES.RECORDING ? handleStopClick : startRecording}
            disabled={state === STATES.ANALYZING || state === STATES.DONE}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 disabled:opacity-40
              ${state === STATES.RECORDING
                ? "bg-red-500 hover:bg-red-600"
                : state === STATES.DONE
                ? "bg-emerald-500"
                : "bg-[#CC5500] hover:bg-[#AA4400]"
              }`}
          >
            {state === STATES.RECORDING ? (
              <Square className="w-7 h-7 text-white" fill="white" />
            ) : state === STATES.ANALYZING ? (
              <div className="w-6 h-6 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
            ) : state === STATES.DONE ? (
              <CheckCircle className="w-7 h-7 text-white" />
            ) : (
              <Mic className="w-7 h-7 text-white" strokeWidth={1.5} />
            )}
          </button>
        </div>

        {/* Timer + progress bar */}
        {state === STATES.RECORDING && (
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-600 font-semibold">REC {fmt(seconds)}</span>
              </div>
              <span>{MAX_RECORD_SECS - seconds}s max</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#CC5500] rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Sound bars */}
            <div className="flex items-end justify-center gap-0.5 h-6 pt-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-1.5 bg-[#CC5500] rounded-full sound-bar"
                  style={{ animationDelay: `${i * 0.12}s`, height: "100%" }}
                />
              ))}
            </div>
          </div>
        )}

        {state === STATES.ANALYZING && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="w-4 h-4 border-2 border-[#CC5500] border-t-transparent rounded-full animate-spin" />
            Detecting key and BPM...
          </div>
        )}

        {state === STATES.ERROR && (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" strokeWidth={1.5} />
              {error}
            </div>
            <button
              data-testid="mic-retry-btn"
              onClick={() => setState(STATES.IDLE)}
              className="text-sm font-medium text-[#CC5500] hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {state === STATES.IDLE && (
          <p className="text-xs text-gray-400 text-center">
            Press the mic button to start. Recording stops automatically once the key is found.
          </p>
        )}
      </div>
    </div>
  );
}
