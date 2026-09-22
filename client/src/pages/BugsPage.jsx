import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchBugs, createBug, deleteBug } from '../api/bugs-api.js';
import SeverityBadge from '../components/SeverityBadge.jsx';
import PriorityBadge from '../components/PriorityBadge.jsx';
import BugStatusBadge from '../components/BugStatusBadge.jsx';
import BugFormModal from '../components/BugFormModal.jsx';

const STATUSES = ['open', 'in-progress', 'resolved', 'closed', 'reopened'];
const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function BugsPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortDir, setSortDir] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchBugs({ search, status: statusFilter, severity: severityFilter, sortBy, sortDir })
      .then((data) => {
        setItems(data.items);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search, statusFilter, severityFilter, sortBy, sortDir]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleSort(column) {
    if (sortBy === column) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  }

  // A <th onClick> alone isn't keyboard-operable — this makes it act like a button.
  function sortableHeaderProps(column) {
    return {
      className: 'sortable',
      role: 'button',
      tabIndex: 0,
      onClick: () => toggleSort(column),
      onKeyDown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleSort(column);
        }
      },
    };
  }

  function sortIndicator(column) {
    if (sortBy !== column) return null;
    return <span aria-hidden="true"> {sortDir === 'asc' ? '▲' : '▼'}</span>;
  }

  async function handleSave(payload) {
    try {
      await createBug(payload);
      setShowForm(false);
      setFormError(null);
      load();
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this bug?')) return;
    try {
      await deleteBug(id);
      setError(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="test-cases-page">
      <div className="page-header">
        <h1>Bugs</h1>
        <button
          className="primary"
          onClick={() => {
            setFormError(null);
            setShowForm(true);
          }}
        >
          + Report Bug
        </button>
      </div>

      <div className="toolbar">
        <input
          type="text"
          aria-label="Search title and description"
          placeholder="Search title & description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select aria-label="Filter by severity" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
          <option value="">All severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="error-banner">{error}</p>}

      <table className="test-cases-table">
        <thead>
          <tr>
            <th {...sortableHeaderProps('title')}>
              Title{sortIndicator('title')}
            </th>
            <th {...sortableHeaderProps('severity')}>
              Severity{sortIndicator('severity')}
            </th>
            <th {...sortableHeaderProps('priority')}>
              Priority{sortIndicator('priority')}
            </th>
            <th {...sortableHeaderProps('status')}>
              Status{sortIndicator('status')}
            </th>
            <th {...sortableHeaderProps('updated_at')}>
              Updated{sortIndicator('updated_at')}
            </th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="empty-cell">Loading...</td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={6} className="empty-cell">No bugs found.</td>
            </tr>
          ) : (
            items.map((bug) => (
              <tr key={bug.id}>
                <td>
                  <Link className="title-link" to={`/bugs/${bug.id}`}>
                    {bug.title}
                  </Link>
                </td>
                <td><SeverityBadge value={bug.severity} /></td>
                <td><PriorityBadge value={bug.priority} /></td>
                <td><BugStatusBadge value={bug.status} /></td>
                <td>{formatDate(bug.updated_at)}</td>
                <td className="row-actions">
                  <button className="icon-button" onClick={() => handleDelete(bug.id)} aria-label="Delete">
                    🗑
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showForm && (
        <BugFormModal error={formError} onSave={handleSave} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

export default BugsPage;
