import { Link } from 'react-router-dom';
import { getAccessToken } from '../utils/token';

export default function NotFound() {
  const isAuth = !!getAccessToken();

  return (
    <div
      className={[
        'flex w-full flex-1 flex-col items-center justify-center text-center',
        'min-h-[calc(100dvh-var(--site-header-height))]',
        '-mt-8 pt-8 pb-16 px-4',
      ].join(' ')}
    >
      <p className="font-heading text-[clamp(4.5rem,20vw,10rem)] font-bold leading-none tracking-tight text-brand">
        404
      </p>
      <h1 className="mt-5 text-2xl font-bold text-brand md:text-3xl">Page not found</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-foreground-muted md:text-base">
        The page you are looking for does not exist or may have been moved.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link to="/" className="btn-primary px-8 py-2.5">
          Back to home
        </Link>
        {isAuth ? (
          <Link to="/dashboard" className="btn-secondary px-8 py-2.5">
            Dashboard
          </Link>
        ) : (
          <Link to="/login" className="btn-secondary px-8 py-2.5">
            Log in
          </Link>
        )}
      </div>
    </div>
  );
}
