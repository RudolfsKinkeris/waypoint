import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchSuites, createSuite, deleteSuite } from '../api/suites-api.js';
import SuiteStatusBadge from '../components/SuiteStatusBadge.jsx';
import SuiteFormModal from '../components/SuiteFormModal.jsx';

const STATUSES = ['draft', 'ready', 'in-progress', 'passed', 'failed'];

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function TestSuitesPage() {
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchSuites({ status: statusFilter })
      .then((data) => {
        setItems(data.items);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(payload) {
    try {
      await createSuite(payload);
      setShowForm(false);
      setFormError(null);
      load();
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this suite?')) return;
    try {
      await deleteSuite(id);
      setError(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="test-cases-page">
      <div className="page-header">
        <h1>Test Suites</h1>
        <button
          className="primary"
          onClick={() => {
            setFormError(null);
            setShowForm(true);
          }}
        >
          + Add Suite
        </button>
      </div>

      <div className="toolbar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
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
            <th>Name</th>
            <th>Feature</th>
            <th>Status</th>
            <th>Cases</th>
            <th>Updated</th>
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
              <td colSpan={6} className="empty-cell">No suites found.</td>
            </tr>
          ) : (
            items.map((suite) => (
              <tr key={suite.id}>
                <td>
                  <Link className="title-link" to={`/test-suites/${suite.id}`}>
                    {suite.name}
                  </Link>
                </td>
                <td>{suite.feature}</td>
                <td><SuiteStatusBadge value={suite.status} /></td>
                <td>{suite.case_count}</td>
                <td>{formatDate(suite.updated_at)}</td>
                <td className="row-actions">
                  <button className="icon-button" onClick={() => handleDelete(suite.id)} aria-label="Delete">
                    🗑
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showForm && (
        <SuiteFormModal error={formError} onSave={handleSave} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

export default TestSuitesPage;
