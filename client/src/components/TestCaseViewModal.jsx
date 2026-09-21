import SeverityBadge from './SeverityBadge.jsx';
import PriorityBadge from './PriorityBadge.jsx';

function TestCaseViewModal({ testCase, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{testCase.title}</h2>

        <div className="view-badges">
          <SeverityBadge value={testCase.severity} />
          <PriorityBadge value={testCase.priority} />
          <span className="badge badge-status">{testCase.status}</span>
        </div>

        {testCase.preconditions && (
          <div className="view-section">
            <h3>Preconditions</h3>
            <p>{testCase.preconditions}</p>
          </div>
        )}

        <div className="view-section">
          <h3>Steps</h3>
          <ol>
            {testCase.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>

        <div className="view-section">
          <h3>Expected Result</h3>
          <p>{testCase.expected_result}</p>
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default TestCaseViewModal;
