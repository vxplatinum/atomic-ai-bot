import { useState } from 'react';
import WidgetChatPreviewPanel from './WidgetChatPreviewPanel';

const PREVIEW_PAGE_HEIGHT_PX = 560;

function MockPageContent() {
  return (
    <div className="space-y-4 pb-16 text-[11px] leading-snug text-foreground-muted">
      <div>
        <p className="mb-1 text-xs font-semibold tracking-tight text-foreground">Acme Store — Home</p>
        <p className="max-w-[95%]">
          This sample page shows how the assistant sits on a real site. Scroll the page or open the
          widget in the corner — the preview frame size stays the same.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {[
          { title: 'Fast shipping', desc: 'Orders ship within 24 hours on business days.' },
          { title: 'Secure checkout', desc: 'Encrypted payments and buyer protection.' },
          { title: '24/7 support', desc: 'Ask the AI assistant anytime in the corner.' },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-md border border-line/80 bg-foreground/[0.03] p-2.5"
          >
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
              {card.title}
            </p>
            <p className="text-[10px] leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-line/80 bg-foreground/[0.02] p-2.5">
        <p className="mb-1.5 text-[10px] font-semibold text-foreground">Popular categories</p>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px] sm:grid-cols-4">
          {['Electronics', 'Home & garden', 'Books', 'Sports', 'Fashion', 'Toys', 'Beauty', 'Auto'].map(
            (item) => (
              <li key={item} className="flex items-center gap-1.5">
                <span className="h-1 w-1 shrink-0 rounded-full bg-brand/70" aria-hidden />
                {item}
              </li>
            )
          )}
        </ul>
      </div>

      <div className="overflow-hidden rounded-md border border-line/80">
        <table className="w-full border-collapse text-left text-[10px]">
          <thead>
            <tr className="border-b border-line/80 bg-foreground/[0.04]">
              <th className="px-2 py-1.5 font-semibold text-foreground">Plan</th>
              <th className="px-2 py-1.5 font-semibold text-foreground">Price</th>
              <th className="hidden px-2 py-1.5 font-semibold text-foreground sm:table-cell">
                Support
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Starter', '$9 / mo', 'Email'],
              ['Pro', '$29 / mo', 'Chat + email'],
              ['Business', '$79 / mo', 'Priority 24/7'],
            ].map(([plan, price, support]) => (
              <tr key={plan} className="border-b border-line/50 last:border-0">
                <td className="px-2 py-1.5">{plan}</td>
                <td className="px-2 py-1.5">{price}</td>
                <td className="hidden px-2 py-1.5 sm:table-cell">{support}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="max-w-[92%] text-[10px] opacity-90">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
        laboris.
      </p>
    </div>
  );
}

export default function WidgetEmbedPreview({
  bgColor,
  textColor,
  iconText,
  showPreviewLabel = true,
  defaultChatOpen = false,
}) {
  const [chatOpen, setChatOpen] = useState(defaultChatOpen);
  const widgetLabel = iconText ?? '';
  const label = widgetLabel.trim();
  const accent = bgColor || '#3b82f6';
  const accentText = textColor || '#ffffff';

  return (
    <div className="w-full">
      {showPreviewLabel ? (
        <div className="mb-2 font-medium text-foreground-muted">Preview</div>
      ) : null}
      <div className="w-full overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
        <div className="flex items-center gap-2 border-b border-line/70 bg-foreground/[0.04] px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" aria-hidden />
          <span className="ml-2 truncate text-[10px] text-foreground-muted">example.com / page</span>
        </div>

        <div
          className="relative w-full overflow-hidden bg-surface"
          style={{ height: PREVIEW_PAGE_HEIGHT_PX }}
        >
          <div className="h-full overflow-y-auto px-4 py-4">{MockPageContent()}</div>

          {chatOpen ? (
            <WidgetChatPreviewPanel
              accentColor={accent}
              accentTextColor={accentText}
              titleText={widgetLabel}
              onClose={() => setChatOpen(false)}
            />
          ) : null}

          <button
            type="button"
            className="absolute bottom-4 right-4 z-30 flex cursor-pointer items-center justify-center border-none px-[8px] py-[4px] transition-[padding,box-shadow] duration-200 hover:px-[8.5px] hover:py-[4.5px] hover:shadow-[0_8px_22px_rgba(0,0,0,0.2)]"
            style={{
              background: accent,
              color: accentText,
              fontSize: 18,
              borderRadius: 4,
              minWidth: label ? undefined : 28,
              minHeight: 26,
              fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
            }}
            aria-label={chatOpen ? 'Close chat preview' : 'Open chat preview'}
            aria-expanded={chatOpen}
            onClick={() => setChatOpen((open) => !open)}
          >
            {widgetLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
