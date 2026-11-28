'use client';

import { forwardRef, useEffect, useRef, type ReactNode } from 'react';
import '@/styles/terminal.css';

/*
 * Presentational terminal window ported from the Aceternity UI Terminal (https://ui.aceternity.com/components/terminal).
 * The registry source relies on Tailwind, which this project does not use, so the window chrome, prompt and
 * syntax colouring are hand-ported to scoped CSS (src/styles/terminal.css). Typing is driven by the caller;
 * the registry's audio playback and network fetch are intentionally dropped.
 */

export type TerminalLine = { type: 'command' | 'output' | 'blank'; text: string };

type TokenType = 'command' | 'flag' | 'string' | 'number' | 'path' | 'default';

function tokenizeCommand(text: string): { type: TokenType; value: string }[] {
  let first = true;
  return text.split(/(\s+)/).map((value) => {
    if (/^\s*$/.test(value)) return { type: 'default', value };
    let type: TokenType = 'default';
    if (first) type = 'command';
    else if (value.startsWith('-')) type = 'flag';
    else if (/^["'].*["']$/.test(value)) type = 'string';
    else if (/^\d+$/.test(value)) type = 'number';
    else if (value.includes('/') || value.startsWith('.')) type = 'path';
    else type = 'string';
    first = false;
    return { type, value };
  });
}

function Command({ text }: { text: string }) {
  return (
    <>
      <span className="term__prompt">$ </span>
      {tokenizeCommand(text).map((token, i) => (
        <span key={i} className={`term__tok term__tok--${token.type}`}>{token.value}</span>
      ))}
    </>
  );
}

const TAG = /^(\[[A-Z]+\])(.*)$/;

function Output({ text }: { text: string }) {
  const match = TAG.exec(text);
  if (!match) return <>{text}</>;
  const tone = match[1] === '[OK]' || match[1] === '[COMPLETE]' ? 'ok' : 'info';
  return (
    <>
      <span className={`term__tag term__tag--${tone}`}>{match[1]}</span>
      <span className={`term__msg term__msg--${tone}`}>{match[2]}</span>
    </>
  );
}

export type TerminalProps = {
  /** Lines already printed. */
  lines: TerminalLine[];
  /** Partially typed command shown after the printed lines, or null when nothing is being typed. */
  typing: string | null;
  /** Whether the cursor blinks (animation running) or stays steady. */
  active: boolean;
  title: string;
  className?: string;
  children?: ReactNode;
};

/** The window is decorative (aria-hidden); callers provide a static text alternative for assistive technology. */
export const Terminal = forwardRef<HTMLDivElement, TerminalProps>(function Terminal({ lines, typing, active, title, className, children }, ref) {
  const bodyRef = useRef<HTMLDivElement>(null);

  // Scroll only the terminal body, never the page.
  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [lines.length, typing]);

  return (
    <div ref={ref} className={`term${className ? ` ${className}` : ''}`}>
      <div className="term__window" aria-hidden="true">
        <div className="term__bar">
          <span className="term__dots"><i /><i /><i /></span>
          <span className="term__title">{title}</span>
        </div>
        <div ref={bodyRef} className="term__body">
          {lines.map((line, i) => (
            <div key={i} className={`term__line term__line--${line.type}`}>
              {line.type === 'command' ? <Command text={line.text} /> : line.type === 'output' ? <Output text={line.text} /> : ' '}
            </div>
          ))}
          <div className="term__line">
            {typing !== null ? <Command text={typing} /> : <span className="term__prompt">$ </span>}
            <span className={`term__cursor${active ? ' is-blinking' : ''}`} />
          </div>
        </div>
      </div>
      {children}
    </div>
  );
});
