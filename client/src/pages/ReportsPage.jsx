import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchReports } from '../api/reports-api.js';

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ReportsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    fetchReports()
      .then((data) => {
        setItems(data.items);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="test-cases-page">
      <div className="page-header">
        <h1>Reports</h1>
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
            <th title="When the test run itself executed">Run Date</th>
            <th>Total</th>
            <th>Passed</th>
            <th>Failed</th>
            <th>Skipped</th>
            <th title="When this report record was generated">Generated</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={7} className="empty-cell">Loading...</td>
            </tr>
          ) : error && items.length === 0 ? (
            <tr>
              <td colSpan={7} className="empty-cell">Couldn't load reports.</td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={7} className="empty-cell">No reports yet.</td>
            </tr>
          ) : (
            items.map((report) => (
              <tr key={report.id}>
                <td>
                  <Link
                    className="title-link"
                    to={`/reports/${report.id}`}
                    aria-label={`${report.suite_name} — generated ${formatDate(report.generated_at)}`}
                  >
                    {report.suite_name}
                  </Link>
                </td>
                <td>{formatDate(report.run_date)}</td>
                <td>{report.total_count}</td>
                <td>{report.passed_count}</td>
                <td>{report.failed_count}</td>
                <td>{report.skipped_count}</td>
                <td>{formatDate(report.generated_at)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ReportsPage;
