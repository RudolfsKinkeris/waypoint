import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SHORTCUTS } from '../shortcuts.js';
import QuickSearchModal from './QuickSearchModal.jsx';
import ShortcutsHelpModal from './ShortcutsHelpModal.jsx';

const CHORD_TIMEOUT_MS = 1000;

function isTypingTarget(el) {
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
}

function KeyboardShortcuts() {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const pendingPrefixRef = useRef(null);
  const chordTimerRef = useRef(null);

  useEffect(() => {
    function clearChord() {
      pendingPrefixRef.current = null;
      if (chordTimerRef.current) {
        clearTimeout(chordTimerRef.current);
        chordTimerRef.current = null;
      }
    }

    function handleKeyDown(e) {
      if (isTypingTarget(e.target) || searchOpen || helpOpen) return;

      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      const combo = SHORTCUTS.find((s) => s.type === 'combo' && s.key === key && !!s.mod === mod);
      if (combo) {
        e.preventDefault();
        clearChord();
        if (combo.id === 'quick-search') setSearchOpen(true);
        if (combo.id === 'show-help') setHelpOpen(true);
        return;
      }

      if (pendingPrefixRef.current) {
        const prefix = pendingPrefixRef.current;
        clearChord();
        const match = SHORTCUTS.find((s) => s.type === 'sequence' && s.prefix === prefix && s.key === key);
        if (match) {
          e.preventDefault();
          navigate(match.path);
        }
        return;
      }

      const startsSequence = SHORTCUTS.some((s) => s.type === 'sequence' && s.prefix === key);
      if (!mod && startsSequence) {
        pendingPrefixRef.current = key;
        chordTimerRef.current = setTimeout(clearChord, CHORD_TIMEOUT_MS);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearChord();
    };
  }, [navigate, searchOpen, helpOpen]);

  // Escape always closes an open modal, even while its own input is
  // focused — kept separate from the guard above, which intentionally
  // ignores keydowns while typing.
  useEffect(() => {
    function handleEscape(e) {
      if (e.key !== 'Escape') return;
      setSearchOpen(false);
      setHelpOpen(false);
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <>
      {searchOpen && <QuickSearchModal onClose={() => setSearchOpen(false)} />}
      {helpOpen && <ShortcutsHelpModal onClose={() => setHelpOpen(false)} />}
    </>
  );
}

export default KeyboardShortcuts;
