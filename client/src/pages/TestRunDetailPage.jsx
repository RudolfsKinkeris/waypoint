import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchRun, updateRunResult } from '../api/test-runs-api.js';
import { createReport } from '../api/reports-api.js';
import RunStatusBadge from '../components/RunStatusBadge.jsx';
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

function TestRunDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [run, setRun] = useState(null);
  const [notesDraft, setNotesDraft] = useState({});
  const [failedStepDraft, setFailedStepDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchRun(id)
      .then((data) => {
        setRun(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function draftFor(result) {
    return notesDraft[result.id] ?? result.notes ?? '';
  }

  function failedStepFor(result) {
    return failedStepDraft[result.id] ?? result.failed_step ?? '';
  }

  async function handleSetResult(result, outcome) {
    setActionError(null);
    setSavingId(result.id);
    try {
      const updated = await updateRunResult(id, result.id, {
        result: outcome,
        notes: draftFor(result),
        failed_step: failedStepFor(result) || null,
      });
      setRun(updated);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  async function handleGenerateReport() {
    setActionError(null);
    setGeneratingReport(true);
    try {
      const report = await createReport(id);
      navigate(`/reports/${report.id}`);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setGeneratingReport(false);
    }
  }

  if (loading && !run) return <div className="test-cases-page">Loading...</div>;
  if (error) {
    return (
      <div className="test-cases-page">
        <Link to="/test-runs" className="link-button">
          &larr; Back to Test Runs
        </Link>
        <p className="error-banner">{error}</p>
      </div>
    );
  }
  if (!run) return null;

  return (
    <div className="test-cases-page">
      <Link to="/test-runs" className="link-button">
        &larr; Back to Test Runs
      </Link>

      <div className="page-header">
        <div>
          <h1>{run.suite_name}</h1>
          <div className="view-badges">
            <RunStatusBadge value={run.status} />
            <span className="run-counts">
              {run.pass_count} passed · {run.fail_count} failed · {run.skip_count} skipped
            </span>
          </div>
          <p className="suite-meta">
            Started {formatDate(run.start_time)} · Ended {formatDate(run.end_time)}
          </p>
        </div>
        <button className="secondary" disabled={generatingReport} onClick={handleGenerateReport}>
          {generatingReport ? 'Generating...' : 'Generate report'}
        </button>
      </div>

      {actionError && <p className="error-banner">{actionError}</p>}

      <table className="test-cases-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Result</th>
            <th>Failed Step</th>
            <th>Notes</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {run.results.map((result) => (
            <tr key={result.id}>
              <td>{result.title}</td>
              <td>
                <ResultBadge value={result.result} />
                {result.result === 'failed' && result.alert_sent && (
                  <span className="alert-sent-tag" role="img" aria-label="Discord alert sent" title="Discord alert sent"> 🔔</span>
                )}
              </td>
              <td>
                <select
                  className="failed-step-select"
                  aria-label={`Failed step for ${result.title}`}
                  value={failedStepFor(result)}
                  onChange={(e) => setFailedStepDraft({ ...failedStepDraft, [result.id]: e.target.value })}
                >
                  <option value="">— Not specified —</option>
                  {result.steps.map((step, i) => {
                    const label = `Step ${i + 1}: ${step}`;
                    return (
                      <option key={i} value={label}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </td>
              <td>
                <input
                  type="text"
                  placeholder="Add notes..."
                  value={draftFor(result)}
                  onChange={(e) => setNotesDraft({ ...notesDraft, [result.id]: e.target.value })}
                />
              </td>
              <td className="row-actions">
                <button
                  className="secondary"
                  disabled={savingId === result.id}
                  onClick={() => handleSetResult(result, 'passed')}
                >
                  Pass
                </button>
                <button
                  className="secondary"
                  disabled={savingId === result.id}
                  onClick={() => handleSetResult(result, 'failed')}
                >
                  Fail
                </button>
                <button
                  className="secondary"
                  disabled={savingId === result.id}
                  onClick={() => handleSetResult(result, 'skipped')}
                >
                  Skip
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TestRunDetailPage;
