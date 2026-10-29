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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-sm bg-neutral-900/90 border border-white/10 rounded-3xl p-6 shadow-2xl text-white backdrop-blur-2xl max-h-[90vh] overflow-y-auto">
        {title ? (
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
            <h2 className="text-sm font-semibold tracking-tight text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        ) : null}
        <div>{children}</div>
      </div>
    </div>
  );
};
