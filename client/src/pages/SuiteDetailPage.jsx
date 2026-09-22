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
      .catch(() => setAllTestCases([]));
  }, []);

  async function handleAddCase(e) {
    e.preventDefault();
    if (!selectedCaseId) return;
    setActionError(null);
    try {
      await addSuiteCase(id, Number(selectedCaseId));
      setSelectedCaseId('');
      load();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleRemoveCase(testCaseId) {
    setActionError(null);
    try {
      await removeSuiteCase(id, testCaseId);
      load();
    } catch (err) {
      setActionError(err.message);
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

  async function handleDrop(dropIndex) {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      return;
    }
    const originalCases = suite.cases;
    const reordered = [...originalCases];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    setDragIndex(null);
    setActionError(null);
    setSuite({ ...suite, cases: reordered });
    try {
      await reorderSuiteCases(id, reordered.map((c) => c.id));
      load();
    } catch (err) {
      setSuite({ ...suite, cases: originalCases });
      setActionError(err.message);
    }
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
        <button className="primary" onClick={handleNewRun}>
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
                  <button className="icon-button" onClick={() => handleRemoveCase(tc.id)} aria-label="Remove from suite">
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
              {tc.title}
            </option>
          ))}
        </select>
        <button type="submit" className="primary" disabled={!selectedCaseId}>
          + Add Case
        </button>
      </form>
    </div>
  );
}

export default SuiteDetailPage;
