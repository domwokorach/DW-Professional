'use client';

import { useRef, useState, type DragEvent } from 'react';
import { DownloadIcon } from '@/components/animate-ui/icons/download';
import { useIconTrigger } from '@/hooks/use-icon-trigger';
import { ACCEPT_ATTR, formatBytes, validateFile } from '@/lib/contact';
import { Progress, ProgressIndicator, ProgressLabel, ProgressTrack, ProgressValue } from '@/components/ui/motion/progress';

export type UploadStatus = 'idle' | 'selected' | 'uploading' | 'success' | 'error';
/** `percent` is the real share of the request body sent (XHR upload events); null when the browser can't measure it. */
export type UploadState = { status: UploadStatus; percent: number | null };
export const UPLOAD_IDLE: UploadState = { status: 'idle', percent: 0 };

// Overdamped spring (critical damping ≈ 22 at this stiffness): the fill eases in without bounce or overshoot.
const PROGRESS_TRANSITION = { type: 'spring', stiffness: 120, damping: 24 } as const;

type Props = {
  id: string;
  /** The chosen file, or the one just sent (kept on screen to show "Upload complete"). */
  file: Pick<File, 'name' | 'size'> | null;
  error?: string;
  upload: UploadState;
  /** Called with the chosen file (or null when removed) and any validation error. */
  onChange: (file: File | null, error?: string) => void;
  /** Largest accepted file, in bytes. */
  maxBytes: number;
};

const ANNOUNCE: Partial<Record<UploadStatus, string>> = {
  uploading: 'Uploading file…',
  success: 'Upload complete.',
  error: 'Upload failed. Please try again.',
};

/**
 * Single-file upload. A real <input type="file"> sits underneath (visually hidden but
 * focusable, so keyboard users reach it with Tab and open it with Enter/Space); the whole
 * drop area forwards clicks to it, and drag-and-drop is a progressive enhancement.
 */
export default function FileUpload({ id, file, error, upload, onChange, maxBytes }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const icon = useIconTrigger();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const { status, percent } = upload;
  const showProgress = file && (status === 'uploading' || status === 'success' || status === 'error');

  const choose = (files: FileList | null) => {
    // The request in flight already carries the current file; swapping it now would desync the progress.
    if (!files || files.length === 0 || status === 'uploading') return;
    if (files.length > 1) return onChange(null, 'Please upload one file at a time.');
    const picked = files[0];
    const problem = validateFile(picked, maxBytes);
    onChange(problem ? null : picked, problem);
  };

  const clear = () => {
    if (inputRef.current) inputRef.current.value = '';
    onChange(null);
    inputRef.current?.focus();
  };

  const onDrag = (e: DragEvent, over: boolean) => {
    e.preventDefault();
    setDragging(over);
  };

  return (
    <div className="contact-field contact-field--full">
      <label className="contact-label" htmlFor={id}>Click to upload</label>
      <div
        className={`contact-upload${dragging ? ' is-dragging' : ''}${error ? ' has-error' : ''}`}
        onClick={() => inputRef.current?.click()}
        {...icon.bind}
        onDragEnter={(e) => onDrag(e, true)}
        onDragOver={(e) => onDrag(e, true)}
        onDragLeave={(e) => onDrag(e, false)}
        onDrop={(e) => {
          onDrag(e, false);
          choose(e.dataTransfer.files);
          if (inputRef.current) inputRef.current.value = '';
        }}
      >
        <input
          ref={inputRef}
          id={id}
          name="file"
          type="file"
          accept={ACCEPT_ATTR}
          className="contact-upload__input"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => choose(e.target.files)}
        />
        <span className="contact-upload__icon" aria-hidden="true"><DownloadIcon animate={icon.active || dragging} size={20} /></span>
        <span className="contact-upload__title" aria-hidden="true">Click to upload</span>
        <span className="contact-upload__sub" aria-hidden="true">or drag and drop a file</span>
        <span className="contact-upload__hint" id={hintId}>PDF, DOC, DOCX, PNG, JPG or WEBP · up to {maxBytes / 1024 / 1024} MB · optional</span>
      </div>

      {file && (
        <div className="contact-upload__file">
          <span className="contact-upload__name">{file.name}</span>
          <span className="contact-upload__size">{formatBytes(file.size)}</span>
          <button type="button" className="contact-upload__remove" onClick={clear} aria-label={`Remove ${file.name}`} disabled={status === 'uploading'}>
            Remove
          </button>
        </div>
      )}
      {showProgress && (
        <Progress
          className={`contact-progress is-${status}`}
          value={status === 'success' ? 100 : status === 'error' ? (percent ?? 0) : percent}
          transition={PROGRESS_TRANSITION}
        >
          <ProgressTrack className="contact-progress__track">
            <ProgressIndicator className="contact-progress__fill" />
          </ProgressTrack>
          <ProgressLabel className="contact-progress__label">
            {status === 'uploading' && (percent === 100 ? 'Processing…' : 'Uploading…')}
            {status === 'success' && <>Upload complete <span aria-hidden="true">✓</span></>}
            {status === 'error' && 'Upload failed. Please try again.'}
          </ProgressLabel>
          {/* aria-valuenow already carries the number, so the visible copy is hidden from assistive tech. */}
          {status === 'uploading' && percent !== null && percent < 100 && <ProgressValue className="contact-progress__value" aria-hidden="true" />}
          {status === 'error' && (
            <button type="submit" className="contact-upload__remove contact-progress__retry">Retry</button>
          )}
        </Progress>
      )}
      {/* Phase changes only — never every percentage step. */}
      <p className="sr-only" aria-live="polite">{file ? ANNOUNCE[status] ?? '' : ''}</p>
      {error && <p className="contact-error" id={errorId}>{error}</p>}
    </div>
  );
}
