document.addEventListener('DOMContentLoaded', () => {
    const BOT_URL_META = document
        .querySelector('meta[name="atomic-ai-bot-bot-base"]')
        ?.getAttribute('content')
        ?.trim();
    const BOT_URL = (
        BOT_URL_META && BOT_URL_META.length > 0
            ? BOT_URL_META
            : window.location.origin
    ).replace(/\/+$/, '');

    const urlParams = new URLSearchParams(window.location.search);
    const apiKey = urlParams.get('api_key') || urlParams.get('token');

    function decodeRepeatedUriComponent(raw) {
        if (!raw) return '';
        let s = String(raw);
        for (let i = 0; i < 4; i++) {
            try {
                const next = decodeURIComponent(s);
                if (next === s) break;
                s = next;
            } catch (_) {
                break;
            }
        }
        return s;
    }

    function normalizeEmbedOrigin(candidate) {
        const t = String(candidate ?? '').trim();
        if (!t) return '';
        try {
            return new URL(t).origin;
        } catch (_) {
            return '';
        }
    }

    let widgetOrigin = '';
    const parentOriginParam = urlParams.get('parent_origin');
    if (parentOriginParam) {
        widgetOrigin = normalizeEmbedOrigin(
            decodeRepeatedUriComponent(parentOriginParam),
        );
    } else if (document.referrer) {
        try {
            widgetOrigin = new URL(document.referrer).origin;
        } catch (_) {
            widgetOrigin = '';
        }
    }

    const input = document.getElementById('input');
    const btn = document.getElementById('send');
    const messages = document.getElementById('messages');

    const chatHeaderTrailing = document.querySelector('.chat__header-trailing');
    const chatMenuBtn = document.getElementById('chat-menu-btn');
    const chatDropdown = document.getElementById('chat-menu-dropdown');
    const chatClearBtn = document.getElementById('chat-clear-btn');
    const chatCloseBtn = document.getElementById('chat-close-btn');

    const clearChatModal = document.getElementById('clear-chat-modal');
    const clearChatModalBackdrop =
        document.getElementById('clear-chat-modal-backdrop');
    const clearChatModalCancel =
        document.getElementById('clear-chat-cancel');
    const clearChatModalConfirm =
        document.getElementById('clear-chat-confirm');

    let historyLoaded = false;

    function setChatMenuOpen(open) {
        if (!chatDropdown || !chatMenuBtn) return;
        chatDropdown.hidden = !open;
        chatMenuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function clearModalOpen() {
        return clearChatModal ? !clearChatModal.hidden : false;
    }

    function openClearConfirmModal() {
        if (!clearChatModal || !historyLoaded) return;
        setChatMenuOpen(false);
        clearChatModal.removeAttribute('hidden');
        clearChatModal.setAttribute('aria-hidden', 'false');
        queueMicrotask(() => clearChatModalCancel?.focus?.());
    }

    function closeClearConfirmModal() {
        if (!clearChatModal) return;
        clearChatModal.hidden = true;
        clearChatModal.setAttribute('aria-hidden', 'true');
    }

    if (chatCloseBtn) {
        chatCloseBtn.addEventListener('click', () => {
            try {
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage(
                        { type: 'atomic_ai_bot_close_chat' },
                        '*',
                    );
                }
            } catch (_) {
                // Ignore cross-origin postMessage failures.
            }
        });
    }

    const storageKeySession = apiKey
        ? `atomic_ai_bot_session_${encodeURIComponent(apiKey)}`
        : 'atomic_ai_bot_session';

    function dismissHistoryLoading() {
        document.getElementById('chat-loading')?.remove();
    }

    function showHistoryLoading() {
        dismissHistoryLoading();
        if (!messages) return;
        const overlay = document.createElement('div');
        overlay.id = 'chat-loading';
        overlay.className = 'chat__loading';
        overlay.setAttribute('aria-busy', 'true');

        const wrap = document.createElement('span');
        wrap.className = 'chat__spinner-wrap';
        wrap.setAttribute('role', 'status');
        wrap.setAttribute('aria-label', 'Loading chat');

        const img = document.createElement('img');
        img.className = 'chat__spinner-img';
        img.src = `${BOT_URL}/static/images/spiner.png`;
        img.alt = '';
        img.decoding = 'async';
        img.setAttribute('width', '34');
        img.setAttribute('height', '34');

        wrap.appendChild(img);
        overlay.appendChild(wrap);
        messages.appendChild(overlay);
    }

    function appendDefaultGreeting() {
        if (!messages) return;
        const greeting = document.createElement('div');
        greeting.className = 'chat__message chat__message--bot';
        greeting.textContent = 'Hello! How can I help you?';
        messages.appendChild(greeting);
    }

    function resetChatViewportToFresh() {
        removeTypingIndicator();
        dismissHistoryLoading();
        if (!messages) return;
        messages.innerHTML = '';
        appendDefaultGreeting();
        requestAnimationFrame(() => {
            messages.scrollTo({
                top: messages.scrollHeight,
                behavior: 'smooth',
            });
        });
    }

    function setUiBlocked(reason) {
        dismissHistoryLoading();
        if (input) input.disabled = true;
        if (btn) btn.disabled = true;
        const row = document.createElement('div');
        row.className = 'chat__message chat__message--bot';
        row.textContent = reason;
        if (messages) messages.appendChild(row);
    }

    if (!apiKey) {
        console.error(
            'Atomic AI Bot: missing api_key or token in the chat URL.',
        );
        setUiBlocked('This chat is misconfigured (missing api key).');
        return;
    }

    if (!widgetOrigin) {
        console.error(
            'Atomic AI Bot: embedding origin missing; open the chat via the embedded widget.',
        );
        setUiBlocked(
            'This chat cannot start without a known site origin — use the embed widget.',
        );
        return;
    }

    function generateUUID() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }

    let sessionId = localStorage.getItem(storageKeySession);
    if (!sessionId) {
        sessionId = generateUUID();
        localStorage.setItem(storageKeySession, sessionId);
    }

    if (input) input.disabled = true;
    if (btn) btn.disabled = true;
    showHistoryLoading();

    async function apiErrorDetail(res) {
        try {
            const j = await res.json();
            if (typeof j.detail === 'string') return j.detail;
            if (Array.isArray(j.detail) && j.detail[0]?.msg) {
                return j.detail.map((d) => d.msg).join(' ');
            }
        } catch (_) {
            // Ignore non-JSON error bodies.
        }
        return `HTTP ${res.status}`;
    }

    async function runClearHistoryRequest() {
        const body = {
            session_id: String(sessionId ?? ''),
            api_key: String(apiKey ?? ''),
            widget_origin: String(widgetOrigin ?? ''),
        };
        let res;
        try {
            res = await fetch(`${BOT_URL}/history/clear`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
        } catch (e) {
            console.error(e);
            const errDiv = document.createElement('div');
            errDiv.className = 'chat__message chat__message--bot';
            errDiv.textContent =
                'Could not clear chat. Check your connection and try again.';
            messages?.appendChild(errDiv);
            messages?.scrollTo({
                top: messages.scrollHeight,
                behavior: 'smooth',
            });
            closeClearConfirmModal();
            return;
        }

        closeClearConfirmModal();

        if (!res.ok) {
            const errDiv = document.createElement('div');
            errDiv.className = 'chat__message chat__message--bot';
            errDiv.textContent = await apiErrorDetail(res);
            messages?.appendChild(errDiv);
            messages?.scrollTo({
                top: messages.scrollHeight,
                behavior: 'smooth',
            });
            return;
        }

        resetChatViewportToFresh();
        setChatMenuOpen(false);
    }

    const loadHistory = async () => {
        try {
            const q = new URLSearchParams({
                session_id: sessionId,
                api_key: apiKey,
                widget_origin: widgetOrigin,
            });
            const res = await fetch(`${BOT_URL}/history?${q.toString()}`);
            if (!res.ok) {
                dismissHistoryLoading();
                setUiBlocked(await apiErrorDetail(res));
                return;
            }
            const data = await res.json();

            const items = Array.isArray(data.history)
                ? data.history
                : [];
            items.forEach((msg) => {
                const text =
                    msg && typeof msg.content === 'string'
                        ? msg.content
                        : typeof msg?.message === 'string'
                          ? msg.message
                          : '';
                if (!text) {
                    return;
                }
                const div = document.createElement('div');
                div.className =
                    msg.role === 'user'
                        ? 'chat__message chat__message--user'
                        : 'chat__message chat__message--bot';
                div.textContent = text;
                messages.appendChild(div);
            });

            if (items.length === 0) {
                appendDefaultGreeting();
            }

            dismissHistoryLoading();
            if (input) input.disabled = false;
            if (btn) btn.disabled = false;

            historyLoaded = true;
            if (chatMenuBtn) chatMenuBtn.disabled = false;

            requestAnimationFrame(() => {
                if (!messages) return;
                messages.scrollTo({
                    top: messages.scrollHeight,
                    behavior: 'smooth',
                });
            });
        } catch (err) {
            console.error(err);
            dismissHistoryLoading();
            setUiBlocked('Could not load chat history.');
        }
    };
    loadHistory();

    document.addEventListener('keydown', (ev) => {
        if (ev.key !== 'Escape') return;
        if (clearModalOpen()) {
            closeClearConfirmModal();
            return;
        }
        setChatMenuOpen(false);
    });

    document.addEventListener('click', (ev) => {
        if (!chatDropdown || chatDropdown.hidden) return;
        if (clearModalOpen()) return;
        if (chatHeaderTrailing && chatHeaderTrailing.contains(ev.target))
            return;
        setChatMenuOpen(false);
    });

    if (chatMenuBtn && chatDropdown) {
        chatMenuBtn.addEventListener('click', (ev) => {
            if (!historyLoaded || chatMenuBtn.disabled) return;
            ev.preventDefault();
            const opening = chatDropdown.hidden;
            setChatMenuOpen(opening);
        });
    }

    if (chatClearBtn) {
        chatClearBtn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            if (!historyLoaded) return;
            openClearConfirmModal();
        });
    }

    clearChatModalBackdrop?.addEventListener('click', () =>
        closeClearConfirmModal(),
    );
    clearChatModalCancel?.addEventListener('click', () =>
        closeClearConfirmModal(),
    );

    clearChatModalConfirm?.addEventListener('click', async () => {
        if (!historyLoaded) return;
        try {
            if (clearChatModalConfirm) clearChatModalConfirm.disabled = true;
            if (clearChatModalCancel) clearChatModalCancel.disabled = true;
            await runClearHistoryRequest();
        } finally {
            if (clearChatModalConfirm) clearChatModalConfirm.disabled = false;
            if (clearChatModalCancel) clearChatModalCancel.disabled = false;
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && document.activeElement === input) {
            btn.click();
        }
    });

    btn.onclick = async () => {
        const text = input.value.trim();
        if (!text) return;

        const msg = document.createElement('div');
        msg.className = 'chat__message chat__message--user';
        msg.innerText = text;

        messages.appendChild(msg);
        input.value = '';

        messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });

        showTypingIndicator();

        try {
            const body = {
                message: text,
                session_id: String(sessionId ?? ''),
                api_key: String(apiKey ?? ''),
                widget_origin: String(widgetOrigin ?? ''),
            };

            const res = await fetch(`${BOT_URL}/ai-answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            removeTypingIndicator();

            const rawBody = await res.text();
            let data = {};
            try {
                data = rawBody ? JSON.parse(rawBody) : {};
            } catch (_) {
                data = {};
            }

            if (!res.ok) {
                const botMsg = document.createElement('div');
                botMsg.className = 'chat__message chat__message--bot';
                let errText =
                    typeof data.detail === 'string'
                        ? data.detail
                        : Array.isArray(data.detail) &&
                            data.detail.length &&
                            data.detail[0].msg
                          ? data.detail.map((e) => e.msg).join(' ')
                          : `HTTP ${res.status}`;
                if (data.detail === undefined && rawBody.length < 200) {
                    errText = rawBody || errText;
                }
                botMsg.textContent = errText;
                messages.appendChild(botMsg);
                messages.scrollTo({
                    top: messages.scrollHeight,
                    behavior: 'smooth',
                });
                return;
            }


            let reply =
                typeof data?.answer === 'string'
                    ? data.answer
                    : '';
            if (!reply && data?.detail) {
                reply =
                    typeof data.detail === 'string'
                        ? data.detail
                        : 'Request could not be completed.';
            }
            if (!reply) {
                reply =
                    'No reply text from the server. Check bot logs and MODEL_NAME / OpenRouter.';
            }

            const botMsg = document.createElement('div');
            botMsg.className = 'chat__message chat__message--bot';
            botMsg.textContent = reply;
            messages.appendChild(botMsg);

            messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
        } catch (err) {
            removeTypingIndicator();
            console.error(err);
            const botMsg = document.createElement('div');
            botMsg.className = 'chat__message chat__message--bot';
            botMsg.innerText =
                'Network error. Please check your connection and try again.';
            messages.appendChild(botMsg);
        }
    };

    window.addEventListener('message', (event) => {
        if (event.data === 'scroll_down') {
            setTimeout(() => {
                const el = document.querySelector('.chat__messages');
                if (el) {
                    el.scrollTo({
                        top: el.scrollHeight,
                        behavior: 'smooth',
                    });
                }
            }, 100);
        }
    });

    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className =
            'chat__message chat__message--bot chat__message--typing';
        typingDiv.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
        messages.appendChild(typingDiv);

        messages.scrollTo({
            top: messages.scrollHeight,
            behavior: 'smooth',
        });
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
});
