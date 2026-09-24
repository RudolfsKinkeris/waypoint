import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDashboardMetrics, fetchDashboardTrends } from '../api/dashboard-api.js';
import { fetchFlakyTests } from '../api/flaky-tests-api.js';
import RunStatusBadge from '../components/RunStatusBadge.jsx';
import PassRateTrendChart from '../components/PassRateTrendChart.jsx';
import BugVelocityChart from '../components/BugVelocityChart.jsx';
import StatusBreakdownChart from '../components/StatusBreakdownChart.jsx';

const REFRESH_INTERVAL_MS = 30000;

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(minutes) {
  if (minutes === null || minutes === undefined) return '—';
  if (minutes < 1) return `${Math.round(minutes * 60)}s`;
  return `${minutes.toFixed(1)}m`;
}

function DashboardPage() {
  const [data, setData] = useState(null);
  const [trends, setTrends] = useState(null);
  const [flakyCount, setFlakyCount] = useState(null);
  const [flakyError, setFlakyError] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasLoadedOnce = useRef(false);

  // Fetched independently from the core metrics/trends below: a flaky-tests
  // outage shouldn't take down the rest of an otherwise-working dashboard.
  const loadFlakyCount = useCallback(() => {
    fetchFlakyTests()
      .then((flakyTests) => {
        setFlakyCount(flakyTests.filter((t) => t.is_flaky).length);
        setFlakyError(null);
      })
      .catch((err) => setFlakyError(err.message));
  }, []);

  const load = useCallback(() => {
    Promise.all([fetchDashboardMetrics(), fetchDashboardTrends()])
      .then(([metrics, trendsResult]) => {
        setData(metrics);
        setTrends(trendsResult);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => {
        hasLoadedOnce.current = true;
        setInitialLoading(false);
      });
    loadFlakyCount();
  }, [loadFlakyCount]);

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  if (initialLoading) {
    return (
      <div className="test-cases-page">
        <h1>Dashboard</h1>
        <div className="metric-cards">
          {[1, 2, 3, 4, 5].map((i) => (
            <div className="metric-card skeleton" key={i} />
          ))}
        </div>
        <div className="skeleton skeleton-block" />
        <div className="skeleton skeleton-block" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="test-cases-page">
        <h1>Dashboard</h1>
        <p className="error-banner">{error}</p>
        <button className="secondary" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="test-cases-page">
      <h1>Dashboard</h1>

      {error && <p className="error-banner">{error} — showing the last successfully loaded data.</p>}

      <div className="metric-cards">
        <div className="metric-card">
          <span className="metric-value">{data.metrics.total_test_cases}</span>
          <span className="metric-label">Total Test Cases</span>
          {data.metrics.total_test_cases === 0 && (
            <Link className="metric-hint" to="/test-cases">
              Add your first test case &rarr;
            </Link>
          )}
        </div>
        <div className="metric-card">
          <span className="metric-value">
            {data.metrics.pass_rate === null ? '—' : `${data.metrics.pass_rate}%`}
          </span>
          <span className="metric-label">Pass Rate</span>
          {data.metrics.pass_rate === null && <span className="metric-hint">Run a test suite to see this</span>}
        </div>
        <div className="metric-card">
          <span className="metric-value">{data.metrics.open_bugs}</span>
          <span className="metric-label">Open Bugs</span>
        </div>
        <div className="metric-card">
          <span className="metric-value">{formatDuration(data.metrics.avg_run_duration_minutes)}</span>
          <span className="metric-label">Avg Run Duration</span>
          {data.metrics.avg_run_duration_minutes === null && (
            <span className="metric-hint">No completed runs yet</span>
          )}
        </div>
        <div className="metric-card">
          <span className="metric-value">{flakyError ? '—' : flakyCount}</span>
          <span className="metric-label">Flaky Tests</span>
          {flakyError ? (
            <span className="metric-hint">Unable to load</span>
          ) : (
            <Link className="metric-hint" to="/flaky-tests">
              {flakyCount > 0 ? 'View leaderboard →' : 'View flaky test tracker →'}
            </Link>
          )}
        </div>
      </div>

      <div className="charts-grid">
        <PassRateTrendChart runs={trends.pass_rate_trend} />
        <BugVelocityChart weeks={trends.bug_velocity} />
        <StatusBreakdownChart statuses={trends.status_breakdown} />
      </div>

      <h2>Recent Test Runs</h2>
      {data.recent_runs.length === 0 ? (
        <p className="empty-cell">
          No test runs yet. <Link to="/test-suites">Start a run from a suite</Link> to see results here.
        </p>
      ) : (
        <table className="test-cases-table">
          <thead>
            <tr>
              <th>Suite</th>
              <th>Status</th>
              <th>Passed</th>
              <th>Failed</th>
              <th>Skipped</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {data.recent_runs.map((run) => (
              <tr key={run.id}>
                <td>
                  <Link className="title-link" to={`/test-runs/${run.id}`}>
                    {run.suite_name}
                  </Link>
                </td>
                <td><RunStatusBadge value={run.status} /></td>
                <td>{run.pass_count}</td>
                <td>{run.fail_count}</td>
                <td>{run.skip_count}</td>
                <td>{formatDate(run.start_time)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Recent Activity</h2>
      {data.recent_activity.length === 0 ? (
        <p className="empty-cell">
          No activity yet. Changing a bug's status or adding a comment on the <Link to="/bugs">Bugs page</Link> will
          show up here.
        </p>
      ) : (
        <ul className="activity-timeline">
          {data.recent_activity.map((item) => (
            <li key={item.id} className="activity-entry">
              <span className="activity-timestamp">{formatDate(item.timestamp)}</span>
              <span>
                <Link className="title-link" to={`/bugs/${item.bug_id}`}>
                  {item.summary}
                </Link>
                {item.message && <span className="activity-message"> — {item.message}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DashboardPage;
