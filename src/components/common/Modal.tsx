import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-neutral-100 max-h-[90dvh] overflow-y-auto">
        {title ? (
          <div className="flex items-center justify-between pb-3 mb-4">
            <h2 className="text-sm font-medium tracking-tight text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800 transition-colors"
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <path d="M2 2L12 12M12 2L2 12" />
              </svg>
            </button>
          </div>
        ) : null}
        <div>{children}</div>
      </div>
    </div>
  );
};
