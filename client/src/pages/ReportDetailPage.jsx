import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchReport, exportReportHtmlUrl, printReportHtmlUrl } from '../api/reports-api.js';
import ResultBadge from '../components/ResultBadge.jsx';

function formatDate(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
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
  const [actionError, setActionError] = useState(null);
  const latestRequestId = useRef(0);

  useEffect(() => {
    setLoading(true);
    const requestId = ++latestRequestId.current;
    fetchReport(id)
      .then((data) => {
        if (requestId !== latestRequestId.current) return; // navigated to a different report meanwhile
        setReport(data);
        setError(null);
      })
      .catch((err) => {
        if (requestId === latestRequestId.current) setError(err.message);
      })
      .finally(() => {
        if (requestId === latestRequestId.current) setLoading(false);
      });
  }, [id]);

  // A plain <a href> download would, on failure, navigate the whole app away
  // to the raw JSON error response instead of just failing the download —
  // fetching it ourselves keeps the failure contained to an inline message.
  async function handleDownloadHtml() {
    setActionError(null);
    try {
      const res = await fetch(exportReportHtmlUrl(report.id));
      if (!res.ok) {
        let message = 'Download failed. Please try again.';
        try {
          const body = await res.json();
          if (body?.error) message = body.error;
        } catch {
          // Response wasn't JSON — keep the generic message.
        }
        throw new Error(message);
      }
      const disposition = res.headers.get('Content-Disposition') || '';
      const filenameMatch = /filename="([^"]+)"/.exec(disposition);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filenameMatch ? filenameMatch[1] : `report-${report.id}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setActionError(err.message);
    }
  }

  function handlePrint() {
    setActionError(null);
    const win = window.open(printReportHtmlUrl(report.id), '_blank', 'noopener,noreferrer');
    if (!win) {
      setActionError('Pop-up blocked — allow pop-ups for this site, or use Download HTML instead.');
    }
  }

  if (loading && !report) {
    return (
      <div className="test-cases-page" aria-live="polite">
        Loading...
      </div>
    );
  }
  if (error) {
    return (
      <div className="test-cases-page">
        <Link to="/reports" className="link-button">
          &larr; Back to Reports
        </Link>
        <p className="error-banner" role="alert">
          {error}
        </p>
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
          <button className="secondary" onClick={handleDownloadHtml}>
            Download HTML
          </button>
          <button className="secondary" onClick={handlePrint} aria-label="Print or save as PDF (opens in a new tab)">
            Print / Save as PDF
          </button>
        </div>
      </div>

      {actionError && (
        <p className="error-banner" role="alert">
          {actionError}
        </p>
      )}

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
          {report.results.length === 0 ? (
            <tr>
              <td colSpan={5} className="empty-cell">No results in this report.</td>
            </tr>
          ) : (
            report.results.map((result, index) => (
              <tr key={index}>
                <td>{result.title}</td>
                <td>{result.severity}</td>
                <td>{result.priority}</td>
                <td><ResultBadge value={result.result} /></td>
                <td>{result.notes || '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ReportDetailPage;
