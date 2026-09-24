import { useState } from 'react';

const WIDTH = 640;
const HEIGHT = 240;
const MARGIN = { top: 16, right: 16, bottom: 28, left: 30 };
const PLOT_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;
const BAR_MAX_WIDTH = 24;
const BAR_GAP = 2;
const SERIES = [
  { key: 'opened', label: 'Opened', color: '#2a78d6' },
  { key: 'closed', label: 'Closed', color: '#1baf7a' },
];

function formatWeekLabel(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function niceCeil(value) {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

// 4px rounded top corners, square baseline — a plain <rect rx> rounds every
// corner, so the bar has to be built as a path to keep the bottom square.
function roundedTopRectPath(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height);
  if (height <= 0) return '';
  return `
    M ${x} ${y + height}
    L ${x} ${y + r}
    Q ${x} ${y} ${x + r} ${y}
    L ${x + width - r} ${y}
    Q ${x + width} ${y} ${x + width} ${y + r}
    L ${x + width} ${y + height}
    Z
  `;
}

function BugVelocityChart({ weeks }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (weeks.length === 0) {
    return (
      <div className="chart-card">
        <h3 className="chart-title">Bugs Opened vs Closed</h3>
        <p className="chart-empty">No bug activity yet.</p>
      </div>
    );
  }

  const maxValue = Math.max(1, ...weeks.map((w) => Math.max(w.opened, w.closed)));
  const niceMax = niceCeil(maxValue);
  const gridValues = [0, niceMax / 4, niceMax / 2, (niceMax * 3) / 4, niceMax];

  const groupWidth = weeks.length > 0 ? PLOT_WIDTH / weeks.length : PLOT_WIDTH;
  const barWidth = Math.min(BAR_MAX_WIDTH, (groupWidth - BAR_GAP - 12) / 2);

  function yFor(value) {
    return MARGIN.top + PLOT_HEIGHT - (value / niceMax) * PLOT_HEIGHT;
  }

  const hovered = hoverIndex !== null ? weeks[hoverIndex] : null;

  return (
    <div className="chart-card">
      <h3 className="chart-title">Bugs Opened vs Closed</h3>
      <p className="chart-subtitle">Last {weeks.length} weeks</p>

      <div className="chart-legend">
        {SERIES.map((s) => (
          <span className="chart-legend-item" key={s.key}>
            <span className="chart-legend-swatch" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <div className="chart-svg-wrap">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="chart-svg" role="img" aria-label="Bugs opened versus closed per week, grouped bar chart">
          {gridValues.map((v) => (
            <g key={v}>
              <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={yFor(v)} y2={yFor(v)} className="chart-gridline" />
              <text x={MARGIN.left - 8} y={yFor(v)} className="chart-axis-label" textAnchor="end" dominantBaseline="middle">
                {Math.round(v)}
              </text>
            </g>
          ))}

          {weeks.map((week, i) => {
            const groupX = MARGIN.left + i * groupWidth;
            if (hoverIndex !== i) return null;
            return (
              <rect
                key={week.week_start}
                x={groupX + 2}
                y={MARGIN.top}
                width={groupWidth - 4}
                height={PLOT_HEIGHT}
                className="chart-hover-highlight"
              />
            );
          })}

          {weeks.map((week, i) => {
            const groupX = MARGIN.left + i * groupWidth;
            const pairWidth = barWidth * 2 + BAR_GAP;
            const pairStart = groupX + (groupWidth - pairWidth) / 2;
            const openedHeight = (week.opened / niceMax) * PLOT_HEIGHT;
            const closedHeight = (week.closed / niceMax) * PLOT_HEIGHT;
            return (
              <g key={week.week_start}>
                <path d={roundedTopRectPath(pairStart, yFor(week.opened), barWidth, openedHeight, 4)} fill={SERIES[0].color} />
                <path
                  d={roundedTopRectPath(pairStart + barWidth + BAR_GAP, yFor(week.closed), barWidth, closedHeight, 4)}
                  fill={SERIES[1].color}
                />
              </g>
            );
          })}

          {weeks.map((week, i) => (
            <text key={week.week_start} x={MARGIN.left + i * groupWidth + groupWidth / 2} y={HEIGHT - 8} className="chart-axis-label" textAnchor="middle">
              {formatWeekLabel(week.week_start)}
            </text>
          ))}

          {weeks.map((week, i) => (
            <rect
              key={week.week_start}
              x={MARGIN.left + i * groupWidth}
              y={MARGIN.top}
              width={groupWidth}
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
            style={{
              left: `${((MARGIN.left + hoverIndex * groupWidth + groupWidth / 2) / WIDTH) * 100}%`,
              top: `${(MARGIN.top / HEIGHT) * 100}%`,
            }}
          >
            <div className="chart-tooltip-label">Week of {formatWeekLabel(hovered.week_start)}</div>
            <div className="chart-tooltip-value">{hovered.opened} opened</div>
            <div className="chart-tooltip-value">{hovered.closed} closed</div>
          </div>
        )}
      </div>

      <details className="chart-table-toggle">
        <summary>View as table</summary>
        <table className="test-cases-table">
          <thead>
            <tr>
              <th>Week Of</th>
              <th>Opened</th>
              <th>Closed</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={week.week_start}>
                <td>{formatWeekLabel(week.week_start)}</td>
                <td>{week.opened}</td>
                <td>{week.closed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

export default BugVelocityChart;
