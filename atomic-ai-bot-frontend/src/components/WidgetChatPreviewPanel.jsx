import '../styles/widgetChatPreview.css';

export default function WidgetChatPreviewPanel({ accentColor, accentTextColor, titleText, onClose }) {
  const headerTitle = titleText ?? '';

  return (
    <div
      className="widget-chat-preview pointer-events-auto absolute bottom-[52px] right-4 z-20 h-[min(480px,calc(100%-4rem))] w-[320px] max-w-[calc(100%-2rem)]"
      style={{
        '--chat-accent': accentColor,
        '--chat-accent-text': accentTextColor || '#ffffff',
      }}
    >
      <div className="chat h-full">
        <div className="chat__header">
          <div className="chat__header-leading">
            <button
              type="button"
              className="chat__menu-toggle"
              aria-label="Close chat preview"
              onClick={onClose}
            >
              <span className="chat__close-icon" aria-hidden />
            </button>
          </div>
          <span className="chat__title">{headerTitle}</span>
          <div className="chat__header-trailing">
            <button
              type="button"
              className="chat__menu-toggle"
              aria-label="Chat menu"
              disabled
            >
              <span className="chat__menu-icon" aria-hidden>
                <span className="chat__menu-line" />
                <span className="chat__menu-line" />
                <span className="chat__menu-line" />
              </span>
            </button>
          </div>
        </div>

        <div className="chat__messages" aria-hidden>
          <div className="chat__message chat__message--bot">Hello! How can I help you?</div>
          <div className="chat__message chat__message--user">What are your opening hours?</div>
          <div className="chat__message chat__message--bot">
            We&apos;re open Monday to Friday, 9:00 AM – 6:00 PM.
          </div>
        </div>

        <div className="chat__input">
          <input
            type="text"
            className="chat__field"
            placeholder="Enter your message..."
            disabled
            readOnly
            tabIndex={-1}
            aria-disabled="true"
          />
          <button type="button" className="chat__button" disabled aria-disabled="true">
            →
          </button>
        </div>

        <footer className="chat__brand">
          Powered by{' '}
          <span className="chat__brand-link">Atomic AI Bot</span>
        </footer>
      </div>
    </div>
  );
}
