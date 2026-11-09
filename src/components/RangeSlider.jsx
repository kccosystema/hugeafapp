import './RangeSlider.css'

// 0–100 slider matching the Gym Candy design: label (+ optional icon) on the
// left, value/100 on the right, pink filled track, white thumb.
export default function RangeSlider({ label, icon, value, onChange, accent = '#DA2A24' }) {
  const v = Number(value) || 0
  return (
    <div className="rs">
      <div className="rs-head">
        <span className="rs-label">
          {icon && <span className="rs-icon">{icon}</span>}
          {label}
        </span>
        <span className="rs-value">{v}<span>/100</span></span>
      </div>
      <div className="rs-track" style={{ '--rs-pct': `${v}%`, '--rs-accent': accent }}>
        <input
          type="range" min="0" max="100" step="1" value={v}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
        />
      </div>
    </div>
  )
}
