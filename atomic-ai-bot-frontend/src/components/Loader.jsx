import spiner from '../assets/spiner.png';

export function LoadingSpinner({ className = 'h-8 w-8', label = 'Loading' }) {
  return (
    <span className="inline-flex items-center justify-center" role="status" aria-label={label}>
      <img src={spiner} alt="" className={`${className} animate-spin object-contain`} />
    </span>
  );
}

export default function Loader({ label = 'Loading' }) {
  return (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner label={label} />
      <span className="sr-only">{label}</span>
    </div>
  );
}
