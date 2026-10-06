'use client';

import { FileTextIcon } from 'lucide-react';
import { useState } from 'react';
import { formatBytes } from '@/lib/contact';
import { attachmentTypeLabel, isPreviewable } from '@/lib/portfolio-access';
import type { AdminFile } from '@/lib/portfolio-access-store.server';

const WHEN = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London',
});
/** Every file is read through the authenticated admin route; there is no public storage URL. */
const fileUrl = (id: string, inline = false) => `/api/admin/portfolio-access/files/${encodeURIComponent(id)}${inline ? '?inline=1' : ''}`;

/**
 * A session's files, newest first: name, type, size, upload time and source, with Preview (PDF and images, shown in
 * the page), View (full size in a new tab; PDF and images) and Download. Files that came with the latest submission
 * are marked. Word documents can't be previewed in a browser, so
 * they offer Download only.
 */
export default function SessionFiles({ files, candidate, lastSubmittedAt }: { files: AdminFile[]; candidate: string; lastSubmittedAt: string }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section className="adm-files" id="files" aria-labelledby="adm-s-files">
      <h2 id="adm-s-files" className="adm-panel__title">
        Files <span className="adm-muted">({files.length})</span>
      </h2>
      {files.length === 0 ? (
        <p className="adm-empty">{candidate} hasn&apos;t sent any files.</p>
      ) : (
        <ul className="adm-file-list">
          {files.map((f) => {
            const previewable = isPreviewable(f.mimeType);
            const image = f.mimeType.startsWith('image/');
            const showing = open === f.id;
            return (
              <li key={f.id} className="adm-card adm-file">
                <div className="adm-file__row">
                  {image ? (
                    // Served by the authenticated route; lazy, so a long list doesn't load every image at once.
                    <img className="adm-file__thumb" src={fileUrl(f.id, true)} alt="" loading="lazy" />
                  ) : (
                    <span className="adm-file__icon" aria-hidden="true"><FileTextIcon /></span>
                  )}
                  <div className="adm-file__meta">
                    <p className="adm-file__name">
                      {f.filename}
                      {/* Saved with the same timestamp as its submission, so this marks the latest one's file(s). */}
                      {f.createdAt === lastSubmittedAt && <span className="adm-tag adm-tag--ok">Latest submission</span>}
                    </p>
                    <p className="adm-file__info">
                      <span>{attachmentTypeLabel(f.mimeType)}</span>
                      <span>{formatBytes(f.size)}</span>
                      <span>Uploaded <time dateTime={f.createdAt}>{WHEN.format(new Date(f.createdAt))}</time></span>
                      <span>{f.source === 'camera' ? 'Camera photo' : 'Upload'}</span>
                    </p>
                  </div>
                  <div className="adm-file__actions">
                    {previewable && (
                      <button
                        type="button"
                        className="adm-btn adm-btn--ghost adm-btn--sm"
                        aria-expanded={showing}
                        aria-controls={`adm-preview-${f.id}`}
                        onClick={() => setOpen(showing ? null : f.id)}
                      >
                        {showing ? 'Hide preview' : 'Preview'}
                      </button>
                    )}
                    {previewable && (
                      <a className="adm-btn adm-btn--ghost adm-btn--sm" href={fileUrl(f.id, true)} target="_blank" rel="noopener">
                        View<span className="sr-only"> {f.filename} in a new tab</span>
                      </a>
                    )}
                    <a className="adm-btn adm-btn--sm" href={fileUrl(f.id)} download={f.filename}>
                      Download<span className="sr-only"> {f.filename}</span>
                    </a>
                  </div>
                </div>
                {showing && (
                  <div className="adm-file__preview" id={`adm-preview-${f.id}`}>
                    {image ? (
                      <img src={fileUrl(f.id, true)} alt={`${f.filename}, sent by ${candidate}`} />
                    ) : (
                      <iframe src={fileUrl(f.id, true)} title={`Preview of ${f.filename}`} />
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
