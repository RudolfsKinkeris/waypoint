import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchReport, exportReportHtmlUrl, printReportHtmlUrl } from '../api/reports-api.js';
import ResultBadge from '../components/ResultBadge.jsx';

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

function ReportDetailPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchReport(id)
      .then((data) => {
        setReport(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading && !report) return <div className="test-cases-page">Loading...</div>;
  if (error) {
    return (
      <div className="test-cases-page">
        <Link to="/reports" className="link-button">
          &larr; Back to Reports
        </Link>
        <p className="error-banner">{error}</p>
      </div>
    );
  }
  if (!report) return null;

  return (
    <div className="test-cases-page">
      <Link to="/reports" className="link-button">
        &larr; Back to Reports
      </Link>

      <div className="page-header">
        <div>
          <h1>{report.suite_name}</h1>
          <p className="suite-meta">
            Run date: {formatDate(report.run_date)} · Generated: {formatDate(report.generated_at)}
          </p>
        </div>
        <div className="row-actions">
          <a className="secondary" href={exportReportHtmlUrl(report.id)}>
            Download HTML
          </a>
          <button
            className="secondary"
            onClick={() => window.open(printReportHtmlUrl(report.id), '_blank')}
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      <div className="metric-cards">
        <div className="metric-card">
          <span className="metric-value">{report.total_count}</span>
          <span className="metric-label">Total</span>
        </div>
        <div className="metric-card">
          <span className="metric-value">{report.passed_count}</span>
          <span className="metric-label">Passed</span>
        </div>
        <div className="metric-card">
          <span className="metric-value">{report.failed_count}</span>
          <span className="metric-label">Failed</span>
        </div>
        <div className="metric-card">
          <span className="metric-value">{report.skipped_count}</span>
          <span className="metric-label">Skipped</span>
        </div>
      </div>

      <table className="test-cases-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Severity</th>
            <th>Priority</th>
            <th>Result</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {report.results.map((result, index) => (
            <tr key={index}>
              <td>{result.title}</td>
              <td>{result.severity}</td>
              <td>{result.priority}</td>
              <td><ResultBadge value={result.result} /></td>
              <td>{result.notes || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ReportDetailPage;
