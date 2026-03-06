import { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import UploadZone from "./components/UploadZone";
import ResultsPanel from "./components/ResultsPanel";
import SongLibrary from "./components/SongLibrary";
import MicRecorder from "./components/MicRecorder";
import { Mic, Library, X } from "lucide-react";
import KeySenseLogo from "./components/KeySenseLogo";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function App() {
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [library, setLibrary] = useState([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showMic, setShowMic] = useState(false);

  const fetchLibrary = async () => {
    try {
      const { data } = await axios.get(`${API}/library`);
      setLibrary(data);
    } catch (e) {
      console.error("Failed to fetch library", e);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  const analyzeFile = async (file) => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const url = URL.createObjectURL(file);
    setAudioFile(file);
    setAudioUrl(url);
    setIsAnalyzing(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await axios.post(`${API}/analyze`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
      fetchLibrary();
      toast.success(`${data.key} ${data.scale} detected`);
    } catch (e) {
      const msg = e?.response?.data?.detail || "Analysis failed";
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioFile(null);
    setAudioUrl(null);
    setResult(null);
    setIsAnalyzing(false);
  };

  const handleDeleteTrack = async (id) => {
    try {
      await axios.delete(`${API}/library/${id}`);
      fetchLibrary();
      toast.success("Track removed");
    } catch {
      toast.error("Failed to remove track");
    }
  };

  const handleMicResult = (data, blobUrl) => {
    setResult(data);
    setAudioUrl(blobUrl);
    fetchLibrary();
    setShowMic(false);
  };

  return (
    <div className="min-h-screen bg-white" data-testid="app-container">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100" data-testid="app-header">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={handleReset} className="group" data-testid="logo-btn">
            <KeySenseLogo className="group-hover:opacity-90 transition-opacity" />
          </button>

          <div className="flex items-center gap-2">
            <button
              data-testid="mic-btn"
              onClick={() => setShowMic(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#CC5500] border border-gray-200 hover:border-[#CC5500] rounded-full transition-colors"
            >
              <Mic className="w-4 h-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">Mic Input</span>
            </button>
            <button
              data-testid="library-btn"
              onClick={() => setShowLibrary(!showLibrary)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
                showLibrary
                  ? "bg-[#CC5500] text-white border-[#CC5500]"
                  : "text-gray-600 hover:text-[#CC5500] border-gray-200 hover:border-[#CC5500]"
              }`}
            >
              <Library className="w-4 h-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">Library</span>
              {library.length > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${showLibrary ? "bg-white/20" : "bg-[#CC5500] text-white"}`}>
                  {library.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {!result && !isAnalyzing && (
          <UploadZone onFileSelected={analyzeFile} />
        )}

        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-40 gap-6" data-testid="analyzing-state">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-gray-100 rounded-full" />
              <div className="absolute inset-0 w-20 h-20 border-4 border-[#CC5500] border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-gray-800 text-lg font-semibold font-manrope">Analyzing audio...</p>
              <p className="text-gray-400 text-sm mt-1 font-mono">{audioFile?.name}</p>
            </div>
            <div className="flex gap-1 mt-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-1.5 bg-[#CC5500] rounded-full animate-bounce"
                  style={{ height: `${12 + i * 6}px`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {result && !isAnalyzing && (
          <ResultsPanel
            result={result}
            audioUrl={audioUrl}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Song Library Drawer */}
      {showLibrary && (
        <div className="fixed inset-0 z-40 flex" data-testid="library-panel">
          <div
            className="flex-1 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowLibrary(false)}
          />
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-hidden animate-slide-in-right">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="font-bold text-lg font-manrope">Song Library</h2>
              <button
                data-testid="close-library-btn"
                onClick={() => setShowLibrary(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <SongLibrary
              tracks={library}
              onDelete={handleDeleteTrack}
              onSelect={(track) => {
                setResult(track);
                setAudioUrl(null);
                setShowLibrary(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Mic Recorder Modal */}
      {showMic && (
        <MicRecorder
          onResult={handleMicResult}
          onClose={() => setShowMic(false)}
          apiUrl={`${API}/analyze`}
        />
      )}
    </div>
  );
}
