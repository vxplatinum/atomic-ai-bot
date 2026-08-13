(async function () {
    const scriptTag = document.getElementById('atomic-ai-bot');

    function stripTrailingSlash(url) {
        return (url || '').replace(/\/+$/, '');
    }

    // Same origin the dashboard puts in VITE_SERVER_URL. Prefer data-backend-url in production.
    const backendUrl = stripTrailingSlash(
        scriptTag?.getAttribute('data-backend-url') || 'http://127.0.0.1:8000',
    );

    let defaultBotUrl = 'http://127.0.0.1:8080';
    if (scriptTag?.src) {
        try {
            defaultBotUrl = new URL(scriptTag.src).origin;
        } catch (_) {}
    }

    const botUrl = stripTrailingSlash(
        scriptTag?.getAttribute('data-bot-url') || defaultBotUrl,
    );

    // GET {backend}/app/public/validate/{api_key}
    let validatePath = stripTrailingSlash(
        scriptTag?.getAttribute('data-validate-path')?.trim() ||
            '/app/public/validate',
    );
    if (validatePath && !validatePath.startsWith('/')) {
        validatePath = `/${validatePath}`;
    }

    const apiKey =
        scriptTag?.getAttribute('data-api-key') ||
        scriptTag?.getAttribute('data-token');

    if (!apiKey) {
        console.error(
            'Atomic AI Bot: set data-api-key or data-token on the script tag',
        );
        return;
    }

    const validateUrl = `${backendUrl}${validatePath}/${encodeURIComponent(apiKey)}`;

    try {
        const response = await fetch(validateUrl);

        if (!response.ok) {
            throw new Error(`Validate failed: HTTP ${response.status}`);
        }

        const botConfig = await response.json();

        // Main backend is authoritative after HTTP 200. Do not re-check allowed_domain here.
        initWidget(apiKey, botConfig);
    } catch (error) {
        console.error('Atomic AI Bot: Validation failed:', error);
    }

    function initWidget(key, config) {
        const HOST_TAG = 'atomic-ai-bot-host';
        if (document.querySelector(HOST_TAG)) {
            return;
        }

        const host = document.createElement(HOST_TAG);
        document.body.appendChild(host);

        const shadow = host.attachShadow({ mode: 'open' });

        const settings = config.settings ?? {};
        const widgetSettings = settings.widget ?? {};

        const launcherBg = widgetSettings.color ?? '#3b82f6';
        const launcherFg = widgetSettings.text_color ?? '#ffffff';

        const style = document.createElement('style');
        style.textContent = `
          :host {
            all: initial;
            --atomic-ab-launcher-bg: ${launcherBg};
            --atomic-ab-launcher-fg: ${launcherFg};
            position: fixed;
            inset: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 2147483647;
            isolation: isolate;
          }
          .atomic-ai-bot-launcher {
            position: fixed;
            bottom: 20px;
            right: 20px;
            box-sizing: border-box;
            margin: 0;
            padding: 4px 8px;
            display: flex;
            justify-content: center;
            align-items: center;
            border: none;
            border-radius: 4px;
            background: var(--atomic-ab-launcher-bg);
            color: var(--atomic-ab-launcher-fg);
            font: normal 18px/1 system-ui, -apple-system, 'Segoe UI', sans-serif;
            cursor: pointer;
            pointer-events: auto;
            box-shadow: none;
            transition: padding 0.2s ease, box-shadow 0.2s ease;
          }
          .atomic-ai-bot-launcher:hover {
            padding: 4.5px 8.5px;
            box-shadow: 0 8px 22px rgba(0, 0, 0, 0.2);
          }
          @media (prefers-reduced-motion: reduce) {
            .atomic-ai-bot-launcher {
              transition: none;
            }
            .atomic-ai-bot-frame {
              transition: none;
            }
          }
          .atomic-ai-bot-frame {
            box-sizing: border-box;
            margin: 0;
            position: fixed;
            bottom: 60px;
            right: 20px;
            width: min(320px, calc(100vw - 40px));
            height: min(480px, calc(100vh - 80px));
            max-width: calc(100vw - 40px);
            max-height: calc(100vh - 80px);
            border: none;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            background: #ffffff;
            display: none;
            pointer-events: auto;
            transition: width 0.32s ease, height 0.32s ease,
              max-width 0.32s ease, max-height 0.32s ease;
          }
          @supports (height: 100dvh) {
            .atomic-ai-bot-frame {
              height: min(480px, calc(100dvh - 80px));
              max-height: calc(100dvh - 80px);
            }
          }
          .atomic-ai-bot-frame.atomic-ai-bot-frame--open {
            display: block;
          }
        `;

        shadow.appendChild(style);

        const widgetIcon = document.createElement('button');
        widgetIcon.type = 'button';
        widgetIcon.className = 'atomic-ai-bot-launcher';
        widgetIcon.setAttribute('aria-label', 'Open chat');
        widgetIcon.textContent = widgetSettings.icon ?? '';
        shadow.appendChild(widgetIcon);

        const chatIframe = document.createElement('iframe');
        // Encode once. Double encodeURIComponent turns : into %253A and breaks domain checks.
        const parentOriginPlain = window.location.origin || '';
        const chatParams = new URLSearchParams();
        chatParams.set('api_key', key);
        chatParams.set('parent_origin', parentOriginPlain);
        chatIframe.src = `${botUrl}/chat?${chatParams.toString()}`;
        chatIframe.className = 'atomic-ai-bot-frame';
        chatIframe.title = 'Support chat';
        chatIframe.referrerPolicy = 'strict-origin-when-cross-origin';
        shadow.appendChild(chatIframe);

        window.addEventListener('message', (event) => {
            if (event.source !== chatIframe.contentWindow) return;
            const payload = event.data;
            if (
                payload &&
                typeof payload === 'object' &&
                payload.type === 'atomic_ai_bot_close_chat'
            ) {
                chatIframe.classList.remove('atomic-ai-bot-frame--open');
            }
        });

        widgetIcon.addEventListener('click', () => {
            const isOpening = !chatIframe.classList.contains(
                'atomic-ai-bot-frame--open',
            );
            chatIframe.classList.toggle('atomic-ai-bot-frame--open', isOpening);

            if (isOpening) {
                chatIframe.contentWindow?.postMessage('scroll_down', '*');
            }
        });
    }
})();
