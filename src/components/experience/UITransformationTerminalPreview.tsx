'use client';

import { Terminal, type TerminalLine } from '@/components/ui/terminal';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Illustrative script only. Nothing here is executed, and it is not real Lloyds Banking Group output. */
const SCRIPT: TerminalLine[] = [
  { type: 'command', text: 'initialise ui-transformation' },
  { type: 'blank', text: '' },
  { type: 'output', text: '[INFO] Initialising frontend workspace...' },
  { type: 'output', text: '[OK] HTML components loaded' },
  { type: 'output', text: '[OK] CSS stylesheets loaded' },
  { type: 'output', text: '[OK] Responsive layouts configured' },
  { type: 'output', text: '[OK] Reusable UI components prepared' },
  { type: 'blank', text: '' },
  { type: 'command', text: 'run responsive-check' },
  { type: 'blank', text: '' },
  { type: 'output', text: '[OK] Desktop layout' },
  { type: 'output', text: '[OK] Tablet layout' },
  { type: 'output', text: '[OK] Mobile layout' },
  { type: 'blank', text: '' },
  { type: 'command', text: 'run quality-check' },
  { type: 'blank', text: '' },
  { type: 'output', text: '[OK] Component architecture' },
  { type: 'output', text: '[OK] Performance optimisation' },
  { type: 'output', text: '[OK] User interface consistency' },
  { type: 'blank', text: '' },
  { type: 'output', text: '[COMPLETE] UI transformation preview ready.' },
];

const TYPE_MS = 55;
const OUTPUT_MS = 230;
const BLANK_MS = 420;
const AFTER_COMMAND_MS = 380;
const START_DELAY_MS = 500;

type Status = 'idle' | 'running' | 'paused';
type Position = { line: number; char: number };

const START: Position = { line: 0, char: 0 };

export default function UITransformationTerminalPreview() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [pos, setPos] = useState<Position>(START);
  const [reduced, setReduced] = useState(false);
  const [started, setStarted] = useState(false);

  // Reduced motion: show the complete output at once, no typing or blinking.
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  // Start once, the first time the terminal is on screen (it stays collapsed and empty-height until the accordion opens).
  useEffect(() => {
    const el = rootRef.current;
    if (!el || started) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStarted(true);
        observer.disconnect();
      }
    }, { threshold: 0.25 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started || status !== 'idle') return;
    if (reduced) return;
    const timer = setTimeout(() => setStatus('running'), START_DELAY_MS);
    return () => clearTimeout(timer);
  }, [started, status, reduced]);

  // One timer per step. Pausing clears it; resuming re-runs the effect from the same position, so nothing restarts.
  useEffect(() => {
    if (status !== 'running') return;
    const current = SCRIPT[pos.line];
    if (!current) return;
    let delay: number;
    let next: Position;
    if (current.type === 'command') {
      const typing = pos.char < current.text.length;
      delay = typing ? TYPE_MS + (pos.char % 3) * 12 : AFTER_COMMAND_MS;
      next = typing ? { line: pos.line, char: pos.char + 1 } : { line: pos.line + 1, char: 0 };
    } else {
      delay = current.type === 'blank' ? BLANK_MS : OUTPUT_MS;
      next = { line: pos.line + 1, char: 0 };
    }
    const timer = setTimeout(() => setPos(next), delay);
    return () => clearTimeout(timer);
  }, [status, pos]);

  const replay = useCallback(() => {
    setStarted(true);
    setPos(START);
    setStatus(reduced ? 'idle' : 'running');
  }, [reduced]);

  const togglePause = useCallback(() => setStatus((s) => (s === 'running' ? 'paused' : s === 'paused' ? 'running' : s)), []);

  // Finished is derived, not stored: the script ran out, or reduced motion shows everything at once.
  const finished = pos.line >= SCRIPT.length || (reduced && started && status === 'idle');
  const current = SCRIPT[pos.line];
  const typing = !finished && current?.type === 'command' ? current.text.slice(0, pos.char) : null;
  const printed = finished ? SCRIPT : SCRIPT.slice(0, pos.line);
  const paused = status === 'paused';
  const running = status === 'running' && !finished;

  return (
    <div ref={rootRef} className="xp-preview__terminal">
      <Terminal lines={printed} typing={typing} active={running} title="ui-transformation — illustrative simulation">
        <div className="term__controls">
          <button type="button" className="term__btn" onClick={togglePause} disabled={!running && !paused} aria-label={paused ? 'Resume terminal preview' : 'Pause terminal preview'}>
            {paused ? <Play aria-hidden="true" size={14} /> : <Pause aria-hidden="true" size={14} />}
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button type="button" className="term__btn" onClick={replay} aria-label="Replay terminal preview">
            <RotateCcw aria-hidden="true" size={14} />
            Replay
          </button>
        </div>
      </Terminal>
      <p className="term__note">Illustrative simulation of a frontend workflow. This is not actual Lloyds Banking Group terminal output, and no commands are executed.</p>
      <div className="sr-only">
        <p>Static transcript of the illustrative terminal simulation:</p>
        <ul>
          {SCRIPT.filter((line) => line.type !== 'blank').map((line) => (
            <li key={line.text}>{line.type === 'command' ? `Command: ${line.text}` : line.text}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
