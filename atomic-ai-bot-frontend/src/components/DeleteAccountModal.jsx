import { useEffect, useId, useState } from 'react';
import Input from './Input';
import { LoadingSpinner } from './Loader';
import { panelActionBtnClass } from '../ui/botPanelStyles';

function ServiceCheckbox({ checked, onChange, disabled, children, id }) {
  return (
    <label
      htmlFor={id}
      className={`mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-foreground/5 p-3 transition-colors hover:bg-line/10 has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background ${
        disabled ? 'pointer-events-none opacity-70' : ''
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <span
        aria-hidden
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
          checked ? 'border-brand bg-brand text-white' : 'border-line bg-surface'
        }`}
      >
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path
            d="M2 6l3 3 5-6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={checked ? 'opacity-100' : 'opacity-0'}
          />
        </svg>
      </span>
      <span className="text-sm leading-relaxed text-foreground-muted select-none">{children}</span>
    </label>
  );
}

export default function DeleteAccountModal({ onClose, onConfirm, loading, error }) {
  const [password, setPassword] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const checkboxId = useId();

  useEffect(() => {
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
  }, [onClose]);

  const canDelete = acknowledged && password.trim().length > 0 && !loading;

  function handleSubmit(e) {
    e.preventDefault();
    if (!canDelete) return;
    onConfirm(password);
  }

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
        aria-labelledby="delete-account-dialog-title"
        className="relative z-10 w-full max-w-sm rounded-lg border border-line bg-surface p-6 shadow-lg"
      >
        <h2 id="delete-account-dialog-title" className="text-lg font-semibold text-brand">
          Delete account?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
          Are you sure you want to delete your account? This cannot be undone. All your bots and API
          tokens will be removed. To use the service again you will need to register a new account.
        </p>
        <form onSubmit={handleSubmit}>
          <ServiceCheckbox
            id={checkboxId}
            checked={acknowledged}
            onChange={setAcknowledged}
            disabled={loading}
          >
            I understand this is permanent: I cannot undo it, I will lose all bots and tokens, and I
            will need to sign up again to use the service.
          </ServiceCheckbox>
          <div className="mt-4">
            <Input
              label="Password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
              placeholder="Enter your password to confirm"
            />
          </div>
          {error ? <p className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button type="button" className={panelActionBtnClass} onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!canDelete}
              aria-disabled={!canDelete}
            >
              {loading ? (
                <>
                  <LoadingSpinner className="h-5 w-5" label="Deleting account" />
                  <span className="sr-only">Deleting account</span>
                </>
              ) : (
                'Delete account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
