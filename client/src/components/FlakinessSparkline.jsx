// Reuses the exact pass/fail colors StatusBreakdownChart already established for
// this app, plus a neutral gray for skipped — semantic consistency across charts
// beats picking a new hue just for this component.
const RESULT_COLORS = {
  passed: '#1baf7a',
  failed: '#eda100',
  skipped: '#9aa0a6',
};

const DOT_R = 4;
const DOT_GAP = 12;

function formatDotDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function FlakinessSparkline({ resultSequence }) {
  if (!resultSequence || resultSequence.length === 0) {
    return <span className="flaky-sparkline-empty">No history</span>;
  }

  const width = (resultSequence.length - 1) * DOT_GAP + DOT_R * 2;
  const height = DOT_R * 2 + 2;

  return (
    <svg
      className="flaky-sparkline"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={`Result history: ${resultSequence.map((entry) => entry.result).join(', ')}`}
    >
      {resultSequence.map((entry, i) => (
        <circle
          key={entry.run_id}
          cx={DOT_R + i * DOT_GAP}
          cy={height / 2}
          r={DOT_R}
          fill={RESULT_COLORS[entry.result] || RESULT_COLORS.skipped}
        >
          <title>{`${entry.result} — ${formatDotDate(entry.date)}`}</title>
        </circle>
      ))}
    </svg>
  );
}

export default FlakinessSparkline;
