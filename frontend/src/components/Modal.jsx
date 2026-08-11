import { useEffect } from 'react';
import { createPortal } from 'react-dom';

let activeModalCount = 0;
let previousBodyOverflow = '';
let previousHtmlOverflow = '';
let savedScrollY = 0;

export default function Modal({
  title,
  children,
  onClose,
  footer,
  size = 'md',
}) {
  const sizeClass =
    size === 'lg'
      ? 'max-w-2xl'
      : size === 'xl'
        ? 'max-w-3xl'
        : 'max-w-lg';

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }

    if (activeModalCount === 0) {
      // Save current scroll position
      savedScrollY = window.scrollY;

      // Save current overflow styles
      previousBodyOverflow = document.body.style.overflow || '';
      previousHtmlOverflow = document.documentElement.style.overflow || '';

      // Prevent background page from scrolling
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }

    activeModalCount += 1;

    return () => {
      activeModalCount = Math.max(0, activeModalCount - 1);

      if (activeModalCount === 0) {
        // Restore overflow
        document.body.style.overflow = previousBodyOverflow;
        document.documentElement.style.overflow = previousHtmlOverflow;

        // Restore exact scroll position
        requestAnimationFrame(() => {
          window.scrollTo(0, savedScrollY);
        });
      }
    };
  }, []);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[99999] p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60"
        aria-hidden="true"
      />

      {/* Modal positioning */}
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`pointer-events-auto relative ${sizeClass} w-full rounded-xl bg-gradient-to-b from-blue-900 to-red-900 shadow-xl`}
        >
          {/* HEADER - NOT SCROLLABLE */}
          <div className="flex items-center justify-between p-6 pb-4">
            <h2 className="text-lg font-bold text-white">
              {title}
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="text-2xl text-white hover:text-gray-300"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          {/* SCROLLABLE CONTENT */}
          <div className="max-h-[70vh] sm:max-h-[90vh] overflow-y-auto px-6">
            {children}
          </div>

          {/* FOOTER - NOT SCROLLABLE */}
          {footer && (
            <div className="flex justify-end gap-2 p-6 pt-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}