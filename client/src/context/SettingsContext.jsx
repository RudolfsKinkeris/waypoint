import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchSettings } from '../api/settings-api.js';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settingsError, setSettingsError] = useState(null);

  const reload = useCallback(() => {
    setLoading(true);
    return fetchSettings()
      .then((data) => {
        setSettings(data);
        setSettingsError(null);
      })
      // Theme/default-severity consumers fall back to their own hardcoded
      // defaults when settings never load, so a fetch failure here shouldn't
      // block the rest of the app — but it's still exposed as settingsError
      // so the Settings page itself can show a real error instead of being
      // stuck on "Loading..." forever.
      .catch((err) => setSettingsError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    if (settings.theme === 'system') {
      delete root.dataset.theme;
    } else {
      root.dataset.theme = settings.theme;
    }
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, settingsError, reload, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
}
