import { useEffect, useRef } from 'react';

// Minimal dialog accessibility: focuses the modal on open (otherwise a
// keyboard user has to tab through everything behind the overlay to reach
// it, since these modals render at the end of the page's DOM), and closes
// it on Escape. Not a full focus trap — Tab can still reach the page behind
// the overlay — but this covers the two cheap, high-impact gaps.
export function useModalA11y(onClose) {
  const modalRef = useRef(null);

  useEffect(() => {
    modalRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return modalRef;
}
