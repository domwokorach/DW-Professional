'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Code2, Copy, Maximize2, Monitor, RotateCcw, Smartphone, X } from 'lucide-react';
import { useReducedMotionSafe } from '@/hooks/use-reduced-motion-safe';
import { EMAIL_ASSET_BASE } from './email-components';

type Mode = 'desktop' | 'mobile';
export type EmailTemplateOption = { id: string; tab: string; purpose: string; subject: string; html: string };

const subscribeNever = () => () => {};
/** Origin the preview loads the email images from. The server snapshot is the production host, so hydration matches. */
const useOrigin = () => useSyncExternalStore(subscribeNever, () => window.location.origin, () => EMAIL_ASSET_BASE);

type PanelProps = {
  templates: EmailTemplateOption[];
  template: EmailTemplateOption;
  setTemplate: (id: string) => void;
  /** The same email with image URLs pointed at this site, so the preview works before the images are deployed. */
  previewHtml: string;
  mode: Mode;
  setMode: (m: Mode) => void;
  source: boolean;
  setSource: (v: (s: boolean) => boolean) => void;
  copied: boolean;
  onCopy: () => void;
  onReset: () => void;
  resetKey: number;
  reduced: boolean;
  fullscreen: boolean;
  onFullscreen: () => void;
  onClose?: () => void;
};

const MOBILE_WIDTH = 375;

/** Toolbar + email-client frame. Rendered inline and again inside the full-screen dialog, driven by the same state. */
function Panel({ templates, template, setTemplate, previewHtml, mode, setMode, source, setSource, copied, onCopy, onReset, resetKey, reduced, fullscreen, onFullscreen, onClose }: PanelProps) {
  const uid = useId();
  const { html, subject } = template;
  const spring = reduced ? { duration: 0 } : { type: 'spring' as const, stiffness: 260, damping: 30, mass: 0.8 };
  return (
    <div className={`hep${fullscreen ? ' hep--full' : ''}`}>
      <div className="hep__templates">
        <div className="hep__group" role="group" aria-label="Email template">
          {templates.map((t) => (
            <button key={t.id} type="button" className="hep__btn" aria-pressed={t.id === template.id} onClick={() => setTemplate(t.id)}>{t.tab}</button>
          ))}
        </div>
        <p className="hep__purpose">{template.purpose}</p>
      </div>
      <div className="hep__bar" role="toolbar" aria-label="Email preview controls">
        <div className="hep__group" role="group" aria-label="Preview size">
          <button type="button" className="hep__btn" aria-pressed={mode === 'desktop'} onClick={() => setMode('desktop')}><Monitor aria-hidden="true" size={15} />Desktop</button>
          <button type="button" className="hep__btn" aria-pressed={mode === 'mobile'} onClick={() => setMode('mobile')}><Smartphone aria-hidden="true" size={15} />Mobile</button>
        </div>
        <div className="hep__group">
          <button type="button" className="hep__btn" aria-pressed={source} aria-controls={`${uid}-stage`} onClick={() => setSource((s) => !s)}><Code2 aria-hidden="true" size={15} />{source ? 'View email' : 'View HTML'}</button>
          <button type="button" className="hep__btn" onClick={onCopy}>{copied ? <Check aria-hidden="true" size={15} /> : <Copy aria-hidden="true" size={15} />}{copied ? 'Copied' : 'Copy HTML'}</button>
          <button type="button" className="hep__btn" onClick={onReset}><RotateCcw aria-hidden="true" size={15} />Reset</button>
          {fullscreen ? (
            <button type="button" className="hep__btn" onClick={onClose}><X aria-hidden="true" size={15} />Close</button>
          ) : (
            <button type="button" className="hep__btn" aria-haspopup="dialog" onClick={onFullscreen}><Maximize2 aria-hidden="true" size={15} />Full screen</button>
          )}
        </div>
      </div>

      <div className="hep__client">
        <div className="hep__chrome" aria-hidden="true">
          <span className="hep__dots"><i /><i /><i /></span>
          <dl className="hep__meta">
            <div><dt>From</dt><dd>Internal Communications (illustrative)</dd></div>
            <div><dt>Subject</dt><dd>{subject}</dd></div>
          </dl>
        </div>
        <div id={`${uid}-stage`} className="hep__stage">
          <AnimatePresence mode="wait" initial={false}>
            {source ? (
              <motion.pre key="source" className="hep__source" tabIndex={0} aria-label={`HTML source of the ${template.tab} email`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.18 }}>
                <code>{html}</code>
              </motion.pre>
            ) : (
              <motion.div key="view" className="hep__viewport" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.18 }}>
                <motion.div
                  className="hep__device"
                  data-mode={mode}
                  initial={false}
                  animate={{ width: mode === 'mobile' ? MOBILE_WIDTH : '100%' }}
                  transition={spring}
                >
                  {/* Empty sandbox: no scripts, forms, popups or same-origin access, so the email cannot run code or reach the portfolio. */}
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div key={`${template.id}-${resetKey}`} className="hep__swap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.16 }}>
                      <iframe
                        className="hep__frame"
                        title={`${template.tab} email, ${mode} layout: ${subject}`}
                        srcDoc={previewHtml}
                        sandbox=""
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/** Interactive preview of standalone HTML emails: template selector, desktop/mobile switch, source view, copy, full screen and reset. Sends nothing. */
export default function HTMLEmailPreview({ templates }: { templates: EmailTemplateOption[] }) {
  const reduced = useReducedMotionSafe();
  const origin = useOrigin();
  const [templateId, setTemplateId] = useState(templates[0].id);
  const [mode, setMode] = useState<Mode>('desktop');
  const [source, setSource] = useState(false);
  const [copied, setCopied] = useState(false);
  const [full, setFull] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const timer = useRef<number | undefined>(undefined);

  const template = templates.find((t) => t.id === templateId) ?? templates[0];
  const html = template.html;
  const previewHtml = useMemo(() => html.split(EMAIL_ASSET_BASE).join(origin), [html, origin]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Native <dialog>: modal focus trap, Escape to close, background inert and focus return come with it.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (full && !d.open) d.showModal();
    if (!full && d.open) d.close();
  }, [full]);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(html);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = html;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  }, [html]);

  const selectTemplate = useCallback((id: string) => {
    setTemplateId(id);
    setCopied(false);
  }, []);

  const onReset = useCallback(() => {
    setTemplateId(templates[0].id);
    setMode('desktop');
    setSource(false);
    setCopied(false);
    setResetKey((k) => k + 1);
  }, [templates]);

  const shared = { templates, template, setTemplate: selectTemplate, previewHtml, mode, setMode, source, setSource, copied, onCopy, onReset, resetKey, reduced };
  return (
    <div className="hep-root">
      <Panel {...shared} fullscreen={false} onFullscreen={() => setFull(true)} />
      <p className="hep__note">Independent portfolio demonstration. Not an official Lloyds Banking Group communication. No email is sent and nothing connects to any internal system.</p>
      <p className="sr-only" role="status" aria-live="polite">{copied ? `${template.tab} email HTML copied to clipboard.` : ''}</p>
      <dialog ref={dialogRef} className="hep-dialog" aria-label="Full-screen email preview" onClose={() => setFull(false)}>
        {full && <Panel {...shared} fullscreen onFullscreen={() => {}} onClose={() => setFull(false)} />}
      </dialog>
    </div>
  );
}
