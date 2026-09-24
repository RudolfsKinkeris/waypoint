import { useState } from 'react';
import { Link } from 'react-router-dom';
import Papa from 'papaparse';
import { importTestCases } from '../api/test-cases-api.js';
import SeverityBadge from '../components/SeverityBadge.jsx';
import PriorityBadge from '../components/PriorityBadge.jsx';

const REQUIRED_FIELDS = ['title', 'steps', 'expected_result', 'severity', 'priority'];
const VALID_SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const VALID_PRIORITIES = ['High', 'Medium', 'Low'];
const VALID_STATUSES = ['draft', 'ready', 'passed', 'failed', 'skipped'];

function normalizeEnum(value, validValues) {
  if (!value) return null;
  return validValues.find((v) => v.toLowerCase() === value.toLowerCase()) || null;
}

function mapRow(raw, rowNumber) {
  const titleInput = raw.title || '';
  const steps = (raw.steps || '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
  const expectedResultInput = raw.expected_result || '';
  const severityInput = raw.severity || '';
  const priorityInput = raw.priority || '';
  const statusInput = raw.status || '';

  const severity = normalizeEnum(severityInput, VALID_SEVERITIES);
  const priority = normalizeEnum(priorityInput, VALID_PRIORITIES);
  const status = statusInput ? normalizeEnum(statusInput, VALID_STATUSES) : 'draft';

  const errors = [];
  if (!titleInput) errors.push('title is required');
  if (steps.length === 0) errors.push('steps is required');
  if (!expectedResultInput) errors.push('expected_result is required');
  if (!severityInput) errors.push('severity is required');
  else if (!severity) errors.push(`severity must be one of ${VALID_SEVERITIES.join(', ')}`);
  if (!priorityInput) errors.push('priority is required');
  else if (!priority) errors.push(`priority must be one of ${VALID_PRIORITIES.join(', ')}`);
  if (statusInput && !status) errors.push(`status must be one of ${VALID_STATUSES.join(', ')}`);

  return {
    rowNumber,
    payload: {
      title: titleInput,
      preconditions: raw.preconditions || '',
      steps,
      expected_result: expectedResultInput,
      severity: severity || severityInput,
      priority: priority || priorityInput,
      status: status || 'draft',
    },
    errors,
  };
}

function ImportTestCasesPage() {
  const [encodingWarning, setEncodingWarning] = useState(false);
  const [headerError, setHeaderError] = useState(null);
  const [emptyFileWarning, setEmptyFileWarning] = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [report, setReport] = useState(null);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    // Reset the input's value so re-selecting the same file (e.g. after
    // fixing it and saving under the same name) still fires this handler —
    // otherwise most browsers won't fire onChange for an unchanged value.
    e.target.value = '';
    if (!file) return;

    setEncodingWarning(false);
    setHeaderError(null);
    setEmptyFileWarning(false);
    setParsedRows([]);
    setImportError(null);
    setReport(null);

    try {
      const text = await file.text();
      setEncodingWarning(text.includes('�'));

      const { data, meta } = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase(),
        transform: (v) => (typeof v === 'string' ? v.trim() : v),
      });

      const fields = meta.fields || [];
      const missing = REQUIRED_FIELDS.filter((f) => !fields.includes(f));
      if (missing.length > 0) {
        setHeaderError(`CSV is missing required column(s): ${missing.join(', ')}`);
        return;
      }

      if (data.length === 0) {
        setEmptyFileWarning(true);
        return;
      }

      setParsedRows(data.map((raw, i) => mapRow(raw, i + 1)));
    } catch (err) {
      setImportError(`Couldn't read this file: ${err.message}`);
    }
  }

  const validRows = parsedRows.filter((r) => r.errors.length === 0);
  const invalidRows = parsedRows.filter((r) => r.errors.length > 0);

  async function handleImport() {
    setImporting(true);
    setImportError(null);
    try {
      const result = await importTestCases(validRows.map((r) => ({ ...r.payload, rowNumber: r.rowNumber })));
      setReport(result);
      setParsedRows([]);
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="test-cases-page">
      <Link to="/test-cases" className="link-button">
        &larr; Back to Test Cases
      </Link>

      <div className="page-header">
        <h1>Import Test Cases</h1>
      </div>

      {!report && (
        <>
          <p className="import-hint">
            CSV columns: <code>title</code>, <code>preconditions</code>, <code>steps</code> (pipe-separated, e.g.{' '}
            <code>Step one | Step two</code> — avoid using <code>|</code> within a step's own text, since it's
            treated as a separator), <code>expected_result</code>, <code>severity</code>,{' '}
            <code>priority</code>, <code>status</code> (optional, defaults to <code>draft</code>).{' '}
            <a href="/test-case-import-template.csv" download>
              Download CSV template
            </a>
          </p>

          <div className="toolbar">
            <input type="file" aria-label="Choose CSV file to import" accept=".csv" onChange={handleFileChange} />
          </div>

          {encodingWarning && (
            <p className="error-banner">
              This file doesn't look like valid UTF-8 — some characters may not have decoded correctly.
            </p>
          )}
          {headerError && <p className="error-banner">{headerError}</p>}
          {emptyFileWarning && <p className="error-banner">No rows found in this file.</p>}
          {importError && <p className="error-banner">{importError}</p>}

          {parsedRows.length > 0 && (
            <>
              <p className="import-summary">
                <strong>{validRows.length}</strong> valid, <strong>{invalidRows.length}</strong> invalid of{' '}
                {parsedRows.length} row{parsedRows.length === 1 ? '' : 's'}.
              </p>

              <table className="test-cases-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Title</th>
                    <th>Severity</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Steps</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((r) => (
                    <tr key={r.rowNumber} className={r.errors.length ? 'row-status-failed' : ''}>
                      <td>{r.rowNumber}</td>
                      <td>{r.payload.title || '—'}</td>
                      <td>
                        {VALID_SEVERITIES.includes(r.payload.severity) ? (
                          <SeverityBadge value={r.payload.severity} />
                        ) : (
                          r.payload.severity || '—'
                        )}
                      </td>
                      <td>
                        {VALID_PRIORITIES.includes(r.payload.priority) ? (
                          <PriorityBadge value={r.payload.priority} />
                        ) : (
                          r.payload.priority || '—'
                        )}
                      </td>
                      <td>{r.payload.status}</td>
                      <td>{r.payload.steps.length}</td>
                      <td>
                        {r.errors.length === 0 ? (
                          <span className="badge badge-valid">Valid</span>
                        ) : (
                          <span className="import-error-text">{r.errors.join('; ')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="import-actions">
                <button className="primary" disabled={validRows.length === 0 || importing} onClick={handleImport}>
                  {importing ? 'Importing...' : `Import ${validRows.length} valid row${validRows.length === 1 ? '' : 's'}`}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {report && (
        <div className="view-section">
          <h3>Import complete</h3>
          <p>
            Imported <strong>{report.imported}</strong> of {report.total} row{report.total === 1 ? '' : 's'}.
          </p>
          {report.skipped.length > 0 && (
            <>
              <p>{report.skipped.length} row{report.skipped.length === 1 ? '' : 's'} skipped:</p>
              <table className="test-cases-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Title</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {report.skipped.map((s) => (
                    <tr key={s.row}>
                      <td>{s.row}</td>
                      <td>{s.title}</td>
                      <td className="import-error-text">{s.errors.join('; ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          <div className="import-actions">
            <Link to="/test-cases" className="link-button">
              View test cases
            </Link>
            <button className="secondary" onClick={() => setReport(null)}>
              Import another file
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImportTestCasesPage;
