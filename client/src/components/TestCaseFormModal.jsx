import { useState } from 'react';
import { useModalA11y } from '../hooks/useModalA11y.js';

const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const PRIORITIES = ['High', 'Medium', 'Low'];
const STATUSES = ['draft', 'ready', 'passed', 'failed', 'skipped'];

const EMPTY_FORM = {
  title: '',
  preconditions: '',
  steps: [''],
  expected_result: '',
  severity: 'Major',
  priority: 'Medium',
  status: 'draft',
};

function toFormState(testCase) {
  return {
    title: testCase.title,
    preconditions: testCase.preconditions || '',
    steps: testCase.steps.length ? testCase.steps : [''],
    expected_result: testCase.expected_result,
    severity: testCase.severity,
    priority: testCase.priority,
    status: testCase.status,
  };
}

function TestCaseFormModal({ initialValue, onSave, onClose }) {
  const [form, setForm] = useState(initialValue ? toFormState(initialValue) : EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);
  const modalRef = useModalA11y(onClose);

  function updateStep(index, value) {
    const steps = [...form.steps];
    steps[index] = value;
    setForm({ ...form, steps });
  }

  function addStep() {
    setForm({ ...form, steps: [...form.steps, ''] });
  }

  function removeStep(index) {
    const steps = form.steps.filter((_, i) => i !== index);
    setForm({ ...form, steps: steps.length ? steps : [''] });
  }

  function validate() {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.steps.map((s) => s.trim()).filter(Boolean).length) {
      errs.steps = 'At least one step is required.';
    }
    if (!form.expected_result.trim()) errs.expected_result = 'Expected result is required.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    setSaveError(null);
    try {
      await onSave({
        title: form.title.trim(),
        preconditions: form.preconditions.trim(),
        steps: form.steps.map((s) => s.trim()).filter(Boolean),
        expected_result: form.expected_result.trim(),
        severity: form.severity,
        priority: form.priority,
        status: form.status,
      });
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="test-case-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="test-case-form-title">{initialValue ? 'Edit Test Case' : 'Add Test Case'}</h2>
        {saveError && <p className="error-banner">{saveError}</p>}
        <form onSubmit={handleSubmit}>
          <label className="field">
            Title *
            <input
              type="text"
              value={form.title}
              aria-required="true"
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          {errors.title && <p className="field-error">{errors.title}</p>}

          <label className="field">
            Preconditions
            <textarea
              rows={2}
              value={form.preconditions}
              onChange={(e) => setForm({ ...form, preconditions: e.target.value })}
            />
          </label>

          <fieldset className="field">
            <legend>Steps *</legend>
            {form.steps.map((step, i) => (
              <div className="step-row" key={i}>
                <span className="step-number">{i + 1}.</span>
                <input
                  type="text"
                  value={step}
                  aria-label={`Step ${i + 1}`}
                  onChange={(e) => updateStep(i, e.target.value)}
                />
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => removeStep(i)}
                  aria-label={`Remove step ${i + 1}`}
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className="link-button" onClick={addStep}>
              + Add Step
            </button>
          </fieldset>
          {errors.steps && <p className="field-error">{errors.steps}</p>}

          <label className="field">
            Expected Result *
            <textarea
              rows={2}
              value={form.expected_result}
              aria-required="true"
              onChange={(e) => setForm({ ...form, expected_result: e.target.value })}
            />
          </label>
          {errors.expected_result && <p className="field-error">{errors.expected_result}</p>}

          <div className="form-row">
            <label className="field">
              Severity *
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              Priority *
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              Status
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TestCaseFormModal;
