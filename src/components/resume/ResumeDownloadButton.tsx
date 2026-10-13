'use client';

import { useState } from 'react';

const FALLBACK = 'The résumé could not be downloaded. Please try again, or use Open Resume.';

/** Downloads Dominic_Wokorach_Resume.pdf via /api/resume/download, saving only a real PDF and showing an error otherwise. */
export default function ResumeDownloadButton({ className, onDownload }: { className?: string; onDownload?: () => void }) {
  const [state, setState] = useState<'idle' | 'busy' | 'error'>('idle');

  async function download() {
    onDownload?.();
    setState('busy');
    try {
      const res = await fetch('/api/resume/download', { cache: 'no-store' });
      const blob = await res.blob();
      if (!res.ok || !(res.headers.get('content-type') ?? '').includes('application/pdf') || blob.size === 0) throw new Error('not a pdf');
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: 'Dominic_Wokorach_Resume.pdf' });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setState('idle');
    } catch {
      setState('error');
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={download} disabled={state === 'busy'} aria-busy={state === 'busy'}>
        {state === 'busy' ? 'Downloading…' : 'Download Resume'}
      </button>
      {state === 'error' && <p role="alert" className="pa-meta">{FALLBACK}</p>}
    </>
  );
}
