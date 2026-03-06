/**
 * KeySenseLogo — SVG recreation of the brand logo
 * K lettermark (gray lower-arm accent) + "Keys" + mic icon + "nse" wordmark
 */
export default function KeySenseLogo({ className = "" }) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`} aria-label="KeySense">
      {/* ── Wordmark: Keys + mic + nse ── */}
      <div
        className="flex items-center leading-none text-gray-900"
        style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: "-0.04em" }}
      >
        <span>Keys</span>

        {/* Inline microphone icon replacing the "e" */}
        <svg
          width="13"
          height="21"
          viewBox="0 0 13 21"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          style={{ display: "inline-block", verticalAlign: "middle", margin: "0 1.5px", marginTop: -3 }}
        >
          {/* Capsule body */}
          <rect
            x="2.25"
            y="0.75"
            width="8.5"
            height="12.5"
            rx="4.25"
            stroke="#CC5500"
            strokeWidth="1.6"
          />
          {/* Arc / collar */}
          <path
            d="M0.75 9.5 C0.75 14.5 12.25 14.5 12.25 9.5"
            stroke="#CC5500"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
          {/* Stem */}
          <line
            x1="6.5"
            y1="14.5"
            x2="6.5"
            y2="18.5"
            stroke="#CC5500"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {/* Base */}
          <line
            x1="3.5"
            y1="18.5"
            x2="9.5"
            y2="18.5"
            stroke="#CC5500"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>

        <span>nse</span>
      </div>
    </div>
  );
}
