import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchSuite, addSuiteCase, removeSuiteCase, reorderSuiteCases } from '../api/suites-api.js';
import { fetchTestCases } from '../api/test-cases-api.js';
import { createRun } from '../api/test-runs-api.js';
import SeverityBadge from '../components/SeverityBadge.jsx';
import PriorityBadge from '../components/PriorityBadge.jsx';
import SuiteStatusBadge from '../components/SuiteStatusBadge.jsx';

function SuiteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [suite, setSuite] = useState(null);
  const [allTestCases, setAllTestCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchSuite(id)
      .then((data) => {
        setSuite(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchTestCases({ pageSize: 100 })
      .then((data) => setAllTestCases(data.items))
      .catch((err) => setActionError(`Couldn't load test cases to add: ${err.message}`));
  }, []);

  async function handleAddCase(e) {
    e.preventDefault();
    if (!selectedCaseId || busy) return;
    setActionError(null);
    setBusy(true);
    try {
      await addSuiteCase(id, Number(selectedCaseId));
      setSelectedCaseId('');
      load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveCase(testCaseId, title) {
    if (busy) return;
    if (!window.confirm(`Remove "${title}" from this suite?`)) return;
    setActionError(null);
    setBusy(true);
    try {
      await removeSuiteCase(id, testCaseId);
      load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function handleDragStart(index) {
    setDragIndex(index);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  async function handleNewRun() {
    setActionError(null);
    try {
      const run = await createRun(Number(id));
      navigate(`/test-runs/${run.id}`);
    } catch (err) {
      setActionError(err.message);
    }
  }

  // Shared by both the drag handle (desktop) and the Up/Down buttons (a
  // touch-friendly fallback — native HTML5 drag-and-drop generally doesn't
  // fire on mobile touchscreens, so reordering would otherwise be
  // desktop-only). Guarded by `busy` so rapid taps (the exact scenario the
  // buttons exist for) can't fire overlapping reorder requests built from
  // different optimistic snapshots.
  async function moveCase(fromIndex, toIndex) {
    if (busy || fromIndex === toIndex || toIndex < 0 || toIndex >= suite.cases.length) return;
    const originalCases = suite.cases;
    const reordered = [...originalCases];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setActionError(null);
    setBusy(true);
    setSuite({ ...suite, cases: reordered });
    try {
      await reorderSuiteCases(id, reordered.map((c) => c.id));
      load();
    } catch (err) {
      setSuite({ ...suite, cases: originalCases });
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDrop(dropIndex) {
    if (dragIndex === null) {
      setDragIndex(null);
      return;
    }
    const fromIndex = dragIndex;
    setDragIndex(null);
    await moveCase(fromIndex, dropIndex);
  }

  if (loading && !suite) return <div className="test-cases-page">Loading...</div>;
  if (error) return <div className="test-cases-page"><p className="error-banner">{error}</p></div>;
  if (!suite) return null;

  const availableToAdd = allTestCases.filter((tc) => !suite.cases.some((c) => c.id === tc.id));

  return (
    <div className="test-cases-page">
      <Link to="/test-suites" className="link-button">
        &larr; Back to Test Suites
      </Link>

      <div className="page-header">
        <div>
          <h1>{suite.name}</h1>
          <p className="suite-meta">
            Feature: <strong>{suite.feature}</strong> &nbsp;·&nbsp; Status: <SuiteStatusBadge value={suite.status} />
          </p>
        </div>
        <button className="primary" onClick={handleNewRun} disabled={suite.cases.length === 0}>
          + New Run
        </button>
      </div>

      {actionError && <p className="error-banner">{actionError}</p>}

      <h2>Cases in This Suite</h2>
      {suite.cases.length === 0 ? (
        <p className="empty-cell">No cases in this suite yet. Add one below.</p>
      ) : (
        <table className="test-cases-table">
          <thead>
            <tr>
              <th aria-label="Drag handle" />
              <th>Title</th>
              <th>Severity</th>
              <th>Priority</th>
              <th>Status</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {suite.cases.map((tc, index) => (
              <tr
                key={tc.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                className="draggable-row"
              >
                <td className="drag-handle" title="Drag to reorder">⠿</td>
                <td>{tc.title}</td>
                <td><SeverityBadge value={tc.severity} /></td>
                <td><PriorityBadge value={tc.priority} /></td>
                <td>{tc.status}</td>
                <td className="row-actions">
                  <button
                    className="icon-button"
                    onClick={() => moveCase(index, index - 1)}
                    disabled={busy || index === 0}
                    aria-label={`Move "${tc.title}" up`}
                  >
                    ↑
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => moveCase(index, index + 1)}
                    disabled={busy || index === suite.cases.length - 1}
                    aria-label={`Move "${tc.title}" down`}
                  >
                    ↓
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => handleRemoveCase(tc.id, tc.title)}
                    disabled={busy}
                    aria-label={`Remove "${tc.title}" from suite`}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form className="toolbar" onSubmit={handleAddCase}>
        <select aria-label="Test case to add to suite" value={selectedCaseId} onChange={(e) => setSelectedCaseId(e.target.value)}>
          <option value="">Select a test case to add...</option>
          {availableToAdd.map((tc) => (
            <option key={tc.id} value={tc.id}>
              {tc.title} (#{tc.id})
            </option>
          ))}
        </select>
        <button type="submit" className="primary" disabled={!selectedCaseId || busy}>
          + Add Case
        </button>
      </form>
    </div>
  );
}

export default SuiteDetailPage;
