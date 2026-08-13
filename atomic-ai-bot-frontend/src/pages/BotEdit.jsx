import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';
import Loader from '../components/Loader';
import { listBots, updateBot } from '../api/bots';
import { clearTokens } from '../utils/token';
import { panelActionBtnClass } from '../ui/botPanelStyles';
import WidgetEmbedPreview from '../components/WidgetEmbedPreview';

const defaultForm = {
  name: '',
  allowed_domain: '',
  system_prompt: 'You are a helpful customer service assistant.',
  widget_icon: 'Atomic AI Bot',
  widget_color: '#4f46e5',
  widget_text_color: '#ffffff',
};

function buildBotPayload(form, baseline) {
  const payload = {};
  const name = form.name.trim();
  const allowedDomain = form.allowed_domain.trim();
  const settings = {
    system_prompt: form.system_prompt.trim(),
    widget: {
      icon: form.widget_icon.trim(),
      color: form.widget_color,
      text_color: form.widget_text_color,
    },
  };

  if (name !== baseline.name) payload.name = name;
  if (allowedDomain !== baseline.allowed_domain) payload.allowed_domain = allowedDomain;

  const baselineSettings = JSON.stringify(baseline.settings ?? {});
  const nextSettings = JSON.stringify(settings);
  if (nextSettings !== baselineSettings) payload.settings = settings;

  return payload;
}

function getFormFromBot(bot) {
  if (!bot) return { ...defaultForm, name: '', allowed_domain: '' };
  return {
    name: bot.name ?? '',
    allowed_domain: bot.allowed_domain ?? '',
    system_prompt: bot.settings?.system_prompt ?? defaultForm.system_prompt,
    widget_icon: bot.settings?.widget?.icon ?? defaultForm.widget_icon,
    widget_color: bot.settings?.widget?.color ?? defaultForm.widget_color,
    widget_text_color: bot.settings?.widget?.text_color ?? defaultForm.widget_text_color,
  };
}

function getBaselineFromBot(bot) {
  const form = getFormFromBot(bot);
  return {
    name: form.name.trim(),
    allowed_domain: form.allowed_domain.trim(),
    settings: {
      system_prompt: form.system_prompt.trim(),
      widget: {
        icon: form.widget_icon.trim(),
        color: form.widget_color,
        text_color: form.widget_text_color,
      },
    },
  };
}

export default function BotEdit() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [baseline, setBaseline] = useState(() =>
    location.state?.bot ? getBaselineFromBot(location.state.bot) : null
  );
  const [form, setForm] = useState(() => getFormFromBot(location.state?.bot));
  const [loading, setLoading] = useState(!location.state?.bot);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location.state?.bot) {
      return;
    }

    listBots()
      .then((bots) => {
        const found = bots.find((bot) => String(bot.id) === String(id));
        if (!found) {
          throw new Error('Bot not found');
        }
        setForm(getFormFromBot(found));
        setBaseline(getBaselineFromBot(found));
      })
      .catch((err) => {
        if (err.status === 401 || err.status === 403) {
          clearTokens();
          navigate('/login', { replace: true });
          return;
        }
        setError(err.detail || err.message || 'Failed to load bot');
      })
      .finally(() => setLoading(false));
  }, [id, location.state?.bot, navigate]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (
      form.name.trim().length < 2 ||
      !form.allowed_domain.trim() ||
      !form.system_prompt.trim() ||
      !form.widget_color ||
      !form.widget_text_color
    ) {
      setError('Please fill in all required fields.');
      return;
    }

    setSaving(true);
    try {
      const payload = baseline ? buildBotPayload(form, baseline) : {
        name: form.name.trim(),
        allowed_domain: form.allowed_domain.trim(),
        settings: {
          system_prompt: form.system_prompt.trim(),
          widget: {
            icon: form.widget_icon.trim(),
            color: form.widget_color,
            text_color: form.widget_text_color,
          },
        },
      };

      if (Object.keys(payload).length === 0) {
        navigate('/dashboard');
        return;
      }

      await updateBot(id, payload);
      navigate('/dashboard');
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        clearTokens();
        navigate('/login', { replace: true });
        return;
      }
      setError(err.detail || 'Failed to update bot');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 w-full">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="font-heading text-2xl font-medium text-brand">Edit bot</h1>
          <p className="mt-1 text-sm text-foreground-muted">Update settings and widget appearance</p>
        </div>
        <button type="button" className={panelActionBtnClass} onClick={() => navigate('/dashboard')}>
          Cancel
        </button>
      </div>

      {loading && <Loader />}
      {error && <Alert>{error}</Alert>}

      {!loading && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="mb-4 text-lg font-semibold text-brand">General</h2>
            <Input
              label="Bot name"
              name="name"
              value={form.name}
              onChange={handleChange}
              minLength={2}
              maxLength={100}
              required
              placeholder="My Support Bot"
            />
            <Input
              label="Allowed domain (e.g. example.com)"
              name="allowed_domain"
              value={form.allowed_domain}
              onChange={handleChange}
              required
              placeholder="127.0.0.1:5500"
            />
            <p className="mt-1 text-xs text-foreground-muted">
              Host and port as in the browser (e.g. example.com or 127.0.0.1:5500). No http://,
              path, or trailing slash.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold text-brand">AI</h2>
            <label className="block">
              <span className="mb-2 block font-medium text-foreground-muted">System prompt</span>
              <textarea
                className="input-field min-h-32 resize-y"
                name="system_prompt"
                value={form.system_prompt}
                onChange={handleChange}
                required
                placeholder="Describe how the assistant should behave and respond to visitors"
              />
            </label>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold text-brand">Widget appearance</h2>
            <div className="mb-4 space-y-4">
              <Input
                label="Icon (emoji or text)"
                name="widget_icon"
                value={form.widget_icon}
                onChange={handleChange}
                placeholder="🤖 or Help"
              />
              <div className="flex flex-wrap items-end gap-8">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-foreground-muted">
                    Background color
                  </span>
                  <input
                    type="color"
                    name="widget_color"
                    value={form.widget_color}
                    onChange={handleChange}
                    onInput={handleChange}
                    className="box-border h-10 w-10 cursor-pointer rounded border border-line bg-surface p-0.5"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-foreground-muted">Text color</span>
                  <input
                    type="color"
                    name="widget_text_color"
                    value={form.widget_text_color}
                    onChange={handleChange}
                    onInput={handleChange}
                    className="box-border h-10 w-10 cursor-pointer rounded border border-line bg-surface p-0.5"
                    required
                  />
                </label>
              </div>
            </div>
            <WidgetEmbedPreview
              defaultChatOpen
              bgColor={form.widget_color}
              textColor={form.widget_text_color}
              iconText={form.widget_icon}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" loading={saving} loadingLabel="Saving changes" className="w-auto px-8 max-[450px]:w-full">
              Save changes
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
