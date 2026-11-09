export default function StatusPill({ value, label }) {
  const tone = value || 'neutral';
  const text = label || value || 'Unknown';
  return <span className={`pill ${tone}`}>{text}</span>;
}
