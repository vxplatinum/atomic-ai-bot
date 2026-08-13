import { LoadingSpinner } from './Loader';

export default function Button({
  children,
  type = 'button',
  className = '',
  variant = 'primary',
  loading = false,
  loadingLabel = 'Loading',
  disabled,
  ...props
}) {
  const baseClass = variant === 'secondary' ? 'btn-secondary' : 'btn-primary';
  return (
    <button
      type={type}
      className={`${baseClass} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner className="h-5 w-5" label={loadingLabel} />
          <span className="sr-only">{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
