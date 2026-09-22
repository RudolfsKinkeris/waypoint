import { useEffect, useState } from 'react';
import { useSettings } from '../context/SettingsContext.jsx';
import { updateSettings } from '../api/settings-api.js';

const THEMES = ['light', 'dark', 'system'];
const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const PAGE_SIZES = [10, 20, 50, 100];

function getBrowserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

// Intl.supportedValuesOf isn't available in every browser — fall back to a
// short, common list rather than leaving the picker empty. "UTC" isn't part
// of the IANA zone list Intl.supportedValuesOf returns, so it's prepended
// explicitly — otherwise a stored value of "UTC" matches no <option> and the
// <select> silently displays its first entry instead.
const TIMEZONE_OPTIONS = (() => {
  try {
    if (typeof Intl.supportedValuesOf === 'function') {
      return ['UTC', ...Intl.supportedValuesOf('timeZone')];
    }
  } catch {
    // fall through
  }
  return ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Tokyo', 'Australia/Sydney'];
})();

function SettingsPage() {
  const { settings, loading, setSettings } = useSettings();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (settings && !form) {
      setForm({ ...settings, timezone: settings.timezone || getBrowserTimezone() });
    }
  }, [settings, form]);

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await updateSettings(form);
      setSettings(updated);
      setForm(updated);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return (
      <div className="test-cases-page">
        <h1>Settings</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="test-cases-page">
      <h1>Settings</h1>

      {error && <p className="error-banner">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="view-section">
          <h3>Appearance</h3>
          <label className="field">
            Theme
            <select value={form.theme} onChange={(e) => updateField('theme', e.target.value)}>
              {THEMES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="view-section">
          <h3>Bugs</h3>
          <label className="field">
            Default severity for new bugs
            <select
              value={form.default_severity_for_new_bugs}
              onChange={(e) => updateField('default_severity_for_new_bugs', e.target.value)}
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="view-section">
          <h3>Test Cases</h3>
          <label className="field">
            Default page size
            <select
              value={form.default_page_size}
              onChange={(e) => updateField('default_page_size', Number(e.target.value))}
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="view-section">
          <h3>General</h3>
          <label className="field">
            Timezone
            <select value={form.timezone} onChange={(e) => updateField('timezone', e.target.value)}>
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </label>
          <label className="field-checkbox">
            <input
              type="checkbox"
              checked={form.auto_generate_report_after_run}
              onChange={(e) => updateField('auto_generate_report_after_run', e.target.checked)}
            />
            Automatically generate a report after a test run finishes
          </label>
        </div>

        <div className="settings-actions">
          <button className="primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {saved && <span className="badge badge-valid">Saved</span>}
        </div>
      </form>
    </div>
  );
}

export default SettingsPage;
