'use client';

import { CameraIcon, FileTextIcon, UploadIcon, XIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatBytes } from '@/lib/contact';
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_ERRORS,
  ATTACHMENT_IMAGE_MAX_SIDE,
  ATTACHMENT_MAX_BYTES,
  attachmentProblem,
  isAttachmentDocument,
  type AttachmentSource,
} from '@/lib/portfolio-access';

export type Attachment = { file: File; source: AttachmentSource };

type Props = {
  value: Attachment | null;
  onChange: (value: Attachment | null) => void;
  error?: string;
  onError: (message?: string) => void;
  disabled?: boolean;
};

/** Phones and tablets: the file input's `capture` opens the native camera app. Desktops get the in-page camera. */
const prefersNativeCamera = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

const CAMERA_ERRORS: Record<string, string> = {
  NotAllowedError: 'Camera access was blocked. Allow the camera for this site in your browser settings, or use Upload instead.',
  SecurityError: 'Camera access was blocked. Allow the camera for this site in your browser settings, or use Upload instead.',
  NotFoundError: 'No camera was found on this device. Use Upload instead.',
  OverconstrainedError: 'No suitable camera was found on this device. Use Upload instead.',
  NotReadableError: 'The camera is in use by another app. Close it and try again, or use Upload instead.',
};
const CAMERA_FAILED = 'The camera couldn’t be started. Please try again, or use Upload instead.';
const CAMERA_UNSUPPORTED = 'This browser can’t open the camera here. Use Upload to choose a photo instead.';

const baseName = (name: string) => (name.replace(/\.[^.]+$/, '') || 'photo').slice(0, 70);

/**
 * Draws any image the browser can decode onto a canvas, scaled down to the size limit, as a JPEG (on white) or a
 * PNG (transparency kept).
 */
async function toImage(source: Blob | HTMLVideoElement, name: string, format: 'jpeg' | 'png' = 'jpeg'): Promise<File> {
  let width: number;
  let height: number;
  let draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  if (source instanceof HTMLVideoElement) {
    width = source.videoWidth;
    height = source.videoHeight;
    draw = (ctx, w, h) => ctx.drawImage(source, 0, 0, w, h);
  } else {
    // imageOrientation: photos taken on phones keep their EXIF rotation.
    const bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' });
    width = bitmap.width;
    height = bitmap.height;
    draw = (ctx, w, h) => {
      ctx.drawImage(bitmap, 0, 0, w, h);
      bitmap.close();
    };
  }
  if (!width || !height) throw new Error('empty image');
  const scale = Math.min(1, ATTACHMENT_IMAGE_MAX_SIDE / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no canvas');
  if (format === 'jpeg') {
    ctx.fillStyle = '#fff'; // transparent areas would otherwise turn black as JPEG
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  draw(ctx, canvas.width, canvas.height);
  const type = format === 'png' ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  if (!blob) throw new Error('encode failed');
  return new File([blob], `${baseName(name)}.${format === 'png' ? 'png' : 'jpg'}`, { type, lastModified: Date.now() });
}

/**
 * Optional attachment for the Portfolio Access form: Upload (an image or a PDF/DOC/DOCX) or Camera (a photo).
 * PNGs are kept as PNG; other images, including camera photos, are converted to a resized JPEG in the browser, so
 * phone photos (often HEIC or several MB) fit the 4 MB limit and always arrive in a format the server accepts. The server re-checks everything.
 */
export default function AttachmentField({ value, onChange, error, onError, disabled }: Props) {
  const uploadInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const uploadButton = useRef<HTMLButtonElement>(null);
  const cameraButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const shootButton = useRef<HTMLButtonElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraState, setCameraState] = useState<'closed' | 'starting' | 'live'>('closed');
  const [announcement, setAnnouncement] = useState('');

  // A local preview URL for images; revoked whenever the file changes or the field unmounts.
  useEffect(() => {
    if (!value || isAttachmentDocument(value.file.name)) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const stopCamera = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
  };
  useEffect(() => stopCamera, []);
  // Once the picture is live, focus moves from Cancel to the main action.
  useEffect(() => {
    if (cameraState === 'live') shootButton.current?.focus();
  }, [cameraState]);

  async function accept(file: File, source: AttachmentSource) {
    onError(undefined);
    setBusy(true);
    try {
      let ready: File;
      if (isAttachmentDocument(file.name)) {
        ready = file;
      } else if (file.type === 'image/png' || /\.png$/i.test(file.name)) {
        // PNGs stay PNG (screenshots, scans); only an oversized one is scaled down.
        try {
          ready = file.size <= ATTACHMENT_MAX_BYTES ? file : await toImage(file, file.name, 'png');
        } catch {
          onError(ATTACHMENT_ERRORS.image);
          return;
        }
      } else if (file.type.startsWith('image/') || /\.(jpe?g|webp|gif|heic|heif|avif|bmp)$/i.test(file.name)) {
        // Photos (and formats the server doesn't store) become a resized JPEG.
        try {
          ready = await toImage(file, file.name);
        } catch {
          onError(ATTACHMENT_ERRORS.image);
          return;
        }
      } else {
        onError(ATTACHMENT_ERRORS.type);
        return;
      }
      const problem = attachmentProblem(ready);
      if (problem) {
        onError(problem);
        return;
      }
      onChange({ file: ready, source });
      setAnnouncement(`${source === 'camera' ? 'Photo' : 'File'} added: ${ready.name}, ${formatBytes(ready.size)}.`);
    } finally {
      setBusy(false);
    }
  }

  const onPicked = (source: AttachmentSource) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // so choosing the same file again still fires change
    if (file) void accept(file, source);
  };

  async function openCamera() {
    if (disabled || busy) return;
    onError(undefined);
    if (prefersNativeCamera()) {
      cameraInput.current?.click();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      onError(CAMERA_UNSUPPORTED);
      return;
    }
    setCameraState('starting');
    dialog.current?.showModal();
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      if (!dialog.current?.open) {
        media.getTracks().forEach((t) => t.stop()); // closed while the permission prompt was up
        return;
      }
      stream.current = media;
      if (video.current) {
        video.current.srcObject = media;
        await video.current.play().catch(() => undefined);
      }
      setCameraState('live');
    } catch (err) {
      closeCamera();
      onError(CAMERA_ERRORS[(err as DOMException).name] ?? CAMERA_FAILED);
    }
  }

  function closeCamera() {
    stopCamera();
    setCameraState('closed');
    if (dialog.current?.open) dialog.current.close();
    cameraButton.current?.focus();
  }

  async function takePhoto() {
    const v = video.current;
    if (!v || cameraState !== 'live') return;
    try {
      const file = await toImage(v, `camera-photo-${new Date().toISOString().slice(0, 10)}`);
      closeCamera();
      await accept(file, 'camera');
    } catch {
      closeCamera();
      onError(CAMERA_FAILED);
    }
  }

  const remove = () => {
    if (!value) return;
    const name = value.file.name;
    onChange(null);
    onError(undefined);
    setAnnouncement(`${name} removed.`);
    requestAnimationFrame(() => uploadButton.current?.focus());
  };

  const describedBy = ['pa-attachment-hint', error ? 'pa-attachment-error' : ''].filter(Boolean).join(' ');

  return (
    <div className="contact-field pa-field pa-attach" role="group" aria-labelledby="pa-attachment-label" aria-describedby={describedBy}>
      <span className="contact-label" id="pa-attachment-label">Attachment<span className="contact-optional"> (optional)</span></span>
      <p className="pa-note pa-attach__hint" id="pa-attachment-hint">
        A PDF, DOC or DOCX document, or a PNG or JPG image (such as a photo of a business card), up to 4 MB.
      </p>

      {!value ? (
        <div className="pa-attach__actions">
          <button
            ref={uploadButton}
            type="button"
            className="pa-import__btn pa-attach__btn"
            onClick={() => uploadInput.current?.click()}
            aria-disabled={disabled || busy || undefined}
            disabled={disabled}
          >
            <UploadIcon aria-hidden="true" />
            {busy ? 'Preparing…' : 'Upload'}
          </button>
          <button
            ref={cameraButton}
            type="button"
            className="pa-import__btn pa-attach__btn"
            onClick={() => void openCamera()}
            aria-disabled={disabled || busy || undefined}
            disabled={disabled}
          >
            <CameraIcon aria-hidden="true" />
            Camera
          </button>
        </div>
      ) : (
        <div className="pa-attach__preview">
          {previewUrl ? (
            /* A local blob: URL: plain <img>, nothing for next/image to optimise. */
            <img className="pa-attach__thumb" src={previewUrl} alt={`Preview of ${value.file.name}`} />
          ) : (
            <span className="pa-attach__doc" aria-hidden="true"><FileTextIcon /></span>
          )}
          <span className="pa-attach__meta">
            <span className="pa-attach__name">{value.file.name}</span>
            <span className="pa-attach__size">{formatBytes(value.file.size)} · {value.source === 'camera' ? 'Camera photo' : 'Uploaded'}</span>
          </span>
          <button type="button" className="pa-attach__remove" onClick={remove} disabled={disabled} aria-label={`Remove ${value.file.name}`}>
            <XIcon aria-hidden="true" />
            <span>Remove</span>
          </button>
        </div>
      )}

      {error && (
        <p className="contact-error pa-error" id="pa-attachment-error" role="alert">
          <span aria-hidden="true">!</span>{error}
        </p>
      )}
      <span className="sr-only" role="status" aria-live="polite">{busy ? 'Preparing your file…' : announcement}</span>

      {/* Hidden native inputs; the visible buttons above open them. */}
      <input ref={uploadInput} type="file" accept={ATTACHMENT_ACCEPT} hidden tabIndex={-1} onChange={onPicked('upload')} />
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden tabIndex={-1} onChange={onPicked('camera')} />

      {/* In-page camera (desktop and laptops). Escape or Cancel closes it and stops the camera. */}
      <dialog
        ref={dialog}
        className="pa-camera"
        aria-labelledby="pa-camera-title"
        onCancel={(e) => { e.preventDefault(); closeCamera(); }}
      >
        <h2 id="pa-camera-title" className="pa-camera__title">Take a photo</h2>
        <div className="pa-camera__frame">
          <video ref={video} className="pa-camera__video" playsInline muted aria-label="Camera preview" />
          {cameraState === 'starting' && <p className="pa-camera__status" role="status">Starting the camera… allow access if your browser asks.</p>}
        </div>
        <div className="pa-camera__actions">
          <button type="button" className="pa-import__btn" onClick={closeCamera}>Cancel</button>
          <button ref={shootButton} type="button" className="pa-btn pa-btn--primary pa-camera__shoot" onClick={() => void takePhoto()} disabled={cameraState !== 'live'}>
            <CameraIcon aria-hidden="true" />
            Take photo
          </button>
        </div>
      </dialog>
    </div>
  );
}
