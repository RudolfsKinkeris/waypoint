// Single source of truth for every keyboard shortcut in the app. Both the
// key-handling logic (KeyboardShortcuts.jsx) and the help modal
// (ShortcutsHelpModal.jsx) read this list — add a shortcut here and it's
// live and documented in the same change, nowhere else to update.
//
// type: 'combo'    — a modifier/key pressed together, matched on one keydown.
// type: 'sequence' — a "g" prefix followed by a second key within a short window.
export const SHORTCUTS = [
  {
    id: 'quick-search',
    type: 'combo',
    mod: true,
    key: 'k',
    label: 'Cmd/Ctrl + K',
    description: 'Open quick search',
  },
  {
    id: 'go-dashboard',
    type: 'sequence',
    prefix: 'g',
    key: 'd',
    label: 'G then D',
    description: 'Go to Dashboard',
    path: '/dashboard',
  },
  {
    id: 'go-test-cases',
    type: 'sequence',
    prefix: 'g',
    key: 't',
    label: 'G then T',
    description: 'Go to Test Cases',
    path: '/test-cases',
  },
  {
    id: 'go-bugs',
    type: 'sequence',
    prefix: 'g',
    key: 'b',
    label: 'G then B',
    description: 'Go to Bugs',
    path: '/bugs',
  },
  {
    id: 'go-test-runs',
    type: 'sequence',
    prefix: 'g',
    key: 'r',
    label: 'G then R',
    description: 'Go to Test Runs',
    path: '/test-runs',
  },
  {
    id: 'show-help',
    type: 'combo',
    mod: false,
    key: '?',
    label: '?',
    description: 'Show this list of keyboard shortcuts',
  },
];
