import { useCallback, useEffect, useState } from 'react';
import { fetchFlakyTests } from '../api/flaky-tests-api.js';
import SeverityBadge from '../components/SeverityBadge.jsx';
import PriorityBadge from '../components/PriorityBadge.jsx';
import FlakinessSparkline from '../components/FlakinessSparkline.jsx';

const LEADERBOARD_SIZE = 10;

function formatScore(score) {
  return `${Math.round(score * 100)}%`;
}

// Splits a hypothesis string into short paragraphs at sentence boundaries, so a
// dense paragraph the subagent wrote as one block reads as a few short ones
// instead. A period/!/? followed by whitespace and a capital letter is treated
// as a sentence break — good enough for this use case without mangling
// abbreviations like "e.g." (lowercase letter follows, so it isn't split).
function splitIntoSentences(text) {
  return text
    .split(/(?<=[.?!])\s+(?=[A-Z])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function FlakyTestsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('flakiness_score');
  const [sortDir, setSortDir] = useState('desc');

  const load = useCallback(() => {
    setLoading(true);
    fetchFlakyTests()
      .then((result) => {
        setData(result);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toggleSort(column) {
    if (sortBy === column) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir(column === 'flakiness_score' ? 'desc' : 'asc');
    }
  }

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

  if (loading) {
    return (
      <div className="test-cases-page">
        <h1>Flaky Tests</h1>
        <div className="skeleton skeleton-block" />
        <div className="skeleton skeleton-block" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="test-cases-page">
        <h1>Flaky Tests</h1>
        <p className="error-banner">{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="test-cases-page">
        <h1>Flaky Tests</h1>
        <p className="empty-cell">
          No test run history yet. Run a test suite from Test Runs to start tracking flakiness here.
        </p>
      </div>
    );
  }

  const leaderboard = data
    .filter((t) => t.is_flaky)
    .slice()
    .sort((a, b) => b.flakiness_score - a.flakiness_score)
    .slice(0, LEADERBOARD_SIZE);

  const sortedAll = data.slice().sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'flakiness_score') return (a.flakiness_score - b.flakiness_score) * dir;
    return String(a[sortBy]).localeCompare(String(b[sortBy])) * dir;
  });

  const flakyCount = data.filter((t) => t.is_flaky).length;

  return (
    <div className="test-cases-page">
      <div className="title-with-info">
        <h1>Flaky Tests</h1>
        <details className="info-popover">
          <summary className="info-icon-button" aria-label="What this data shows">
            i
          </summary>
          <div className="info-popover-content">
            <h3>What this data shows</h3>
            <p>
              {flakyCount} of {data.length} test case{data.length === 1 ? '' : 's'} with run history shows a
              real flip pattern (pass, then fail, then pass again); the rest are either consistently stable or
              consistently broken, which is a different problem from flakiness. With real production data, the
              next useful step would be recency-weighting the score (a test that just started flipping this
              week matters more than one that flipped once months ago), correlating flips with environment or
              browser notes, and flagging duration outliers as a separate signal from pass/fail flips.
            </p>
          </div>
        </details>
      </div>
      {error && <p className="error-banner">{error} — showing the last successfully loaded data.</p>}

      <h2>Top Flaky Tests</h2>
      {leaderboard.length === 0 ? (
        <p className="empty-cell">No flaky tests detected yet — every test case is either stable or consistently broken.</p>
      ) : (
        <table className="test-cases-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Test Case</th>
              <th>Severity</th>
              <th>Flakiness</th>
              <th>History</th>
              <th>Root Cause Hypothesis</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((t, i) => (
              <tr key={t.test_case_id}>
                <td>{i + 1}</td>
                <td>{t.title}</td>
                <td><SeverityBadge value={t.severity} /></td>
                <td>{formatScore(t.flakiness_score)}</td>
                <td><FlakinessSparkline resultSequence={t.result_sequence} /></td>
                <td className="hypothesis-cell">
                  {t.hypothesis ? (
                    splitIntoSentences(t.hypothesis).map((sentence, i) => <p key={i}>{sentence}</p>)
                  ) : (
                    <span className="flaky-hypothesis-pending">
                      Analysis pending — run <code>/analyze-flaky-tests</code>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>All Test Case History</h2>
      <table className="test-cases-table">
        <thead>
          <tr>
            <th {...sortableHeaderProps('title')}>Test Case{sortIndicator('title')}</th>
            <th {...sortableHeaderProps('severity')}>Severity{sortIndicator('severity')}</th>
            <th {...sortableHeaderProps('priority')}>Priority{sortIndicator('priority')}</th>
            <th {...sortableHeaderProps('flakiness_score')}>Flakiness{sortIndicator('flakiness_score')}</th>
            <th>History</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sortedAll.map((t) => (
            <tr key={t.test_case_id}>
              <td>{t.title}</td>
              <td><SeverityBadge value={t.severity} /></td>
              <td><PriorityBadge value={t.priority} /></td>
              <td>{formatScore(t.flakiness_score)}</td>
              <td><FlakinessSparkline resultSequence={t.result_sequence} /></td>
              <td>
                {t.is_flaky ? (
                  <span className="badge badge-major">Flaky</span>
                ) : (
                  <span className="badge badge-status">Stable</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default FlakyTestsPage;
