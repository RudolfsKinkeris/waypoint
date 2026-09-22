import { useEffect, useRef } from 'react';
import { SHORTCUTS } from '../shortcuts.js';

function ShortcutsHelpModal({ onClose }) {
  const modalRef = useRef(null);

  // Escape is already handled globally by KeyboardShortcuts.jsx — this only
  // needs to move focus in, so a keyboard user isn't stuck tabbing through
  // the page behind the overlay.
  useEffect(() => {
    modalRef.current?.focus();
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" ref={modalRef} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <h2>Keyboard Shortcuts</h2>

        <table className="test-cases-table">
          <thead>
            <tr>
              <th>Shortcut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {SHORTCUTS.map((s) => (
              <tr key={s.id}>
                <td>
                  <kbd className="shortcut-key">{s.label}</kbd>
                </td>
                <td>{s.description}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShortcutsHelpModal;
