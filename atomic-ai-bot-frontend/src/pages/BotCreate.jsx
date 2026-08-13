import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { createBot } from '../api/bots';
import { clearTokens } from '../utils/token';
import { panelActionBtnClass } from '../ui/botPanelStyles';
import WidgetEmbedPreview from '../components/WidgetEmbedPreview';

export default function BotCreate() {
  const [form, setForm] = useState({
    name: '',
    allowed_domain: '',
    system_prompt: 'You are a helpful customer service assistant.',
    widget_icon: 'Atomic AI Bot',
    widget_color: '#4f46e5',
    widget_text_color: '#ffffff',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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

    setLoading(true);
    try {
      const bot = await createBot({
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
      });
      navigate(`/bot/${bot.id}`);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        clearTokens();
        navigate('/login', { replace: true });
        return;
      }
      setError(err.detail?.[0]?.msg || err.detail || 'Failed to create bot');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 w-full">
      <div className="mb-8 flex flex-nowrap items-center justify-between gap-3 border-b border-line pb-4 max-[300px]:flex-col max-[300px]:items-stretch max-[300px]:gap-3">
        <div className="min-w-0 shrink">
          <h1 className="font-heading text-2xl font-medium text-brand">New bot</h1>
          <p className="mt-1 text-sm text-foreground-muted">Configure your assistant and widget</p>
        </div>
        <button
          type="button"
          className={`${panelActionBtnClass} max-[300px]:self-start shrink-0`}
          onClick={() => navigate('/dashboard')}
        >
          Cancel
        </button>
      </div>
      {error && <Alert>{error}</Alert>}
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
            Host and port as in the browser address bar (e.g. example.com or 127.0.0.1:5500). No
            http://, path, or trailing slash — the backend normalizes the value.
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
                <span className="mb-1 block text-sm font-medium text-foreground-muted">Background color</span>
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
          <Button type="submit" loading={loading} loadingLabel="Creating bot" className="w-auto px-8 max-[450px]:w-full">
            Create bot
          </Button>
        </div>
      </form>
    </div>
  );
}
