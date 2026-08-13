import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import ThemeToggle from './ThemeToggle';
import { AppFooterHome, AppFooterMinimal } from './AppFooter';
import DeleteAccountModal from './DeleteAccountModal';
import AuthTransitionScreen from './AuthTransitionScreen';
import { deleteAccount, logout as logoutApi } from '../api/auth';
import useAuth from '../hooks/useAuth';
import { clearTokens, getAccessToken, getRefreshToken } from '../utils/token';
import { isKnownAppRoute } from '../utils/routes';

import logo from '../assets/logo.png';
import user from '../assets/user.png';

const anchorClass =
  'text-sm font-medium text-foreground-muted transition-colors hover:text-brand';

const loginShellClass =
  'inline-flex items-center justify-center rounded-[4px] bg-surface border border-line hover:bg-line/20 transition-colors px-2';

const authLinkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors hover:text-brand ${
    isActive ? 'text-brand' : 'text-foreground-muted'
  }`;

const loginNavLinkClass = ({ isActive }) =>
  `${loginShellClass} text-sm font-medium transition-colors hover:text-brand ${
    isActive ? 'text-brand' : 'text-foreground-muted'
  }`;

const registerNavLinkClass = ({ isActive }) =>
  `inline-flex items-center justify-center border-b border-line px-1 pb-0.5 text-sm font-medium transition-colors hover:text-brand hover:text-brand-hover ${
    isActive ? 'text-brand' : 'text-foreground-muted'
  }`;

const mobileMenuItemClass =
  'block w-full rounded-md px-3 py-2.5 text-left text-sm font-medium text-foreground-muted transition-colors hover:bg-line/15 hover:text-brand';

const menuButtonClass =
  'block w-full rounded-md border-0 bg-transparent px-3 py-2.5 text-left text-sm font-medium text-foreground-muted transition-colors hover:bg-line/15 hover:text-brand cursor-pointer font-[inherit]';

const menuDangerButtonClass =
  'block w-full rounded-md border-0 bg-transparent px-3 py-2.5 text-left text-sm font-medium text-foreground-muted transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 cursor-pointer font-[inherit]';

const burgerBtnClass =
  'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] border border-line bg-surface text-brand hover:bg-line/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const COPYRIGHT_START_YEAR = 2026;

function getCopyrightYearRange() {
  const current = new Date().getFullYear();
  if (current <= COPYRIGHT_START_YEAR) return String(COPYRIGHT_START_YEAR);
  return `${COPYRIGHT_START_YEAR}-${current}`;
}

function BurgerIcon({ open }) {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      {open ? (
        <path
          d="M6 6l12 12M18 6L6 18"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M4 8h16M4 12h16M4 16h16"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const mobileNavRef = useRef(null);

  const showAdminLink = isAdmin;

  useEffect(() => {
    if (loggingOut && location.pathname === '/login') {
      setLoggingOut(false);
    }
  }, [loggingOut, location.pathname]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, location.hash]);

  const isAuth = !!getAccessToken();
  const isHome = location.pathname === '/';
  const isNotFoundRoute = !isKnownAppRoute(location.pathname);
  const isDashboard = location.pathname === '/dashboard';
  const showDashboardHeader = isDashboard && isAuth;
  const showHomeMarketingHeader = isHome || isNotFoundRoute;
  const showAppMinimalHeader = isAuth && !isHome && !isDashboard && !isNotFoundRoute;
  const hasMobileNav = showDashboardHeader || showAppMinimalHeader || showHomeMarketingHeader;

  useEffect(() => {
    if (!mobileNavOpen) return;
    function onKeydown(e) {
      if (e.key === 'Escape') setMobileNavOpen(false);
    }
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen || !hasMobileNav) return;
    function onPointerDown(e) {
      if (mobileNavRef.current && !mobileNavRef.current.contains(e.target)) {
        setMobileNavOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [mobileNavOpen, hasMobileNav]);

  const copyrightYears = getCopyrightYearRange();
  const closeMobileNav = () => setMobileNavOpen(false);

  async function handleLogout() {
    closeMobileNav();
    setLoggingOut(true);

    await new Promise((resolve) => requestAnimationFrame(resolve));

    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await logoutApi(refreshToken);
      }
    } finally {
      clearTokens();
      navigate('/login', { replace: true });
    }
  }

  async function handleDeleteAccount(password) {
    setDeleteAccountError(null);
    setDeleteAccountLoading(true);
    try {
      await deleteAccount(password);
      clearTokens();
      setDeleteAccountOpen(false);
      setDeleteAccountError(null);
      navigate('/login', { replace: true });
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        clearTokens();
        setDeleteAccountOpen(false);
        setDeleteAccountError(null);
        navigate('/login', { replace: true });
        return;
      }

      const d = err.detail;
      const msg =
        typeof d === 'string'
          ? d
          : Array.isArray(d) && d[0]?.msg
            ? d[0].msg
            : d
              ? String(d)
              : 'Failed to delete account';
      setDeleteAccountError(msg);
    } finally {
      setDeleteAccountLoading(false);
    }
  }

  function handleBrandClick(e) {
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();

    const onHome = location.pathname === '/';
    const hasHash = Boolean(location.hash);

    if (!onHome) {
      navigate({ pathname: '/', hash: '' });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });
      return;
    }
    if (hasHash) {
      navigate({ pathname: '/', hash: '' }, { replace: true });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const dashboardMenu = (
    <div
      id="site-mobile-nav"
      role="menu"
      className="absolute right-0 top-full z-30 mt-1.5 min-w-[12.5rem] max-w-[min(calc(100vw-1.25rem),17.5rem)] rounded-lg border border-line bg-surface/95 py-1.5 shadow-lg ring-1 ring-foreground/5 backdrop-blur-md dark:bg-surface/95"
    >
      <nav
        className="flex max-h-[min(70vh,20rem)] flex-col gap-0.5 overflow-y-auto px-1"
        aria-label="Dashboard"
      >
        <Link
          to="/"
          onClick={(e) => {
            closeMobileNav();
            handleBrandClick(e);
          }}
          className={mobileMenuItemClass}
          role="menuitem"
        >
          Site
        </Link>
        <Link to="/bot/create" onClick={closeMobileNav} className={mobileMenuItemClass} role="menuitem">
          Create new bot
        </Link>
        {showAdminLink ? (
          <Link to="/admin" onClick={closeMobileNav} className={mobileMenuItemClass} role="menuitem">
            Admin panel
          </Link>
        ) : null}
        <button
          type="button"
          role="menuitem"
          className={menuButtonClass}
          onClick={() => {
            closeMobileNav();
            handleLogout();
          }}
        >
          Logout
        </button>
        <button
          type="button"
          role="menuitem"
          className={menuDangerButtonClass}
          onClick={() => {
            closeMobileNav();
            setDeleteAccountError(null);
            setDeleteAccountOpen(true);
          }}
        >
          Delete Account
        </button>
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {loggingOut ? <AuthTransitionScreen label="Signing out" /> : null}
      {deleteAccountOpen ? (
        <DeleteAccountModal
          onClose={() => {
            setDeleteAccountOpen(false);
            setDeleteAccountError(null);
          }}
          onConfirm={handleDeleteAccount}
          loading={deleteAccountLoading}
          error={deleteAccountError}
        />
      ) : null}
      <header className="border-b border-line bg-surface/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="layout-container py-4 flex items-center justify-between gap-4">
          <Link
            to="/"
            onClick={handleBrandClick}
            className="text-[19px] font-bold text-foreground flex items-center gap-2 hover:text-brand transition-colors shrink-0 min-w-0"
          >
            <img className="w-7 h-7 shrink-0" src={logo} alt="logo" />{' '}
            <span className="truncate">Atomic AI Bot</span>
          </Link>

          {showDashboardHeader ? (
            <div className="flex items-center gap-2 shrink-0" ref={mobileNavRef}>
              <ThemeToggle />
              {hasMobileNav ? (
                <div className="relative">
                  <button
                    type="button"
                    className={burgerBtnClass}
                    onClick={() => setMobileNavOpen((o) => !o)}
                    aria-expanded={mobileNavOpen}
                    aria-controls="site-mobile-nav"
                    aria-haspopup="true"
                    aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
                  >
                    <BurgerIcon open={mobileNavOpen} />
                  </button>
                  {mobileNavOpen ? dashboardMenu : null}
                </div>
              ) : null}
            </div>
          ) : (
            <>
          <nav className="hidden min-[751px]:flex flex-wrap items-center justify-end gap-x-5 gap-y-2">
            {showAppMinimalHeader ? (
              <>
                {showAdminLink ? (
                  <Link to="/admin" className={anchorClass}>
                    Admin panel
                  </Link>
                ) : null}
                <NavLink to="/dashboard" className={authLinkClass} title="Dashboard" aria-label="Dashboard">
                  <div className="inline-flex items-center justify-center rounded-[4px] bg-surface border border-line text-brand hover:bg-line/20 transition-colors flex items-center justify-center w-6 h-6">
                    <img className="w-4 h-4" src={user} alt="" />
                  </div>
                </NavLink>
                <ThemeToggle />
              </>
            ) : showHomeMarketingHeader ? (
              <>
                <Link to={{ pathname: '/', hash: 'purpose' }} className={anchorClass}>
                  Purpose
                </Link>
                <Link to={{ pathname: '/', hash: 'how-it-works' }} className={anchorClass}>
                  How it works
                </Link>
                <Link to={{ pathname: '/', hash: 'features' }} className={anchorClass}>
                  Features
                </Link>
                <Link to={{ pathname: '/', hash: 'about' }} className={anchorClass}>
                  About
                </Link>
                {isAuth ? (
                  <NavLink to="/dashboard" className={authLinkClass} title="Dashboard" aria-label="Dashboard">
                    <div className="inline-flex items-center justify-center rounded-[4px] bg-surface border border-line text-brand hover:bg-line/20 transition-colors flex items-center justify-center w-6 h-6">
                      <img className="w-4 h-4" src={user} alt="" />
                    </div>
                  </NavLink>
                ) : (
                  <div className="flex items-center gap-x-3">
                    <NavLink to="/login" className={loginNavLinkClass}>
                      Login
                    </NavLink>
                    <NavLink to="/register" className={registerNavLinkClass}>
                      Register
                    </NavLink>
                  </div>
                )}
                <ThemeToggle />
              </>
            ) : (
              <ThemeToggle />
            )}
          </nav>

          <div className="flex min-[751px]:hidden items-center gap-2 shrink-0">
            <ThemeToggle />
            {hasMobileNav ? (
              <div className="relative" ref={mobileNavRef}>
                <button
                  type="button"
                  className={burgerBtnClass}
                  onClick={() => setMobileNavOpen((o) => !o)}
                  aria-expanded={mobileNavOpen}
                  aria-controls="site-mobile-nav"
                  aria-haspopup="true"
                  aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
                >
                  <BurgerIcon open={mobileNavOpen} />
                </button>
                {mobileNavOpen ? (
                  <div
                    id="site-mobile-nav"
                    role="menu"
                    className="absolute right-0 top-full z-30 mt-1.5 min-w-[12.5rem] max-w-[min(calc(100vw-1.25rem),17.5rem)] rounded-lg border border-line bg-surface/95 py-1.5 shadow-lg ring-1 ring-foreground/5 backdrop-blur-md dark:bg-surface/95"
                  >
                    <nav
                      className="flex max-h-[min(70vh,20rem)] flex-col gap-0.5 overflow-y-auto px-1"
                      aria-label="Main"
                    >
                      {showDashboardHeader ? (
                        <>
                          <Link to="/" onClick={closeMobileNav} className={mobileMenuItemClass}>
                            Site
                          </Link>
                          <Link to="/bot/create" onClick={closeMobileNav} className={mobileMenuItemClass}>
                            Create new bot
                          </Link>
                          {showAdminLink ? (
                            <Link to="/admin" onClick={closeMobileNav} className={mobileMenuItemClass}>
                              Admin panel
                            </Link>
                          ) : null}
                          <NavLink
                            to="/dashboard"
                            onClick={closeMobileNav}
                            aria-label="Dashboard"
                            className={({ isActive }) =>
                              `${mobileMenuItemClass} inline-flex items-center gap-2 ${isActive ? 'text-brand' : ''}`
                            }
                          >
                            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] border border-line bg-surface text-brand">
                              <img className="w-4 h-4" src={user} alt="" />
                            </span>
                          </NavLink>
                        </>
                      ) : showAppMinimalHeader ? (
                        <>
                          {showAdminLink ? (
                            <Link to="/admin" onClick={closeMobileNav} className={mobileMenuItemClass}>
                              Admin panel
                            </Link>
                          ) : null}
                          <NavLink
                            to="/dashboard"
                            onClick={closeMobileNav}
                            aria-label="Dashboard"
                            className={({ isActive }) =>
                              `${mobileMenuItemClass} inline-flex items-center gap-2 ${isActive ? 'text-brand' : ''}`
                            }
                          >
                            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] border border-line bg-surface text-brand">
                              <img className="w-4 h-4" src={user} alt="" />
                            </span>
                          </NavLink>
                        </>
                      ) : showHomeMarketingHeader ? (
                        <>
                          <Link
                            to={{ pathname: '/', hash: 'purpose' }}
                            onClick={closeMobileNav}
                            className={mobileMenuItemClass}
                          >
                            Purpose
                          </Link>
                          <Link
                            to={{ pathname: '/', hash: 'how-it-works' }}
                            onClick={closeMobileNav}
                            className={mobileMenuItemClass}
                          >
                            How it works
                          </Link>
                          <Link
                            to={{ pathname: '/', hash: 'features' }}
                            onClick={closeMobileNav}
                            className={mobileMenuItemClass}
                          >
                            Features
                          </Link>
                          <Link
                            to={{ pathname: '/', hash: 'about' }}
                            onClick={closeMobileNav}
                            className={mobileMenuItemClass}
                          >
                            About
                          </Link>
                          {isAuth ? (
                            <NavLink
                              to="/dashboard"
                              onClick={closeMobileNav}
                              aria-label="Dashboard"
                              className={({ isActive }) =>
                                `${mobileMenuItemClass} inline-flex items-center gap-2 ${isActive ? 'text-brand' : ''}`
                              }
                            >
                              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] border border-line bg-surface text-brand">
                                <img className="w-4 h-4" src={user} alt="" />
                              </span>
                            </NavLink>
                          ) : (
                            <div className="flex items-center justify-center gap-x-3 px-3 py-2.5">
                              <NavLink to="/login" onClick={closeMobileNav} className={loginNavLinkClass}>
                                Login
                              </NavLink>
                              <NavLink to="/register" onClick={closeMobileNav} className={registerNavLinkClass}>
                                Register
                              </NavLink>
                            </div>
                          )}
                        </>
                      ) : null}
                    </nav>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
            </>
          )}
        </div>
      </header>
      <main className="flex-1 layout-container py-8 flex flex-col">
        <Outlet />
      </main>
      {isHome || isNotFoundRoute ? (
        <AppFooterHome
          copyrightYears={copyrightYears}
          isAuth={isAuth}
          onBrandClick={handleBrandClick}
        />
      ) : (
        <AppFooterMinimal copyrightYears={copyrightYears} onBrandClick={handleBrandClick} />
      )}
    </div>
  );
}
