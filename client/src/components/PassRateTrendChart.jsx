import { useState } from 'react';

const WIDTH = 640;
const HEIGHT = 220;
const MARGIN = { top: 16, right: 16, bottom: 28, left: 38 };
const PLOT_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;
const GRID_VALUES = [0, 25, 50, 75, 100];
const LINE_COLOR = 'var(--app-accent)'; // brand periwinkle — resolves per-theme, unlike a literal hex

function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatFullDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function xFor(index, count) {
  if (count <= 1) return MARGIN.left + PLOT_WIDTH / 2;
  return MARGIN.left + (index / (count - 1)) * PLOT_WIDTH;
}

function yFor(value) {
  return MARGIN.top + PLOT_HEIGHT - (value / 100) * PLOT_HEIGHT;
}

function PassRateTrendChart({ runs }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (runs.length === 0) {
    return (
      <div className="chart-card">
        <h3 className="chart-title">Pass Rate Trend</h3>
        <p className="chart-empty">No test runs yet. Run a suite to start tracking this.</p>
      </div>
    );
  }

  const points = runs.map((run, i) => ({ ...run, x: xFor(i, runs.length), y: run.pass_rate === null ? null : yFor(run.pass_rate) }));

  let linePath = '';
  points.forEach((p, i) => {
    if (p.y === null) return;
    const prevDrawable = i > 0 && points[i - 1].y !== null;
    linePath += `${prevDrawable ? 'L' : 'M'} ${p.x} ${p.y} `;
  });

  const lastDrawable = [...points].reverse().find((p) => p.y !== null);
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const columnWidth = runs.length > 1 ? PLOT_WIDTH / (runs.length - 1) : PLOT_WIDTH;

  return (
    <div className="chart-card">
      <h3 className="chart-title">Pass Rate Trend</h3>
      <p className="chart-subtitle">Last {runs.length} test run{runs.length === 1 ? '' : 's'}</p>

      <div className="chart-svg-wrap">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="chart-svg" role="img" aria-label="Pass rate trend line chart">
          {GRID_VALUES.map((v) => (
            <g key={v}>
              <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={yFor(v)} y2={yFor(v)} className="chart-gridline" />
              <text x={MARGIN.left - 8} y={yFor(v)} className="chart-axis-label" textAnchor="end" dominantBaseline="middle">
                {v}%
              </text>
            </g>
          ))}

          {hovered && (
            <line
              x1={hovered.x}
              x2={hovered.x}
              y1={MARGIN.top}
              y2={MARGIN.top + PLOT_HEIGHT}
              className="chart-crosshair"
            />
          )}

          {linePath && <path d={linePath.trim()} fill="none" stroke={LINE_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}

          {points.map((p, i) =>
            p.y !== null ? (
              <circle
                key={p.run_id}
                cx={p.x}
                cy={p.y}
                r={hoverIndex === i ? 6 : 4}
                fill={LINE_COLOR}
                style={{ stroke: 'var(--chart-surface)' }}
                strokeWidth="2"
              />
            ) : null
          )}

          {lastDrawable && (
            <text x={lastDrawable.x} y={lastDrawable.y - 12} className="chart-direct-label" textAnchor="end">
              {lastDrawable.pass_rate}%
            </text>
          )}

          {points.map((p, i) => (
            <text key={p.run_id} x={p.x} y={HEIGHT - 8} className="chart-axis-label" textAnchor="middle">
              {formatShortDate(p.date)}
            </text>
          ))}

          {points.map((p, i) => (
            <rect
              key={p.run_id}
              x={p.x - columnWidth / 2}
              y={MARGIN.top}
              width={columnWidth}
              height={PLOT_HEIGHT}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex((cur) => (cur === i ? null : cur))}
            />
          ))}
        </svg>

        {hovered && (
          <div
            className="chart-tooltip"
            style={{ left: `${(hovered.x / WIDTH) * 100}%`, top: `${(MARGIN.top / HEIGHT) * 100}%` }}
          >
            <div className="chart-tooltip-value">{hovered.pass_rate === null ? '—' : `${hovered.pass_rate}%`}</div>
            <div className="chart-tooltip-label">{hovered.suite_name}</div>
            <div className="chart-tooltip-label">{formatFullDate(hovered.date)}</div>
          </div>
        )}
      </div>

      <details className="chart-table-toggle">
        <summary>View as table</summary>
        <table className="test-cases-table">
          <thead>
            <tr>
              <th>Run</th>
              <th>Suite</th>
              <th>Date</th>
              <th>Pass Rate</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.run_id}>
                <td>#{run.run_id}</td>
                <td>{run.suite_name}</td>
                <td>{formatFullDate(run.date)}</td>
                <td>{run.pass_rate === null ? '—' : `${run.pass_rate}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

export default PassRateTrendChart;
