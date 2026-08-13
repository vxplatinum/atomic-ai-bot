import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { listAdminUsers } from '../../api/admin';
import Alert from '../../components/Alert';
import Loader, { LoadingSpinner } from '../../components/Loader';
import { panelActionBtnClass } from '../../ui/botPanelStyles';
import { clearTokens } from '../../utils/token';
import { formatAdminError } from '../../utils/adminErrors';

const PAGE_SIZE = 50;

export default function AdminUsers() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const emailQ = searchParams.get('email') || '';
  const offsetQ = Number(searchParams.get('offset') || '0') || 0;

  const [emailDraft, setEmailDraft] = useState(emailQ);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setEmailDraft(emailQ);
  }, [emailQ]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setForbidden(false);
    listAdminUsers({ email: emailQ || undefined, limit: PAGE_SIZE, offset: offsetQ })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 401) {
          clearTokens();
          navigate('/login', { replace: true });
          return;
        }
        if (err.status === 403) {
          setForbidden(true);
          return;
        }
        setError(formatAdminError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [emailQ, offsetQ, navigate]);

  function applySearch(e) {
    e.preventDefault();
    const next = new URLSearchParams();
    if (emailDraft.trim()) next.set('email', emailDraft.trim());
    next.set('offset', '0');
    setSearchParams(next);
  }

  function goOffset(nextOffset) {
    const next = new URLSearchParams(searchParams);
    if (emailQ) next.set('email', emailQ);
    else next.delete('email');
    next.set('offset', String(Math.max(0, nextOffset)));
    setSearchParams(next);
  }

  if (forbidden) {
    return <Alert>You do not have access to the admin panel.</Alert>;
  }

  if (loading && !data) {
    return <Loader />;
  }

  if (error) {
    return <Alert>{error}</Alert>;
  }

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : offsetQ + 1;
  const to = Math.min(offsetQ + items.length, total);
  const canPrev = offsetQ > 0;
  const canNext = offsetQ + items.length < total;

  return (
    <div>
      <h1 className="font-heading text-2xl font-medium text-brand mb-2">Users</h1>
      <p className="mb-4 text-sm text-foreground-muted">Search and manage accounts.</p>

      <form onSubmit={applySearch} className="mb-6 flex flex-wrap items-end gap-3">
        <label className="block min-w-[12rem] flex-1">
          <span className="mb-1 block text-xs font-medium text-foreground-muted">Email contains</span>
          <input
            type="search"
            className="input-field"
            value={emailDraft}
            onChange={(e) => setEmailDraft(e.target.value)}
            placeholder="Search by email address"
          />
        </label>
        <button type="submit" className="btn-primary" disabled={loading} aria-busy={loading || undefined}>
          {loading ? (
            <>
              <LoadingSpinner className="h-5 w-5" label="Searching users" />
              <span className="sr-only">Searching users</span>
            </>
          ) : (
            'Search'
          )}
        </button>
        <button
          type="button"
          className={panelActionBtnClass}
          onClick={() => {
            setEmailDraft('');
            setSearchParams(new URLSearchParams());
          }}
        >
          Reset
        </button>
      </form>

      <div className="mb-3 text-sm text-foreground-muted">
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <LoadingSpinner className="h-4 w-4" label="Refreshing users" />
            Refreshing users
          </span>
        ) : total === 0 ? 'No users found.' : `Showing ${from}–${to} of ${total}`}
      </div>

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-foreground/5">
              <th className="p-3 font-medium text-foreground">ID</th>
              <th className="p-3 font-medium text-foreground">Username</th>
              <th className="p-3 font-medium text-foreground">Email</th>
              <th className="p-3 font-medium text-foreground">Role</th>
              <th className="p-3 font-medium text-foreground">Active</th>
              <th className="p-3 font-medium text-foreground">Blocked</th>
              <th className="p-3 font-medium text-foreground">Tariff</th>
              <th className="p-3 font-medium text-foreground" />
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0 hover:bg-line/10">
                <td className="p-3 font-mono text-foreground-muted">{u.id}</td>
                <td className="p-3">{u.username}</td>
                <td className="p-3 break-all">{u.email}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{u.is_active ? 'yes' : 'no'}</td>
                <td className="p-3">{u.is_blocked ? 'yes' : 'no'}</td>
                <td className="p-3">{u.tariff_plan ?? '—'}</td>
                <td className="p-3 text-right">
                  <Link to={`/admin/users/${u.id}`} className="text-brand font-medium hover:underline">
                    Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button type="button" className={panelActionBtnClass} disabled={!canPrev} onClick={() => goOffset(offsetQ - PAGE_SIZE)}>
          Previous
        </button>
        <button type="button" className={panelActionBtnClass} disabled={!canNext} onClick={() => goOffset(offsetQ + PAGE_SIZE)}>
          Next
        </button>
      </div>
    </div>
  );
}
