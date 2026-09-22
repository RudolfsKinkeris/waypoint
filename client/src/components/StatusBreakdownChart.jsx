import { useState } from 'react';

const SIZE = 240;
const CENTER = SIZE / 2;
const OUTER_R = 100;
const INNER_R = 60;
const HOVER_LIFT = 6;
const PAD_DEG = 1.2;

// Fixed categorical order and colors — identity is read from the legend and
// direct labels, not from any semantic hue meaning (draft isn't "blue" for a
// reason, it's just slot 1).
const STATUS_META = {
  draft: { label: 'Draft', color: '#2a78d6' },
  ready: { label: 'Ready', color: '#eb6834' },
  passed: { label: 'Passed', color: '#1baf7a' },
  failed: { label: 'Failed', color: '#eda100' },
  skipped: { label: 'Skipped', color: '#e87ba4' },
};

function polarPoint(angleDeg, radius) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CENTER + radius * Math.sin(rad), y: CENTER - radius * Math.cos(rad) };
}

function donutSlicePath(startAngle, endAngle, outerR, innerR) {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const outerStart = polarPoint(startAngle, outerR);
  const outerEnd = polarPoint(endAngle, outerR);
  const innerStart = polarPoint(startAngle, innerR);
  const innerEnd = polarPoint(endAngle, innerR);
  return `
    M ${outerStart.x} ${outerStart.y}
    A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}
    L ${innerEnd.x} ${innerEnd.y}
    A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}
    Z
  `;
}

function StatusBreakdownChart({ statuses }) {
  const [hoverStatus, setHoverStatus] = useState(null);
  const total = statuses.reduce((sum, s) => sum + s.count, 0);

  if (total === 0) {
    return (
      <div className="chart-card">
        <h3 className="chart-title">Test Coverage by Status</h3>
        <p className="chart-empty">No test cases yet.</p>
      </div>
    );
  }

  let cursor = 0;
  const slices = statuses
    .filter((s) => s.count > 0)
    .map((s) => {
      const sweep = (s.count / total) * 360;
      const pad = Math.min(PAD_DEG, sweep * 0.2);
      const slice = {
        ...s,
        meta: STATUS_META[s.status],
        startAngle: cursor + pad,
        endAngle: cursor + sweep - pad,
        midAngle: cursor + sweep / 2,
        percent: Math.round((s.count / total) * 100),
      };
      cursor += sweep;
      return slice;
    });

  const hovered = slices.find((s) => s.status === hoverStatus) || null;
  const tooltipPoint = hovered ? polarPoint(hovered.midAngle, OUTER_R + 18) : null;

  return (
    <div className="chart-card">
      <h3 className="chart-title">Test Coverage by Status</h3>
      <p className="chart-subtitle">{total} test case{total === 1 ? '' : 's'} total</p>

      <div className="chart-donut-row">
        <div className="chart-donut-svg-wrap">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="chart-svg" role="img" aria-label="Test coverage by status, donut chart">
            {slices.map((s) => (
              <path
                key={s.status}
                d={donutSlicePath(s.startAngle, s.endAngle, hoverStatus === s.status ? OUTER_R + HOVER_LIFT : OUTER_R, INNER_R)}
                fill={s.meta.color}
                onMouseEnter={() => setHoverStatus(s.status)}
                onMouseLeave={() => setHoverStatus((cur) => (cur === s.status ? null : cur))}
              />
            ))}
            <text x={CENTER} y={CENTER - 6} textAnchor="middle" className="chart-donut-total">
              {total}
            </text>
            <text x={CENTER} y={CENTER + 16} textAnchor="middle" className="chart-axis-label">
              Total
            </text>
          </svg>

          {hovered && tooltipPoint && (
            <div
              className="chart-tooltip"
              style={{ left: `${(tooltipPoint.x / SIZE) * 100}%`, top: `${(tooltipPoint.y / SIZE) * 100}%` }}
            >
              <div className="chart-tooltip-value">{hovered.count} ({hovered.percent}%)</div>
              <div className="chart-tooltip-label">{hovered.meta.label}</div>
            </div>
          )}
        </div>

        <ul className="chart-legend chart-legend-vertical">
          {statuses.map((s) => (
            <li
              className="chart-legend-item"
              key={s.status}
              onMouseEnter={() => s.count > 0 && setHoverStatus(s.status)}
              onMouseLeave={() => setHoverStatus((cur) => (cur === s.status ? null : cur))}
            >
              <span className="chart-legend-swatch" style={{ background: STATUS_META[s.status].color }} />
              {STATUS_META[s.status].label} — {s.count} ({total > 0 ? Math.round((s.count / total) * 100) : 0}%)
            </li>
          ))}
        </ul>
      </div>

      <details className="chart-table-toggle">
        <summary>View as table</summary>
        <table className="test-cases-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Count</th>
              <th>Share</th>
            </tr>
          </thead>
          <tbody>
            {statuses.map((s) => (
              <tr key={s.status}>
                <td>{STATUS_META[s.status].label}</td>
                <td>{s.count}</td>
                <td>{total > 0 ? Math.round((s.count / total) * 100) : 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

export default StatusBreakdownChart;
