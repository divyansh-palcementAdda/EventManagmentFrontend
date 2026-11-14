import { useEffect } from 'react';

/**
 * Locks body scroll while a modal is open.
 * - Preserves the exact scroll position when the modal opens/closes.
 * - Works correctly when multiple modals stack (reference-counted).
 * - Safe to call unconditionally; locking only happens when `isLocked` is true.
 *
 * @param {boolean} isLocked - Pass `true` when the modal is open.
 */

// Module-level counter so nested/multiple simultaneous modals don't
// fight over `document.body.style.overflow`.
let lockCount = 0;

const useScrollLock = (isLocked) => {
  useEffect(() => {
    if (!isLocked) return;

    lockCount += 1;

    // Only apply the lock on the first modal that opens.
    if (lockCount === 1) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    }

    return () => {
      lockCount -= 1;

      // Only remove the lock when the last modal closes.
      if (lockCount === 0) {
        const scrollY = document.body.style.top;
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        // Restore the scroll position silently.
        window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
      }
    };
  }, [isLocked]);
};

export default useScrollLock;
