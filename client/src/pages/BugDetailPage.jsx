import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchBug, changeBugStatus, addBugComment } from '../api/bugs-api.js';
import SeverityBadge from '../components/SeverityBadge.jsx';
import PriorityBadge from '../components/PriorityBadge.jsx';
import BugStatusBadge from '../components/BugStatusBadge.jsx';

function formatTimestamp(iso) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function BugDetailPage() {
  const { id } = useParams();
  const [bug, setBug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [nextStatus, setNextStatus] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchBug(id)
      .then((data) => {
        setBug(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleStatusChange(e) {
    e.preventDefault();
    if (!nextStatus) return;
    setActionError(null);
    setSubmitting(true);
    try {
      await changeBugStatus(id, nextStatus, statusMessage.trim());
      setNextStatus('');
      setStatusMessage('');
      load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setActionError(null);
    setSubmitting(true);
    try {
      await addBugComment(id, commentText.trim());
      setCommentText('');
      load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && !bug) return <div className="test-cases-page">Loading...</div>;
  if (error) {
    return (
      <div className="test-cases-page">
        <Link to="/bugs" className="link-button">
          &larr; Back to Bugs
        </Link>
        <p className="error-banner">{error}</p>
      </div>
    );
  }
  if (!bug) return null;

  const nextOptions = bug.allowed_next_statuses || [];

  return (
    <div className="test-cases-page">
      <Link to="/bugs" className="link-button">
        &larr; Back to Bugs
      </Link>

      <div className="page-header">
        <div>
          <h1>{bug.title}</h1>
          <div className="view-badges">
            <SeverityBadge value={bug.severity} />
            <PriorityBadge value={bug.priority} />
            <BugStatusBadge value={bug.status} />
          </div>
        </div>
      </div>

      {actionError && <p className="error-banner">{actionError}</p>}

      {bug.description && (
        <div className="view-section">
          <h3>Description</h3>
          <p>{bug.description}</p>
        </div>
      )}

      <div className="view-section">
        <h3>Steps to Reproduce</h3>
        <ol>
          {bug.steps_to_reproduce.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="view-section">
        <h3>Expected</h3>
        <p>{bug.expected}</p>
      </div>

      <div className="view-section">
        <h3>Actual</h3>
        <p>{bug.actual}</p>
      </div>

      {bug.environment && (
        <div className="view-section">
          <h3>Environment</h3>
          <p>{bug.environment}</p>
        </div>
      )}

      <h2>Change Status</h2>
      {nextOptions.length === 0 ? (
        <p className="empty-cell">No further status transitions are allowed from "{bug.status}".</p>
      ) : (
        <form className="toolbar" onSubmit={handleStatusChange}>
          <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
            <option value="">Move to...</option>
            {nextOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Optional note about this change..."
            value={statusMessage}
            onChange={(e) => setStatusMessage(e.target.value)}
          />
          <button type="submit" className="primary" disabled={!nextStatus || submitting}>
            Update Status
          </button>
        </form>
      )}

      <h2>Activity Timeline</h2>
      {bug.activity.length === 0 ? (
        <p className="empty-cell">No activity yet.</p>
      ) : (
        <ul className="activity-timeline">
          {bug.activity.map((entry) => (
            <li key={entry.id} className="activity-entry">
              <span className="activity-timestamp">{formatTimestamp(entry.timestamp)}</span>
              {entry.action === 'status_change' ? (
                <span>
                  Status changed from <BugStatusBadge value={entry.old_value} /> to{' '}
                  <BugStatusBadge value={entry.new_value} />
                  {entry.message && <span className="activity-message"> — {entry.message}</span>}
                </span>
              ) : (
                <span className="activity-message">💬 {entry.message}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <form className="toolbar" onSubmit={handleAddComment}>
        <input
          type="text"
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        <button type="submit" className="primary" disabled={!commentText.trim() || submitting}>
          Add Comment
        </button>
      </form>
    </div>
  );
}

export default BugDetailPage;
