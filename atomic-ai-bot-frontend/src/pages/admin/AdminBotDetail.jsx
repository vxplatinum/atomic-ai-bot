import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteAdminBot, getAdminBot, patchAdminBot } from '../../api/admin';
import Alert from '../../components/Alert';
import Loader, { LoadingSpinner } from '../../components/Loader';
import { panelActionBtnClass } from '../../ui/botPanelStyles';
import { clearTokens } from '../../utils/token';
import { formatAdminError } from '../../utils/adminErrors';

function stringifySettings(settings) {
  if (settings == null) return '';
  try {
    return JSON.stringify(settings, null, 2);
  } catch {
    return '';
  }
}

export default function AdminBotDetail() {
  const { botId } = useParams();
  const navigate = useNavigate();
  const [bot, setBot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [jsonError, setJsonError] = useState(null);

  const [name, setName] = useState('');
  const [allowedDomain, setAllowedDomain] = useState('');
  const [settingsText, setSettingsText] = useState('');

  function loadBot() {
    setError(null);
    setFormError(null);
    setJsonError(null);
    setNotFound(false);
    setForbidden(false);
    return getAdminBot(botId)
      .then((data) => {
        setBot(data);
        setName(data.name ?? '');
        setAllowedDomain(data.allowed_domain ?? '');
        setSettingsText(stringifySettings(data.settings));
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
    loadBot()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [botId, navigate]);

  async function handleSave(e) {
    e.preventDefault();
    setFormError(null);
    setJsonError(null);

    const trimmed = settingsText.trim();
    let settingsPayload;
    if (!trimmed) {
      settingsPayload = {};
    } else {
      try {
        settingsPayload = JSON.parse(trimmed);
      } catch {
        setJsonError('Invalid JSON in settings.');
        return;
      }
    }

    if (name.trim().length < 2) {
      setFormError('Bot name must be at least 2 characters.');
      return;
    }

    const body = {
      name: name.trim(),
      allowed_domain: allowedDomain.trim(),
      settings: settingsPayload,
    };

    setSaving(true);
    try {
      const updated = await patchAdminBot(botId, body);
      setBot(updated);
      setName(updated.name ?? '');
      setAllowedDomain(updated.allowed_domain ?? '');
      setSettingsText(stringifySettings(updated.settings));
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

  async function handleDelete() {
    if (
      !window.confirm(
        'Delete this bot permanently? This cannot be undone.'
      )
    ) {
      return;
    }
    setDeleting(true);
    setFormError(null);
    try {
      const ownerId = bot?.owner_id;
      await deleteAdminBot(botId);
      if (ownerId != null) {
        navigate(`/admin/users/${ownerId}`, { replace: true });
      } else {
        navigate('/admin/users', { replace: true });
      }
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
      setFormError(formatAdminError(err));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <Loader />;
  if (forbidden) return <Alert>You do not have access to the admin panel.</Alert>;
  if (notFound) return <Alert>Not found.</Alert>;
  if (error) return <Alert>{error}</Alert>;
  if (!bot) return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-medium text-brand">Bot #{bot.id}</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Owner:{' '}
            <Link to={`/admin/users/${bot.owner_id}`} className="text-brand hover:underline">
              user {bot.owner_id}
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to={`/admin/users/${bot.owner_id}`} className="text-sm font-medium text-brand hover:underline">
            ← Owner
          </Link>
          <Link to="/admin/users" className="text-sm font-medium text-brand hover:underline">
            All users
          </Link>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-line bg-surface p-4">
        <div className="text-xs font-medium uppercase text-foreground-muted">API key</div>
        <pre className="mt-2 max-h-32 overflow-auto break-all text-xs font-mono text-foreground">
          {bot.api_key}
        </pre>
      </div>

      {formError ? (
        <div className="mb-4">
          <Alert>{formError}</Alert>
        </div>
      ) : null}
      {jsonError ? (
        <div className="mb-4">
          <Alert>{jsonError}</Alert>
        </div>
      ) : null}

      <form onSubmit={handleSave} className="mb-8 max-w-3xl space-y-4 rounded-lg border border-line bg-surface p-4">
        <h2 className="font-heading text-lg font-semibold text-brand">Edit</h2>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-foreground-muted">Name</span>
          <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} disabled={saving} placeholder="Bot display name" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-foreground-muted">Allowed domain</span>
          <input
            type="text"
            className="input-field"
            value={allowedDomain}
            onChange={(e) => setAllowedDomain(e.target.value)}
            disabled={saving}
            placeholder="example.com"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-foreground-muted">Settings (JSON)</span>
          <textarea
            className="input-field min-h-48 resize-y font-mono text-xs"
            value={settingsText}
            onChange={(e) => setSettingsText(e.target.value)}
            disabled={saving}
            spellCheck={false}
            placeholder='{"system_prompt": "You are helpful", "widget": {}}'
          />
        </label>

        <div className="flex flex-wrap gap-2 pt-2">
          <button type="submit" className="btn-primary" disabled={saving} aria-busy={saving || undefined}>
            {saving ? (
              <>
                <LoadingSpinner className="h-5 w-5" label="Saving bot" />
                <span className="sr-only">Saving bot</span>
              </>
            ) : (
              'Save'
            )}
          </button>
          <button type="button" className={panelActionBtnClass} onClick={() => loadBot().catch(() => {})} disabled={saving}>
            Reload
          </button>
        </div>
      </form>

      <div className="max-w-3xl rounded-lg border border-red-500/40 bg-red-500/5 p-4">
        <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">Danger zone</h3>
        <p className="mt-2 text-sm text-foreground-muted">Remove this bot from the system.</p>
        <button
          type="button"
          className="btn-primary mt-3 bg-red-600 hover:bg-red-700"
          disabled={deleting}
          aria-busy={deleting || undefined}
          onClick={handleDelete}
        >
          {deleting ? (
            <>
              <LoadingSpinner className="h-5 w-5" label="Deleting bot" />
              <span className="sr-only">Deleting bot</span>
            </>
          ) : (
            'Delete bot'
          )}
        </button>
      </div>
    </div>
  );
}
