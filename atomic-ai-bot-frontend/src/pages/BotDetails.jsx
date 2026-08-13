import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Loader, { LoadingSpinner } from '../components/Loader';
import Alert from '../components/Alert';
import DeleteBotModal from '../components/DeleteBotModal';
import PlatformSetupModal from '../components/PlatformSetupModal';
import bucket from '../assets/bucket.png';
import html5Icon from '../assets/html5.svg';
import reactIcon from '../assets/react.svg';
import nodeIcon from '../assets/node.svg';
import { deleteBot, listBots } from '../api/bots';
import { clearTokens } from '../utils/token';
import { panelActionBtnClass, iconActionBtnClass } from '../ui/botPanelStyles';
import WidgetEmbedPreview from '../components/WidgetEmbedPreview';
import { allowedDomainToHref } from '../utils/allowedDomainLink';

function DockChevronIcon({ direction, className = 'h-4 w-4' }) {
  const isDown = direction === 'down';
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {isDown ? <path d="m6 9 6 6 6-6" /> : <path d="m18 15-6-6-6 6" />}
    </svg>
  );
}

function AllowedDomainValue({ domain, className = '' }) {
  const label = domain || '—';
  const href = allowedDomainToHref(domain);

  if (!href) {
    return <span className={`break-all font-mono ${className}`}>{label}</span>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block break-all font-mono text-foreground transition-colors hover:text-brand ${className}`}
    >
      {label}
    </a>
  );
}

const setupPlatforms = [
  {
    key: 'static',
    name: 'Static site',
    iconSrc: html5Icon,
    paragraphs: [
      'If your project is a classic static site (HTML pages with CSS and JavaScript — without a server rendering layer), connect the assistant by repeating the snippet below on every page where the widget should appear.',
      'Open each `.html` file and paste the script immediately before the closing `</body>` tag so the page is fully parsed first.',
      'The widget validates your domain on every load. If the page origin does not match the bot allowed domain (exact host or subdomain), the API returns 403 Domain not allowed. Use the same hostname in bot settings as in the browser — localhost and 127.0.0.1 are different.',
      '`data-api-key` and `data-backend-url` are already filled in the snippet below — copy as shown, then save, publish, and reload the site on the domain allowed for this bot.',
    ],
  },
  {
    key: 'react',
    name: 'React',
    iconSrc: reactIcon,
    reactVariants: [
      {
        title: 'React — An easy way',
        paragraphs: [
          'If you do not want to spend much time on wiring or reading extra React-specific steps, use this simplified path.',
          'Take the same `<script>` snippet as for a static site below. `data-api-key` and `data-backend-url` are already filled in — copy it exactly as shown, then save, publish, and reload on a domain allowed for this bot.',
          'Open the main `index.html` in your project’s `public` folder (most React setups expose a single root file there) and paste the snippet immediately before the closing `</body>` tag so the document is fully parsed first.',
        ],
      },
      {
        title: 'React — An advanced method',
        paragraphs: [
          'Use this path if you want tighter control over when the widget loads, or if you need to omit it on certain pages or layouts.',
          'Create a dedicated component (for example `AtomicBot.jsx`) and paste the code from the first block below. The API key and backend URL are already set for this bot.',
          'Mount `<AtomicBot />` once near the root of your tree — e.g. in `App.jsx` — next to your shell and routes, as in the second block.',
        ],
      },
    ],
  },
  {
    key: 'node',
    name: 'Node.js',
    iconSrc: nodeIcon,
    paragraphs: [
      'If your site uses Node.js with server-side rendering (SSR), create a partial such as `views/partials/atomic-ai-bot.ejs` with your templating engine and paste the widget `<script>` from the Snippet block into that file (`data-api-key` and `data-backend-url` are already set for this bot).',
      'Include that partial once in your root layout, immediately before the closing `</body>` tag (after your usual header, main, and footer includes). Every page that uses that shell will load the assistant automatically.',
      'The example layout below uses EJS (`<%- include(...) %>`). The same pattern — one reusable partial with the script and one include in the layout — works for Pug, Handlebars, Nunjucks, and other engines; only the include syntax differs.',
    ],
    ejsLayoutExample: `<!DOCTYPE html>
<html lang="en">
<%- include('partials/head') %>
<body>
    <div class="wrapper">
        <%- include('partials/header') %>
        <%- include('partials/main') %>
        <%- include('partials/footer') %>
    </div>
    <%- include('partials/atomic-ai-bot') %>
</body>
</html>`,
  },
];

export default function BotDetails() {
  const { id } = useParams();
  const [bot, setBot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [copied, setCopied] = useState(false);
  const [apiDockOpen, setApiDockOpen] = useState(true);
  const [setupPlatform, setSetupPlatform] = useState(null);
  const copyTimerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    listBots()
      .then((bots) => {
        const found = bots.find((b) => String(b.id) === String(id));
        if (!found) throw new Error('Bot not found');
        setBot(found);
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
  }, [id, navigate]);

  useEffect(
    () => () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    },
    []
  );

  function handleCopyApiKey() {
    if (!bot?.api_key) return;
    navigator.clipboard
      .writeText(bot.api_key)
      .then(() => {
        setCopied(true);
        if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
        copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

  function scrollToSetupSteps() {
    document.getElementById('setup-steps')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function confirmDeleteFromModal() {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleteTarget(null);
    setError(null);
    setDeleting(true);
    try {
      await deleteBot(targetId);
      navigate('/dashboard');
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        clearTokens();
        navigate('/login', { replace: true });
        return;
      }
      setError(err.detail || 'Failed to delete bot');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={`mt-4 w-full ${bot ? 'pb-40' : ''}`}>
      <DeleteBotModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteFromModal}
      />
      <PlatformSetupModal
        platform={setupPlatform}
        apiToken={bot?.api_key ?? ''}
        onClose={() => setSetupPlatform(null)}
      />

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="font-heading text-2xl font-medium text-brand">Integration guide</h1>
          <p className="mt-1 text-sm text-foreground-muted">Connect the widget to your allowed domain</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={panelActionBtnClass} onClick={() => navigate('/dashboard')}>
            Back
          </button>
          {bot ? (
            <button
              type="button"
              className={panelActionBtnClass}
              onClick={() => navigate(`/bot/${bot.id}/edit`, { state: { bot } })}
            >
              Edit
            </button>
          ) : null}
          {bot ? (
            <button
              type="button"
              className={iconActionBtnClass}
              disabled={deleting}
              aria-busy={deleting || undefined}
              aria-label="Delete bot"
              onClick={() => setDeleteTarget({ id: bot.id, name: bot.name })}
            >
              {deleting ? (
                <LoadingSpinner className="h-5 w-5" label="Deleting bot" />
              ) : (
                <img src={bucket} alt="" className="h-5 w-5 object-contain pointer-events-none" />
              )}
            </button>
          ) : null}
        </div>
      </div>

      {loading && <Loader />}
      {error && <Alert>{error}</Alert>}

      {bot ? (
        <div className="space-y-6">
          <div>
            <h2 className="mb-4 text-lg font-semibold text-brand">Bot information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-sm text-foreground-muted">Name</div>
                <div className="text-lg font-medium">{bot.name}</div>
              </div>
              <div>
                <div className="mb-1 text-sm text-foreground-muted">Allowed domain</div>
                <AllowedDomainValue domain={bot.allowed_domain} className="text-lg font-medium" />
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold text-brand">AI</h2>
            <div className="mb-1 text-sm text-foreground-muted">System prompt</div>
            <pre className="whitespace-pre-wrap rounded-lg bg-foreground/5 p-4 font-sans text-sm leading-relaxed">
              {bot.settings?.system_prompt ?? '—'}
            </pre>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold text-brand">Widget appearance</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-sm text-foreground-muted">Widget content</div>
                <div className="text-lg font-medium">{bot.settings?.widget?.icon ?? '—'}</div>
              </div>
              <div className="flex flex-wrap gap-6">
                <div>
                  <div className="mb-1 text-sm text-foreground-muted">Background color</div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-8 w-8 shrink-0 rounded border-line border"
                      style={{ backgroundColor: bot.settings?.widget?.color || 'transparent' }}
                      title={bot.settings?.widget?.color}
                    />
                    <code className="text-sm">{bot.settings?.widget?.color ?? '—'}</code>
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-sm text-foreground-muted">Text color</div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-8 w-8 shrink-0 rounded border-line border"
                      style={{ backgroundColor: bot.settings?.widget?.text_color || 'transparent' }}
                      title={bot.settings?.widget?.text_color}
                    />
                    <code className="text-sm">{bot.settings?.widget?.text_color ?? '—'}</code>
                  </div>
                </div>
              </div>
            </div>
            {bot.settings?.widget?.color && bot.settings?.widget?.text_color ? (
              <div className="mt-4">
                <WidgetEmbedPreview
                  showPreviewLabel={false}
                  bgColor={bot.settings.widget.color}
                  textColor={bot.settings.widget.text_color}
                  iconText={bot.settings.widget.icon ?? ''}
                />
              </div>
            ) : null}
          </div>

          <div id="setup-steps" className="scroll-mt-28">
            <h2 className="mb-4 text-lg font-semibold text-brand">Setup steps</h2>
            <p className="mb-4 text-sm text-foreground-muted">Choose your platform.</p>
            <div className="mx-auto flex max-w-xl flex-wrap justify-center gap-3 sm:gap-4">
              {setupPlatforms.map((platform) => (
                <button
                  key={platform.key}
                  type="button"
                  onClick={() => setSetupPlatform(platform)}
                  className="group flex h-32 w-32 shrink-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-line bg-transparent p-3 text-center transition-all duration-200 ease-out hover:scale-[1.06] hover:border-brand active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label={`${platform.name} setup`}
                >
                  <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center overflow-hidden rounded-md p-1.5">
                    <img
                      src={platform.iconSrc}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <span className="line-clamp-2 w-full px-0.5 text-base font-medium leading-snug text-foreground">
                    {platform.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {bot ? (
        <div className="pointer-events-none fixed bottom-[55px] left-0 right-0 z-20">
          <div className="layout-container pointer-events-auto relative">
            <div
              className={`absolute bottom-0 left-0 right-0 transition-[transform,opacity] duration-700 ease-out will-change-[transform,opacity] motion-reduce:transition-none ${
                apiDockOpen
                  ? 'z-20 translate-y-0 opacity-100'
                  : 'pointer-events-none z-0 translate-y-[calc(100%+80px)] opacity-0'
              }`}
            >
              <div className="group relative pt-4">
                <button
                  type="button"
                  onClick={() => setApiDockOpen(false)}
                  className="absolute left-1/2 top-4 z-10 flex h-8 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface/80 text-brand backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-brand/40 hover:bg-line/20 active:scale-95 max-md:opacity-100 max-md:scale-100 md:scale-75 md:opacity-0 md:group-hover:scale-100 md:group-hover:opacity-100"
                  aria-label="Hide API token"
                >
                  <DockChevronIcon direction="down" className="h-4 w-4" />
                </button>
                <div className="rounded-xl border border-line bg-surface/100 px-4 py-3 sm:py-4 backdrop-blur-xl backdrop-saturate-150 [-webkit-backdrop-filter:blur(18px)_saturate(1.5)] [backdrop-filter:blur(18px)_saturate(1.5)]">
                  <div className="mb-2 flex items-center justify-between gap-2 md:justify-start md:gap-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-sm font-semibold tracking-tight text-foreground">API Token</span>
                      <button
                        type="button"
                        onClick={scrollToSetupSteps}
                        className="border-0 bg-transparent p-0 text-xs font-medium text-brand transition-colors hover:text-brand-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-sm"
                      >
                        How to use?
                      </button>
                    </div>
                    <button
                      type="button"
                      className={`${panelActionBtnClass} shrink-0 px-2 py-1 text-[11px] leading-tight min-[501px]:hidden`}
                      onClick={handleCopyApiKey}
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="min-w-0 flex-1 break-all text-sm font-normal leading-normal text-foreground">
                      {bot.api_key}
                    </span>
                    <button
                      type="button"
                      className={`${panelActionBtnClass} hidden shrink-0 max-[501px]:hidden`}
                      onClick={handleCopyApiKey}
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div
              className={`absolute bottom-0 left-0 right-0 z-10 flex justify-center will-change-[transform,opacity] motion-reduce:transition-none ${
                apiDockOpen
                  ? 'pointer-events-none translate-y-3 opacity-0'
                  : 'pointer-events-auto translate-y-0 opacity-100 transition-[transform,opacity] duration-300 ease-out'
              }`}
            >
              <button
                type="button"
                onClick={() => setApiDockOpen(true)}
                className="inline-flex h-11 max-w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface/100 px-4 text-brand backdrop-blur-xl backdrop-saturate-150 transition-all duration-300 hover:scale-[1.02] hover:border-brand/40 active:scale-[0.98] [-webkit-backdrop-filter:blur(18px)_saturate(1.5)] [backdrop-filter:blur(18px)_saturate(1.5)]"
                aria-label="Show API token"
              >
                <span className="text-sm font-semibold tracking-tight text-foreground">API Token</span>
                <DockChevronIcon direction="up" className="h-5 w-5 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
