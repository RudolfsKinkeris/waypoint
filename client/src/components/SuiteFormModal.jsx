import { useRef, useState } from 'react';
import { useModalA11y } from '../hooks/useModalA11y.js';

const STATUSES = ['draft', 'ready', 'in-progress', 'passed', 'failed'];

const EMPTY_FORM = { name: '', feature: '', status: 'draft' };

function toFormState(suite) {
  return { name: suite.name, feature: suite.feature, status: suite.status };
}

function SuiteFormModal({ initialValue, error, onSave, onClose }) {
  const [form, setForm] = useState(initialValue ? toFormState(initialValue) : EMPTY_FORM);
  const initialFormRef = useRef(form);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function handleRequestClose() {
    const isDirty = JSON.stringify(form) !== JSON.stringify(initialFormRef.current);
    if (isDirty && !window.confirm('Discard unsaved changes to this suite?')) return;
    onClose();
  }

  const modalRef = useModalA11y(handleRequestClose);

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.feature.trim()) errs.feature = 'Feature is required.';
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
        name: form.name.trim(),
        feature: form.feature.trim(),
        status: form.status,
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
        aria-labelledby="suite-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="suite-form-title">{initialValue ? 'Edit Suite' : 'Add Suite'}</h2>
        {error && (
          <p className="error-banner" role="alert">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <label className="field">
            Name *
            <input
              type="text"
              value={form.name}
              aria-required="true"
              maxLength={200}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          {errors.name && <p className="field-error">{errors.name}</p>}

          <label className="field">
            Feature *
            <input
              type="text"
              placeholder="e.g. login"
              value={form.feature}
              aria-required="true"
              maxLength={100}
              onChange={(e) => setForm({ ...form, feature: e.target.value })}
            />
          </label>
          {errors.feature && <p className="field-error">{errors.feature}</p>}

          <label className="field">
            Status
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

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

export default SuiteFormModal;
