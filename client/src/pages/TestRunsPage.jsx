import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchRuns } from '../api/test-runs-api.js';
import RunStatusBadge from '../components/RunStatusBadge.jsx';

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

  useEffect(() => {
    fetchRuns()
      .then((data) => {
        setItems(data.items);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="test-cases-page">
      <div className="page-header">
        <h1>Test Runs</h1>
      </div>

      {error && <p className="error-banner">{error}</p>}

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
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={6} className="empty-cell">No test runs yet.</td>
            </tr>
          ) : (
            items.map((run) => (
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
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default TestRunsPage;
