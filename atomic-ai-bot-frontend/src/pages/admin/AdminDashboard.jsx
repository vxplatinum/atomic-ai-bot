import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminStats } from '../../api/admin';
import Alert from '../../components/Alert';
import Loader from '../../components/Loader';
import { clearTokens } from '../../utils/token';
import { formatAdminError } from '../../utils/adminErrors';

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{label}</div>
      <div className="mt-2 font-heading text-2xl font-semibold text-foreground">{value ?? '—'}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setForbidden(false);
    getAdminStats()
      .then((data) => {
        if (!cancelled) setStats(data);
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
  }, [navigate]);

  if (loading) return <Loader />;

  if (forbidden) {
    return <Alert>You do not have access to the admin panel.</Alert>;
  }

  if (error) {
    return <Alert>{error}</Alert>;
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-medium text-brand mb-2">Dashboard</h1>
      <p className="mb-6 text-sm text-foreground-muted">Overview and shortcuts.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <StatCard label="Total users" value={stats?.total_users} />
        <StatCard label="Total bots" value={stats?.total_bots} />
        <StatCard label="Active sessions" value={stats?.active_sessions} />
      </div>

      <div className="flex flex-wrap gap-4">
        <Link to="/admin/users" className="btn-primary">
          Manage users
        </Link>
      </div>
    </div>
  );
}
