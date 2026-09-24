import { useRef, useState } from 'react';
import { useSettings } from '../context/SettingsContext.jsx';
import { useModalA11y } from '../hooks/useModalA11y.js';

const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const PRIORITIES = ['High', 'Medium', 'Low'];
const FALLBACK_SEVERITY = 'Major';

const EMPTY_FORM = {
  title: '',
  description: '',
  steps_to_reproduce: [''],
  expected: '',
  actual: '',
  environment: '',
  severity: FALLBACK_SEVERITY,
  priority: 'Medium',
};

function BugFormModal({ error, onSave, onClose }) {
  const { settings } = useSettings();
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    severity: SEVERITIES.includes(settings?.default_severity_for_new_bugs)
      ? settings.default_severity_for_new_bugs
      : FALLBACK_SEVERITY,
  }));
  const initialFormRef = useRef(form);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Closing via the overlay or Escape shouldn't silently discard a form the
  // user has actually filled in — only prompt when something's changed.
  function handleRequestClose() {
    const isDirty = JSON.stringify(form) !== JSON.stringify(initialFormRef.current);
    if (isDirty && !window.confirm('Discard this bug report? Your entered details will be lost.')) return;
    onClose();
  }

  const modalRef = useModalA11y(handleRequestClose);

  function updateStep(index, value) {
    const steps = [...form.steps_to_reproduce];
    steps[index] = value;
    setForm({ ...form, steps_to_reproduce: steps });
  }

  function addStep() {
    setForm({ ...form, steps_to_reproduce: [...form.steps_to_reproduce, ''] });
  }

  function removeStep(index) {
    const steps = form.steps_to_reproduce.filter((_, i) => i !== index);
    setForm({ ...form, steps_to_reproduce: steps.length ? steps : [''] });
  }

  function validate() {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.steps_to_reproduce.map((s) => s.trim()).filter(Boolean).length) {
      errs.steps_to_reproduce = 'At least one step is required.';
    }
    if (!form.expected.trim()) errs.expected = 'Expected is required.';
    if (!form.actual.trim()) errs.actual = 'Actual is required.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      await onSave({
        title: form.title.trim(),
        description: form.description.trim(),
        steps_to_reproduce: form.steps_to_reproduce.map((s) => s.trim()).filter(Boolean),
        expected: form.expected.trim(),
        actual: form.actual.trim(),
        environment: form.environment.trim(),
        severity: form.severity,
        priority: form.priority,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={handleRequestClose}>
      <div
        className="modal"
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bug-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="bug-form-title">Report Bug</h2>
        {error && (
          <p className="error-banner" role="alert">
            {error}
          </p>
        )}
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
            Description
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>

          <fieldset className="field">
            <legend>Steps to Reproduce *</legend>
            {form.steps_to_reproduce.map((step, i) => (
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
          {errors.steps_to_reproduce && <p className="field-error">{errors.steps_to_reproduce}</p>}

          <label className="field">
            Expected *
            <textarea
              rows={2}
              value={form.expected}
              aria-required="true"
              onChange={(e) => setForm({ ...form, expected: e.target.value })}
            />
          </label>
          {errors.expected && <p className="field-error">{errors.expected}</p>}

          <label className="field">
            Actual *
            <textarea
              rows={2}
              value={form.actual}
              aria-required="true"
              onChange={(e) => setForm({ ...form, actual: e.target.value })}
            />
          </label>
          {errors.actual && <p className="field-error">{errors.actual}</p>}

          <label className="field">
            Environment
            <input
              type="text"
              placeholder="e.g. Chrome 128, macOS 15, Desktop"
              value={form.environment}
              onChange={(e) => setForm({ ...form, environment: e.target.value })}
            />
          </label>

          <div className="form-row">
            <label className="field">
              Severity *
              <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              Priority *
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary" onClick={handleRequestClose} disabled={saving}>
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

export default BugFormModal;
