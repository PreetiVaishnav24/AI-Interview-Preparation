export const scoreColor = (ratio) => (ratio >= 0.7 ? 'var(--mint)' : ratio >= 0.45 ? 'var(--amber)' : 'var(--coral)');

// value / max -> ring. label overrides the center text.
export default function ScoreRing({ value, max = 10, size = 88, label, caption }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const ratio = Math.max(0, Math.min(1, value / max));
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={`Score ${label ?? value} out of ${max}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth="6" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={scoreColor(ratio)} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - ratio)} transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-text">
        <strong style={{ fontSize: size * 0.3 }}>{label ?? value}</strong>
        {caption && <span>{caption}</span>}
      </div>
    </div>
  );
}
