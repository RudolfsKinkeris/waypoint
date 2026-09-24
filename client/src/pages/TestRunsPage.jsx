import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchRuns } from '../api/test-runs-api.js';
import RunStatusBadge from '../components/RunStatusBadge.jsx';

const REFRESH_INTERVAL_MS = 30000;

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TestRunsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    fetchRuns()
      .then((data) => {
        setItems(data.items);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    // In-progress runs' counts change as testers work through them — refresh
    // periodically so this list doesn't sit stale without a manual reload,
    // matching the same interval DashboardPage already uses.
    const interval = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div className="test-cases-page">
      <div className="page-header">
        <h1>Test Runs</h1>
      </div>

      {error && (
        <p className="error-banner" role="alert">
          {error}{' '}
          <button className="link-button" onClick={load}>
            Retry
          </button>
        </p>
      )}

      <table className="test-cases-table">
        <thead>
          <tr>
            <th>Suite</th>
            <th>Status</th>
            <th>Passed</th>
            <th>Failed</th>
            <th>Skipped</th>
            <th>Started</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="empty-cell">Loading...</td>
            </tr>
          ) : error && items.length === 0 ? (
            <tr>
              <td colSpan={6} className="empty-cell">Couldn't load test runs.</td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={6} className="empty-cell">No test runs yet.</td>
            </tr>
          ) : (
            items.map((run) => (
              <tr key={run.id}>
                <td>
                  <Link
                    className="title-link"
                    to={`/test-runs/${run.id}`}
                    aria-label={`${run.suite_name}, started ${formatDate(run.start_time)}`}
                  >
                    {run.suite_name}
                  </Link>
                </td>
                <td><RunStatusBadge value={run.status} /></td>
                <td>{run.pass_count}</td>
                <td>{run.fail_count}</td>
                <td>{run.skip_count}</td>
                <td>{formatDate(run.start_time)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default TestRunsPage;
