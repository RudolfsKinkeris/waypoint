import { useCallback, useEffect, useState } from 'react';
import { fetchTestCases, createTestCase, updateTestCase, deleteTestCase } from '../api/test-cases-api.js';
import { fetchSuites } from '../api/suites-api.js';
import SeverityBadge from '../components/SeverityBadge.jsx';
import PriorityBadge from '../components/PriorityBadge.jsx';
import TestCaseFormModal from '../components/TestCaseFormModal.jsx';
import TestCaseViewModal from '../components/TestCaseViewModal.jsx';

const PAGE_SIZE = 20;
const STATUSES = ['draft', 'ready', 'passed', 'failed', 'skipped'];

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const STATUS_ROW_CLASSES = {
  passed: 'row-status-passed',
  failed: 'row-status-failed',
  draft: 'row-status-draft',
  ready: 'row-status-ready',
};

function TestCasesPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortDir, setSortDir] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalState, setModalState] = useState(null); // null | 'new' | test case object
  const [viewingTestCase, setViewingTestCase] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchTestCases({ search, status: statusFilter, sortBy, sortDir, page, pageSize: PAGE_SIZE })
      .then((data) => {
        setItems(data.items);
        setTotal(data.total);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search, statusFilter, sortBy, sortDir, page]);

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
    setPage(1);
  }

  function sortIndicator(column) {
    if (sortBy !== column) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  }

  async function handleSave(payload) {
    if (modalState === 'new') {
      await createTestCase(payload);
    } else {
      await updateTestCase(modalState.id, payload);
    }
    setModalState(null);
    load();
  }

  async function handleDelete(id) {
    let message = 'Delete this test case?';
    try {
      const { items } = await fetchSuites({ test_case_id: id });
      if (items.length > 0) {
        const names = items.map((s) => s.name).join(', ');
        message = `This test case is used in ${items.length} suite(s): ${names}. Deleting it will remove it from those suites too. Continue?`;
      }
    } catch {
      // If the usage check itself fails, fall back to the generic confirm rather than blocking deletion.
    }

    if (!window.confirm(message)) return;
    await deleteTestCase(id);
    load();
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="test-cases-page">
      <div className="page-header">
        <h1>Test Cases</h1>
        <button className="primary" onClick={() => setModalState('new')}>
          + Add Test Case
        </button>
      </div>

      <div className="toolbar">
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
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
            <th>Title</th>
            <th className="sortable" onClick={() => toggleSort('severity')}>
              Severity{sortIndicator('severity')}
            </th>
            <th className="sortable" onClick={() => toggleSort('priority')}>
              Priority{sortIndicator('priority')}
            </th>
            <th>Status</th>
            <th className="sortable" onClick={() => toggleSort('updated_at')}>
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
              <td colSpan={6} className="empty-cell">No test cases found.</td>
            </tr>
          ) : (
            items.map((tc) => (
              <tr key={tc.id} className={STATUS_ROW_CLASSES[tc.status] || ''}>
                <td>
                  <button className="link-button title-link" onClick={() => setViewingTestCase(tc)}>
                    {tc.title}
                  </button>
                </td>
                <td><SeverityBadge value={tc.severity} /></td>
                <td><PriorityBadge value={tc.priority} /></td>
                <td>{tc.status}</td>
                <td>{formatDate(tc.updated_at)}</td>
                <td className="row-actions">
                  <button className="icon-button" onClick={() => setModalState(tc)} aria-label="Edit">
                    ✎
                  </button>
                  <button className="icon-button" onClick={() => handleDelete(tc.id)} aria-label="Delete">
                    🗑
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>

      {modalState && (
        <TestCaseFormModal
          initialValue={modalState === 'new' ? null : modalState}
          onSave={handleSave}
          onClose={() => setModalState(null)}
        />
      )}

      {viewingTestCase && (
        <TestCaseViewModal testCase={viewingTestCase} onClose={() => setViewingTestCase(null)} />
      )}
    </div>
  );
}

export default TestCasesPage;
