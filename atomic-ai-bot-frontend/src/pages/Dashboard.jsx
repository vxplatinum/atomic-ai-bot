import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Loader, { LoadingSpinner } from '../components/Loader';
import Alert from '../components/Alert';
import DeleteBotModal from '../components/DeleteBotModal';
import bucket from '../assets/bucket.png';
import bot from '../assets/bot.png';
import { deleteBot, listBots } from '../api/bots';
import useAuth from '../hooks/useAuth';
import { panelActionBtnClass, iconActionBtnClass } from '../ui/botPanelStyles';

export default function Dashboard() {
  const { user } = useAuth();
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const botsData = await listBots();
        if (cancelled) return;

        setBots(botsData);
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          navigate('/login', { replace: true });
          return;
        }

        setError('Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function confirmDeleteFromModal() {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeleteTarget(null);
    setError(null);
    setDeletingId(id);
    try {
      await deleteBot(id);
      setBots((currentBots) => currentBots.filter((bot) => bot.id !== id));
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        navigate('/login', { replace: true });
        return;
      }

      setError(err.detail || 'Failed to delete bot');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="w-full mt-4">
      <DeleteBotModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteFromModal}
      />
      <div className="mb-8 flex w-full min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {user?.username ? (
            <h2 className="text-3xl font-bold">
              Welcome, <span className="text-brand">{user.username}</span> !
            </h2>
          ) : !loading ? (
            <h2 className="text-3xl font-bold text-foreground">Your workspace</h2>
          ) : null}
        </div>
      </div>
      <div className="mb-8 border-b border-line pb-4">
        <h2 className="font-heading text-2xl font-medium text-brand">Your bots</h2>
        <p className="mt-1 text-sm text-foreground-muted">Here you can manage your bots.</p>
      </div>
      <div className="mb-8">
        <Button className="w-auto max-[450px]:w-full" onClick={() => navigate('/bot/create')}>
          + Create new bot
        </Button>
      </div>
      {loading && <Loader />}
      {error && <Alert>{error}</Alert>}
      {!loading && !error && (
        <div>
          {bots.length === 0 ? (
            <div className="text-foreground-muted py-12 text-center">
              <span className="inline-flex items-center justify-center rounded-full mb-4">
                <img src={bot} alt="atom" className="w-20 h-20" />
              </span>
              <p>You don&apos;t have any atoms yet. Create your first AI assistant.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {bots.map((bot) => (
                <li
                  key={bot.id}
                  tabIndex={0}
                  aria-label={`Open ${bot.name} details`}
                  className="card flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-surface transition-colors hover:bg-line/20 has-[button:hover]:!bg-surface cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  onClick={() => navigate(`/bot/${bot.id}`)}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/bot/${bot.id}`);
                    }
                  }}
                >
                  <div>
                    <div className="text-xl font-bold text-brand">{bot.name}</div>
                    <div className="text-sm text-foreground-muted font-mono mt-1">{bot.allowed_domain}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/bot/${bot.id}/edit`, { state: { bot } });
                      }}
                      className={panelActionBtnClass}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget({ id: bot.id, name: bot.name });
                      }}
                      disabled={deletingId === bot.id}
                      className={iconActionBtnClass}
                      aria-busy={deletingId === bot.id || undefined}
                      aria-label="Delete bot"
                    >
                      {deletingId === bot.id ? (
                        <LoadingSpinner className="h-5 w-5" label="Deleting bot" />
                      ) : (
                        <img src={bucket} alt="" className="h-5 w-5 object-contain pointer-events-none" />
                      )}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
