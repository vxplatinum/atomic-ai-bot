import { Link, NavLink } from 'react-router-dom';
import logo from '../assets/logo.png';

const footerLinkClass =
  'text-sm text-foreground-muted transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded';

const footerHeadingClass =
  'font-heading text-xs font-semibold uppercase tracking-wide text-foreground';

export function AppFooterMinimal({ copyrightYears, onBrandClick }) {
  return (
    <footer className="mt-auto border-t border-line py-4 text-sm text-foreground-muted">
      <div className="layout-container flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
        <Link
          to="/"
          onClick={onBrandClick}
          className="inline-flex shrink-0 items-center justify-center gap-2 text-[15px] font-bold text-foreground transition-colors hover:text-brand sm:justify-start"
        >
          <img className="h-5 w-5" src={logo} alt="" />
          Atomic AI Bot
        </Link>
        <p className="sm:text-right">&copy; {copyrightYears} All rights reserved.</p>
      </div>
    </footer>
  );
}

export function AppFooterHome({ copyrightYears, isAuth, onBrandClick }) {
  return (
    <footer className="mt-auto border-t border-line bg-surface/40">
      <div className="layout-container py-10 sm:py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Link
              to="/"
              onClick={onBrandClick}
              className="inline-flex items-center gap-2 text-[15px] font-bold text-foreground transition-colors hover:text-brand"
            >
              <img className="h-6 w-6" src={logo} alt="" />
              Atomic AI Bot
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-foreground-muted">
              Embeddable AI assistants for your site: manage bots, domains, and widget styling from one place.
            </p>
          </div>

          <div className="lg:col-span-2">
            <h2 className={footerHeadingClass}>Product</h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link to={{ pathname: '/', hash: 'purpose' }} className={footerLinkClass}>
                  Purpose
                </Link>
              </li>
              <li>
                <Link to={{ pathname: '/', hash: 'how-it-works' }} className={footerLinkClass}>
                  How it works
                </Link>
              </li>
              <li>
                <Link to={{ pathname: '/', hash: 'features' }} className={footerLinkClass}>
                  Features
                </Link>
              </li>
              <li>
                <Link to={{ pathname: '/', hash: 'about' }} className={footerLinkClass}>
                  About
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h2 className={footerHeadingClass}>Account</h2>
            <ul className="mt-4 space-y-2.5">
              {isAuth ? (
                <li>
                  <Link to="/dashboard" className={footerLinkClass}>
                    Dashboard
                  </Link>
                </li>
              ) : (
                <>
                  <li>
                    <NavLink to="/login" className={footerLinkClass}>
                      Log in
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/register" className={footerLinkClass}>
                      Register
                    </NavLink>
                  </li>
                </>
              )}
              <li>
                <Link to="/forgot-password" className={footerLinkClass}>
                  Reset password
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h2 className={footerHeadingClass}>Credits &amp; assets</h2>
            <p className="mt-4 text-sm leading-relaxed text-foreground-muted">
              Icon graphics used in this application are from{' '}
              <a
                href="https://www.flaticon.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand underline decoration-line underline-offset-2 transition-colors hover:text-brand-hover hover:decoration-brand"
              >
                Flaticon
              </a>
              , in line with their{' '}
              <a
                href="https://www.flaticon.com/legal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline decoration-line/80 underline-offset-2 transition-colors hover:text-brand hover:decoration-brand"
              >
                terms of use
              </a>
              . Thank you to the authors contributing free resources.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-line pt-6 text-xs text-foreground-muted">
          <p>&copy; {copyrightYears} Atomic AI Bot. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
