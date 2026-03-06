/**
 * CamelotWheel – SVG Camelot Wheel component
 * Position 1 at top, clockwise. Outer ring = Major (B), inner = Minor (A).
 */

const CAMELOT_DATA = [
  { pos: 1,  major: { code: "1B",  note: "B",   name: "B Major"   }, minor: { code: "1A",  note: "Ab",  name: "Ab Minor"  } },
  { pos: 2,  major: { code: "2B",  note: "F#",  name: "F# Major"  }, minor: { code: "2A",  note: "Eb",  name: "Eb Minor"  } },
  { pos: 3,  major: { code: "3B",  note: "C#",  name: "C# Major"  }, minor: { code: "3A",  note: "Bb",  name: "Bb Minor"  } },
  { pos: 4,  major: { code: "4B",  note: "Ab",  name: "Ab Major"  }, minor: { code: "4A",  note: "F",   name: "F Minor"   } },
  { pos: 5,  major: { code: "5B",  note: "Eb",  name: "Eb Major"  }, minor: { code: "5A",  note: "C",   name: "C Minor"   } },
  { pos: 6,  major: { code: "6B",  note: "Bb",  name: "Bb Major"  }, minor: { code: "6A",  note: "G",   name: "G Minor"   } },
  { pos: 7,  major: { code: "7B",  note: "F",   name: "F Major"   }, minor: { code: "7A",  note: "D",   name: "D Minor"   } },
  { pos: 8,  major: { code: "8B",  note: "C",   name: "C Major"   }, minor: { code: "8A",  note: "A",   name: "A Minor"   } },
  { pos: 9,  major: { code: "9B",  note: "G",   name: "G Major"   }, minor: { code: "9A",  note: "E",   name: "E Minor"   } },
  { pos: 10, major: { code: "10B", note: "D",   name: "D Major"   }, minor: { code: "10A", note: "B",   name: "B Minor"   } },
  { pos: 11, major: { code: "11B", note: "A",   name: "A Major"   }, minor: { code: "11A", note: "F#",  name: "F# Minor"  } },
  { pos: 12, major: { code: "12B", note: "E",   name: "E Major"   }, minor: { code: "12A", note: "C#",  name: "C# Minor"  } },
];

const CX = 140, CY = 140;
const R_OUTER = 128, R_MID = 92, R_INNER = 58, GAP = 1.5;

function polarToXY(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function segmentPath(cx, cy, r1, r2, startDeg, endDeg) {
  const sa = startDeg + GAP, ea = endDeg - GAP;
  const p1 = polarToXY(cx, cy, r2, sa);
  const p2 = polarToXY(cx, cy, r2, ea);
  const p3 = polarToXY(cx, cy, r1, ea);
  const p4 = polarToXY(cx, cy, r1, sa);
  const lg = ea - sa > 180 ? 1 : 0;
  return [
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `A ${r2} ${r2} 0 ${lg} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    `A ${r1} ${r1} 0 ${lg} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function textPos(cx, cy, r, angleDeg) {
  return polarToXY(cx, cy, r, angleDeg);
}

export default function CamelotWheel({ activeCode, compatibleCodes = [] }) {
  return (
    <div className="flex flex-col items-center gap-3" data-testid="camelot-wheel">
      <svg
        viewBox="0 0 280 280"
        width="100%"
        style={{ maxWidth: 240 }}
        aria-label="Camelot Wheel"
      >
        {CAMELOT_DATA.map(({ pos, major, minor }) => {
          const startAngle = (pos - 1) * 30;
          const endAngle = pos * 30;
          const midAngle = startAngle + 15;

          const isMajorActive = major.code === activeCode;
          const isMajorCompat = compatibleCodes.includes(major.code);
          const isMinorActive = minor.code === activeCode;
          const isMinorCompat = compatibleCodes.includes(minor.code);

          const majorFill = isMajorActive
            ? "#CC5500"
            : isMajorCompat
            ? "#FFCCA8"
            : "#F3F4F6";

          const minorFill = isMinorActive
            ? "#CC5500"
            : isMinorCompat
            ? "#FFCCA8"
            : "#E9EBEE";

          const majorTextColor = isMajorActive ? "#fff" : isMajorCompat ? "#c43d00" : "#6B7280";
          const minorTextColor = isMinorActive ? "#fff" : isMinorCompat ? "#c43d00" : "#9CA3AF";

          // Text positions
          const majorCenter = textPos(CX, CY, (R_MID + R_OUTER) / 2, midAngle);
          const minorCenter = textPos(CX, CY, (R_INNER + R_MID) / 2, midAngle);

          return (
            <g key={pos}>
              {/* Major (outer) segment */}
              <path
                d={segmentPath(CX, CY, R_MID, R_OUTER, startAngle, endAngle)}
                fill={majorFill}
                stroke="#fff"
                strokeWidth="2"
              />
              {/* Minor (inner) segment */}
              <path
                d={segmentPath(CX, CY, R_INNER, R_MID, startAngle, endAngle)}
                fill={minorFill}
                stroke="#fff"
                strokeWidth="2"
              />
              {/* Major note label */}
              <text
                x={majorCenter.x}
                y={majorCenter.y - 5}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="8"
                fontWeight="700"
                fontFamily="Manrope, sans-serif"
                fill={majorTextColor}
              >
                {major.note}
              </text>
              <text
                x={majorCenter.x}
                y={majorCenter.y + 6}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="6"
                fontFamily="JetBrains Mono, monospace"
                fill={majorTextColor}
                opacity="0.8"
              >
                {major.code}
              </text>
              {/* Minor note label */}
              <text
                x={minorCenter.x}
                y={minorCenter.y - 4}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="7"
                fontWeight="700"
                fontFamily="Manrope, sans-serif"
                fill={minorTextColor}
              >
                {minor.note}
              </text>
              <text
                x={minorCenter.x}
                y={minorCenter.y + 5}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="5.5"
                fontFamily="JetBrains Mono, monospace"
                fill={minorTextColor}
                opacity="0.8"
              >
                {minor.code}
              </text>
            </g>
          );
        })}

        {/* Center circle */}
        <circle cx={CX} cy={CY} r={R_INNER - 4} fill="white" stroke="#F3F4F6" strokeWidth="2" />
        {activeCode && (
          <text
            x={CX}
            y={CY - 4}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fontWeight="900"
            fontFamily="Manrope, sans-serif"
            fill="#CC5500"
          >
            {activeCode}
          </text>
        )}
        {activeCode && (
          <text
            x={CX}
            y={CY + 12}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="7"
            fontFamily="JetBrains Mono, monospace"
            fill="#9CA3AF"
          >
            ACTIVE
          </text>
        )}
      </svg>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[#CC5500]" />
          <span>Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[#FFCCA8]" />
          <span>Compatible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[#F3F4F6]" />
          <span>Other</span>
        </div>
      </div>
    </div>
  );
}
