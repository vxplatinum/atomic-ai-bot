import { useEffect, useState } from 'react';
import CodeBlockWithCopy from './CodeBlockWithCopy';
import { getApiBaseUrl, getWidgetScriptUrl } from '../config/env';
import { panelActionBtnClass } from '../ui/botPanelStyles';

const variantTabBtnClass =
  'flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] border text-xs font-semibold leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export default function PlatformSetupModal({ platform, apiToken = '', onClose }) {
  const [reactTab, setReactTab] = useState(1);

  useEffect(() => {
    if (!platform) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKeydown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeydown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeydown);
    };
  }, [platform, onClose]);

  useEffect(() => {
    if (platform?.key === 'react') setReactTab(1);
  }, [platform?.key]);

  if (!platform) return null;

  const widgetScriptSrc = getWidgetScriptUrl();
  const backendUrl = getApiBaseUrl();

  const scriptSnippet = `<script
  src="${widgetScriptSrc}"
  id="atomic-ai-bot"
  data-backend-url="${backendUrl}"
  data-api-key="${apiToken}"
  defer
></script>`;

  const atomicBotComponentSnippet = `import { useEffect } from 'react';

const AtomicBot = () => {
  useEffect(() => {
    if (!document.getElementById('atomic-ai-bot')) {
      const script = document.createElement('script');
      script.id = 'atomic-ai-bot';
      script.src = '${widgetScriptSrc}';
      script.dataset.backendUrl = ${JSON.stringify(backendUrl)};
      script.dataset.apiKey = ${JSON.stringify(apiToken)};
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  return null;
};

export default AtomicBot;`;

  const reactAppShellSnippet = `function App() {
  return (
    <div>
      <AtomicBot />
      <Header />
      <MainRoutes />
    </div>
  );
}`;

  const isReact = platform.key === 'react' && Array.isArray(platform.reactVariants);
  const activeReactVariant = isReact ? platform.reactVariants[reactTab - 1] : null;
  const dialogTitle = isReact && activeReactVariant ? activeReactVariant.title : platform.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-foreground/15 backdrop-blur-[2px]"
        aria-hidden
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="platform-setup-dialog-title"
        className="relative z-10 flex max-h-[min(85vh,680px)] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-lg"
      >
        <h2 id="platform-setup-dialog-title" className="shrink-0 px-6 pt-6 text-lg font-semibold text-brand">
          {dialogTitle}
        </h2>

        {isReact ? (
          <div
            className="flex shrink-0 gap-1.5 px-6 pb-3 pt-3"
            role="tablist"
            aria-label="React setup method"
          >
            <button
              type="button"
              role="tab"
              aria-selected={reactTab === 1}
              className={`${variantTabBtnClass} ${
                reactTab === 1
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-line bg-transparent text-foreground-muted hover:border-brand/50 hover:text-foreground'
              }`}
              onClick={() => setReactTab(1)}
            >
              1
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={reactTab === 2}
              className={`${variantTabBtnClass} ${
                reactTab === 2
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-line bg-transparent text-foreground-muted hover:border-brand/50 hover:text-foreground'
              }`}
              onClick={() => setReactTab(2)}
            >
              2
            </button>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {(platform.key === 'static' || platform.key === 'node') ? (
            <div className="space-y-4">
              <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground-muted">
                {platform.paragraphs.map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ol>
              <div>
                <CodeBlockWithCopy code={scriptSnippet} label="Snippet" />
              </div>
              {platform.key === 'node' && platform.ejsLayoutExample ? (
                <div>
                  <CodeBlockWithCopy
                    expandVertically
                    code={platform.ejsLayoutExample}
                    label="Example layout (EJS)"
                  />
                </div>
              ) : null}
            </div>
          ) : isReact && activeReactVariant ? (
            <div className="space-y-4">
              <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground-muted">
                {activeReactVariant.paragraphs.map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ol>
              {reactTab === 1 ? (
                <div>
                  <CodeBlockWithCopy code={scriptSnippet} label="Snippet" />
                </div>
              ) : (
                <>
                  <div>
                    <CodeBlockWithCopy expandVertically code={atomicBotComponentSnippet} label="AtomicBot.jsx" />
                  </div>
                  <div>
                    <CodeBlockWithCopy code={reactAppShellSnippet} label="App.jsx" />
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {platform.paragraphs.map((text, i) => (
                <p key={i} className="text-sm leading-relaxed text-foreground-muted">
                  {text}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-line px-6 py-4">
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className={panelActionBtnClass} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
