import { Trash2, Download, Music, Clock } from "lucide-react";

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const formatDuration = (sec) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const SCALE_BADGE = {
  Major: "bg-emerald-50 text-emerald-700",
  Minor: "bg-blue-50 text-blue-700",
  "Harmonic Minor": "bg-purple-50 text-purple-700",
  "Melodic Minor": "bg-amber-50 text-amber-700",
};

export default function SongLibrary({ tracks, onDelete, onExport, onSelect }) {
  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-12 text-center" data-testid="library-empty">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
          <Music className="w-7 h-7 text-gray-300" strokeWidth={1.5} />
        </div>
        <div>
          <p className="font-semibold text-gray-700 font-manrope">No tracks yet</p>
          <p className="text-sm text-gray-400 mt-1">Analyzed tracks will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto" data-testid="library-list">
      <div className="divide-y divide-gray-50">
        {tracks.map((track) => (
          <div
            key={track.id}
            data-testid={`library-track-${track.id}`}
            className="px-6 py-4 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex items-start gap-3">
              {/* Key badge */}
              <button
                onClick={() => onSelect(track)}
                className="w-12 h-12 flex-shrink-0 bg-[#CC5500] text-white rounded-xl flex items-center justify-center font-black font-manrope text-lg hover:bg-[#AA4400] transition-colors active:scale-95"
                data-testid={`track-select-${track.id}`}
              >
                {track.key}
              </button>

              {/* Info */}
              <button className="flex-1 text-left min-w-0" onClick={() => onSelect(track)}>
                <p className="text-sm font-semibold text-gray-800 truncate">{track.filename}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SCALE_BADGE[track.scale] || "bg-gray-50 text-gray-600"}`}>
                    {track.scale}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{track.bpm} BPM</span>
                  <span className="text-xs text-gray-400 font-mono">{track.camelot}</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" strokeWidth={1.5} />
                  {formatDate(track.analyzed_at)}
                  <span className="mx-1">·</span>
                  {formatDuration(track.duration)}
                </div>
              </button>

              {/* Actions */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  data-testid={`track-export-${track.id}`}
                  onClick={() => onExport(track.id)}
                  className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-400 hover:text-[#CC5500]"
                  title="Export"
                >
                  <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
                <button
                  data-testid={`track-delete-${track.id}`}
                  onClick={() => onDelete(track.id)}
                  className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-500"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
