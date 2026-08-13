import { useEffect } from 'react';
import { LoadingSpinner } from './Loader';

export default function AuthTransitionScreen({ label = 'Loading' }) {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center bg-white"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <LoadingSpinner className="h-10 w-10" label={label} />
      <span className="sr-only">{label}</span>
    </div>
  );
}
