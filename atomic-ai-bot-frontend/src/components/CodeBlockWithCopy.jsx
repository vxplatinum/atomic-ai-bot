import { useEffect, useRef, useState } from 'react';

const copyBtnClass =
  'inline-flex items-center justify-center rounded border border-line bg-surface px-2 py-1 text-[11px] font-medium text-foreground-muted shadow-sm transition-colors hover:border-brand/50 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-background';

export default function CodeBlockWithCopy({ code, label = '', className = '', expandVertically = false }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    []
  );

  function handleCopy() {
    if (!code) return;
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopied(true);
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className={`flex items-center gap-3 ${label ? 'justify-between' : 'justify-end'}`}>
        {label ? (
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{label}</p>
        ) : null}
        <button type="button" className={copyBtnClass} onClick={handleCopy} aria-label="Copy code">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="overflow-hidden rounded-lg border border-line bg-foreground/5">
        <pre
          className={`p-3 text-left text-xs leading-relaxed text-foreground ${
            expandVertically ? 'overflow-x-auto whitespace-pre' : 'max-h-[min(50vh,320px)] overflow-auto'
          }`}
        >
          <code className="block whitespace-pre font-mono">{code}</code>
        </pre>
      </div>
    </div>
  );
}
