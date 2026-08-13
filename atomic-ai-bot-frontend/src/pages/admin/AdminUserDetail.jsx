import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getAdminUser, patchAdminUser } from '../../api/admin';
import Alert from '../../components/Alert';
import Loader, { LoadingSpinner } from '../../components/Loader';
import { panelActionBtnClass } from '../../ui/botPanelStyles';
import { clearTokens } from '../../utils/token';
import { formatAdminError } from '../../utils/adminErrors';

const ROLES = ['user', 'admin'];

export default function AdminUserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);

  const [isBlocked, setIsBlocked] = useState(false);
  const [tariffPlan, setTariffPlan] = useState('');
  const [role, setRole] = useState('user');

  function loadUser() {
    setError(null);
    setFormError(null);
    setNotFound(false);
    setForbidden(false);
    return getAdminUser(userId)
      .then((data) => {
        setUser(data);
        setIsBlocked(!!data.is_blocked);
        setTariffPlan(data.tariff_plan ?? '');
        setRole(data.role ?? 'user');
      })
      .catch((err) => {
        if (err.status === 401) {
          clearTokens();
          navigate('/login', { replace: true });
          throw err;
        }
        if (err.status === 403) {
          setForbidden(true);
          throw err;
        }
        if (err.status === 404) {
          setNotFound(true);
          throw err;
        }
        setError(formatAdminError(err));
        throw err;
      });
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadUser()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, navigate]);

  async function handleSave(e) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const trimmedTariff = tariffPlan.trim();
      const body = {
        is_blocked: isBlocked,
        tariff_plan: trimmedTariff || null,
        role,
      };
      const updated = await patchAdminUser(userId, body);
      setUser(updated);
      setIsBlocked(!!updated.is_blocked);
      setTariffPlan(updated.tariff_plan ?? '');
      setRole(updated.role ?? 'user');
    } catch (err) {
      if (err.status === 401) {
        clearTokens();
        navigate('/login', { replace: true });
        return;
      }
      if (err.status === 403) {
        setForbidden(true);
        return;
      }
      if (err.status === 400) {
        setFormError(formatAdminError(err));
        return;
      }
      setFormError(formatAdminError(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader />;
  if (forbidden) return <Alert>You do not have access to the admin panel.</Alert>;
  if (notFound) return <Alert>Not found.</Alert>;
  if (error) return <Alert>{error}</Alert>;
  if (!user) return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-medium text-brand">User #{user.id}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{user.email}</p>
        </div>
        <Link to="/admin/users" className="text-sm font-medium text-brand hover:underline">
          ← Users
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 rounded-lg border border-line bg-surface p-4 sm:grid-cols-2">
        <div>
          <div className="text-xs font-medium uppercase text-foreground-muted">Username</div>
          <div className="mt-1 text-sm">{user.username}</div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase text-foreground-muted">Email</div>
          <div className="mt-1 break-all text-sm">{user.email}</div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase text-foreground-muted">Account active</div>
          <div className="mt-1 text-sm">{user.is_active ? 'yes' : 'no'}</div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase text-foreground-muted">Current role</div>
          <div className="mt-1 text-sm">{user.role}</div>
        </div>
      </div>

      {formError ? (
        <div className="mb-4">
          <Alert>{formError}</Alert>
        </div>
      ) : null}

      <form onSubmit={handleSave} className="mb-10 max-w-xl space-y-4 rounded-lg border border-line bg-surface p-4">
        <h2 className="font-heading text-lg font-semibold text-brand">Edit</h2>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
            checked={isBlocked}
            onChange={(e) => setIsBlocked(e.target.checked)}
            disabled={saving}
          />
          <span className="text-sm text-foreground">Blocked</span>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-foreground-muted">Tariff plan</span>
          <input
            type="text"
            className="input-field"
            value={tariffPlan}
            onChange={(e) => setTariffPlan(e.target.value)}
            disabled={saving}
            placeholder="free"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-foreground-muted">Role</span>
          <select
            className="input-field"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={saving}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap gap-2 pt-2">
          <button type="submit" className="btn-primary" disabled={saving} aria-busy={saving || undefined}>
            {saving ? (
              <>
                <LoadingSpinner className="h-5 w-5" label="Saving changes" />
                <span className="sr-only">Saving changes</span>
              </>
            ) : (
              'Save changes'
            )}
          </button>
          <button type="button" className={panelActionBtnClass} onClick={() => loadUser().catch(() => {})} disabled={saving}>
            Reload
          </button>
        </div>
      </form>

      <h2 className="font-heading text-lg font-semibold text-brand mb-3">Bots</h2>
      {user.bots?.length ? (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-foreground/5">
                <th className="p-3 font-medium">ID</th>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Domain</th>
                <th className="p-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {user.bots.map((b) => (
                <tr key={b.id} className="border-b border-line last:border-0">
                  <td className="p-3 font-mono text-foreground-muted">{b.id}</td>
                  <td className="p-3">{b.name}</td>
                  <td className="p-3 break-all font-mono text-xs">{b.allowed_domain}</td>
                  <td className="p-3 text-right">
                    <Link to={`/admin/bots/${b.id}`} className="text-brand font-medium hover:underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-foreground-muted">No bots.</p>
      )}
    </div>
  );
}
