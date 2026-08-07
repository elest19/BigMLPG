import { useEffect } from 'react';

let activeModalCount = 0;
let previousBodyOverflow = '';
let previousHtmlOverflow = '';

export default function Modal({ title, children, onClose, footer, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'max-w-2xl' : size === 'xl' ? 'max-w-3xl' : 'max-w-lg';

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    if (activeModalCount === 0) {
      previousBodyOverflow = document.body.style.overflow || '';
      previousHtmlOverflow = document.documentElement.style.overflow || '';
    }

    activeModalCount += 1;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      activeModalCount = Math.max(0, activeModalCount - 1);

      if (activeModalCount === 0) {
        document.body.style.overflow = previousBodyOverflow;
        document.documentElement.style.overflow = previousHtmlOverflow;
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true">
      <div className={`bg-white rounded-xl shadow-xl ${sizeClass} w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold" aria-label="Close modal">
            &times;
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="flex justify-end gap-2 pt-2">{footer}</div>}
      </div>
    </div>
  );
}
