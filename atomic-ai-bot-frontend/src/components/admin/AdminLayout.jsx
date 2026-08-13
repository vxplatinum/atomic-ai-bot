import { Link, NavLink, Outlet } from 'react-router-dom';

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium px-3 py-2 rounded border transition-colors ${
    isActive
      ? 'border-brand bg-brand/10 text-brand'
      : 'border-transparent text-foreground-muted hover:text-brand hover:border-line'
  }`;

export default function AdminLayout() {
  return (
    <div className="w-full">
      <div className="mb-6 border-b border-line bg-surface/50 py-3">
        <div className="layout-container flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-heading text-sm font-semibold uppercase tracking-wide text-foreground-muted">
              Admin
            </span>
            <nav className="flex flex-wrap items-center gap-1" aria-label="Admin navigation">
              <NavLink to="/admin" end className={navLinkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/admin/users" className={navLinkClass}>
                Users
              </NavLink>
            </nav>
          </div>
          <Link
            to="/dashboard"
            className="text-sm font-medium text-brand hover:text-brand-hover hover:underline"
          >
            ← Back to app
          </Link>
        </div>
      </div>
      <div className="layout-container pb-10">
        <Outlet />
      </div>
    </div>
  );
}
