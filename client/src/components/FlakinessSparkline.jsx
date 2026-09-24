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
// A test case can accumulate a long run history over time — without a cap,
// the SVG's width grows linearly and forces the whole page to scroll
// horizontally at any viewport, not just phone. Showing the most recent runs
// is also the more useful view (recent flip behavior matters more than old).
const MAX_DOTS = 20;

function formatDotDate(iso) {
  if (!iso) return 'unknown date';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function FlakinessSparkline({ resultSequence }) {
  if (!resultSequence || resultSequence.length === 0) {
    return <span className="flaky-sparkline-empty">No history</span>;
  }

  const truncatedCount = Math.max(0, resultSequence.length - MAX_DOTS);
  const shown = truncatedCount > 0 ? resultSequence.slice(-MAX_DOTS) : resultSequence;

  const width = (shown.length - 1) * DOT_GAP + DOT_R * 2;
  const height = DOT_R * 2 + 2;
  const fullLabel = shown.map((entry) => `${entry.result} on ${formatDotDate(entry.date)}`).join(', ');

  return (
    <span className="flaky-sparkline-wrap">
      {truncatedCount > 0 && <span className="flaky-sparkline-truncated">+{truncatedCount} earlier </span>}
      <svg
        className="flaky-sparkline"
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-label={`Most recent result history: ${fullLabel}`}
      >
        {shown.map((entry, i) => (
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
    </span>
  );
}

export default FlakinessSparkline;
