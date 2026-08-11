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
    <div className="fixed inset-0 z-50 p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60"
        aria-hidden="true"
      />

      {/* Modal positioning */}
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`pointer-events-auto relative ${sizeClass} w-full max-h-[90vh] rounded-xl bg-white shadow-xl flex flex-col`}
        >
          {/* HEADER */}
          <div className="flex shrink-0 items-center justify-between p-6 pb-4">
            <h2 className="text-lg font-bold">
              {title}
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="text-2xl hover:text-slate-500"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          {/* SCROLLABLE CONTENT */}
          <div className="min-h-0 flex-1 overflow-y-auto px-6">
            {children}
          </div>

          {/* FOOTER */}
          {footer && (
            <div className="flex shrink-0 justify-end gap-2 p-6 pt-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}