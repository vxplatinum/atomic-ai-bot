import { useEffect } from 'react';
import { panelActionBtnClass } from '../ui/botPanelStyles';

export default function DeleteBotModal({ target, onClose, onConfirm }) {
  useEffect(() => {
    if (!target) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKeydown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeydown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeydown);
    };
  }, [target, onClose]);

  if (!target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-foreground/15 backdrop-blur-[2px]"
        aria-hidden
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-bot-dialog-title"
        className="relative z-10 w-full max-w-sm rounded-lg border border-line bg-surface p-6 shadow-lg"
      >
        <h2 id="delete-bot-dialog-title" className="text-lg font-semibold text-brand">
          Delete this bot?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
          Are you sure you want to delete{' '}
          <span className="font-medium text-foreground">{target.name}</span>? This cannot be undone.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" className={panelActionBtnClass} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary px-4 py-2" onClick={() => onConfirm()}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
