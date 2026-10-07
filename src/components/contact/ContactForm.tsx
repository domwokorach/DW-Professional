'use client';

import { useRef, useState, type ChangeEvent, type FormEvent, type InputHTMLAttributes } from 'react';
import { SendHorizontalIcon } from '@/components/animate-ui/icons/send-horizontal';
import SpinnerButton3 from '@/components/ui/spinner-button-3';
import { useIconTrigger } from '@/hooks/use-icon-trigger';
import {
  MAX_FILE_BYTES,
  MAX_UPLOAD_BYTES,
  fileTooLarge,
  MESSAGE_MAX,
  PROJECT_TYPES,
  validateField,
  validateFields,
  validateFile,
  type ContactErrors,
  type ContactField,
  type ContactFields,
} from '@/lib/contact';
import { MotionConfig, useReducedMotion } from 'motion/react';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxPrimitive,
  ComboboxTrigger,
  ComboboxValue,
} from '@/components/ui/motion/combobox';
import CompanyField, { type CompanySelection } from './CompanyField';
import FileUpload, { UPLOAD_IDLE, type UploadState } from './FileUpload';

type Status = 'idle' | 'submitting' | 'error';

const EMPTY: ContactFields = { fullName: '', email: '', mobileNumber: '', company: '', projectType: '', message: '' };
const ORDER: ContactField[] = ['fullName', 'email', 'mobileNumber', 'company', 'projectType', 'file', 'message'];
const id = (field: ContactField) => `contact-${field}`;

/** POSTs the form with XHR rather than fetch, because only XHR reports real upload progress. */
function postForm(url: string, body: FormData, onProgress?: (percent: number | null) => void) {
  return new Promise<{ ok: boolean; status: number; body: any }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.responseType = 'json'; // unparseable bodies come back as null
    if (onProgress) {
      xhr.upload.onprogress = (e) => onProgress(e.lengthComputable ? Math.round((e.loaded / e.total) * 100) : null);
    }
    xhr.onload = () => resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, body: xhr.response });
    xhr.onerror = xhr.onabort = xhr.ontimeout = () => reject(new Error('Network request failed'));
    xhr.send(body);
  });
}

/** PUTs a file to a presigned S3 URL with XHR (for upload progress). Content-Type must match the signature. */
function putFile(url: string, file: File, contentType: string, onProgress: (percent: number | null) => void) {
  return new Promise<boolean>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (e) => onProgress(e.lengthComputable ? Math.round((e.loaded / e.total) * 100) : null);
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = xhr.onabort = xhr.ontimeout = () => resolve(false);
    xhr.send(file);
  });
}

/**
 * Uploads the attachment straight to S3 and returns its key, or 'fallback' when S3 isn't
 * available (the file is then sent with the form instead), or an error message for the file field.
 */
async function uploadToS3(file: File, onProgress: (percent: number | null) => void): Promise<{ key: string } | 'fallback' | { error: string }> {
  let res: Response;
  try {
    res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, size: file.size }),
    });
  } catch {
    return { error: 'Upload failed. Please check your connection and try again.' };
  }
  if (res.status === 503) return 'fallback';
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.uploadUrl) return { error: body?.errors?.file ?? 'Upload failed. Please try again.' };
  const ok = await putFile(body.uploadUrl, file, body.contentType, onProgress);
  return ok ? { key: body.key } : { error: 'Upload failed. Please try again.' };
}

const BUTTON_LABEL: Record<Status, string> = {
  idle: 'Send message',
  submitting: 'Send message',
  error: 'Try again',
};

const MINIMUM_LOADING_MS = 5000;
const waitForMinimumLoading = (startedAt: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, Math.max(0, MINIMUM_LOADING_MS - (Date.now() - startedAt))));

export default function ContactForm({ directUploads }: { directUploads: boolean }) {
  const maxFileBytes = directUploads ? MAX_UPLOAD_BYTES : MAX_FILE_BYTES;
  // Identifies this submission to the server; kept across retries (so a retry can't create a
  // duplicate enquiry or email) and replaced after a successful send.
  const submissionId = useRef<string | null>(null);
  const submittingRef = useRef(false);
  const [fields, setFields] = useState<ContactFields>(EMPTY);
  // A UK company picked from the Company field's suggestions (optional; a typed name needs none).
  const [company, setCompany] = useState<CompanySelection | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [upload, setUpload] = useState<UploadState>(UPLOAD_IDLE);
  // After a successful send the form clears `file`; this keeps its name/size on screen beside "Upload complete".
  const [sentFile, setSentFile] = useState<{ name: string; size: number } | null>(null);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [touched, setTouched] = useState<Partial<Record<ContactField, boolean>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [successOpen, setSuccessOpen] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const sendIcon = useIconTrigger();
  const formRef = useRef<HTMLFormElement>(null);
  // Latest Project Type value, so validation on popup close sees a just-made selection.
  const projectTypeRef = useRef('');
  const reduceMotion = useReducedMotion();

  const setError = (field: ContactField, message?: string) =>
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });

  const update = (field: keyof ContactFields, value: string) => {
    if (field === 'projectType') projectTypeRef.current = value;
    setFields((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (status === 'error') setStatus('idle');
    if (upload.status === 'success') {
      setUpload(UPLOAD_IDLE);
      setSentFile(null);
    }
    // Once a field shows an error, re-check it as the visitor fixes it.
    if (errors[field]) setError(field, validateField(field, value));
  };

  const onChange = (field: keyof ContactFields) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(field, e.target.value);

  const onBlur = (field: keyof ContactFields) => () => {
    if (touched[field]) setError(field, validateField(field, fields[field]));
  };

  const describedBy = (field: ContactField, extra?: string) =>
    [extra, errors[field] ? `${id(field)}-error` : undefined].filter(Boolean).join(' ') || undefined;

  const errorText = (field: ContactField) =>
    errors[field] ? <p className="contact-error" id={`${id(field)}-error`}>{errors[field]}</p> : null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;

    const found: ContactErrors = validateFields(fields);
    if (file) {
      const fileError = validateFile(file, maxFileBytes);
      if (fileError) found.file = fileError;
    } else if (errors.file) {
      found.file = errors.file;
    }
    setErrors(found);
    const firstInvalid = ORDER.find((f) => found[f]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`#${id(firstInvalid)}`)?.focus();
      return;
    }

    const data = new FormData();
    (Object.keys(fields) as (keyof ContactFields)[]).forEach((key) => data.append(key, fields[key].trim()));
    if (company && company.companyName === fields.company) data.append('companyNumber', company.companyNumber);
    data.append('website', honeypot);
    submissionId.current ??= crypto.randomUUID();
    data.append('submissionId', submissionId.current);

    const startedAt = Date.now();
    submittingRef.current = true;
    setStatus('submitting');
    setSuccessOpen(false);
    setSentFile(null);
    setUpload(file ? { status: 'uploading', percent: 0 } : UPLOAD_IDLE);

    // With S3, the file goes straight to the bucket first and the form only carries its key.
    let attachFile = Boolean(file);
    if (file && directUploads) {
      const result = await uploadToS3(file, (percent) => setUpload({ status: 'uploading', percent }));
      if (result === 'fallback') {
        if (file.size > MAX_FILE_BYTES) {
          await waitForMinimumLoading(startedAt);
          submittingRef.current = false;
          setStatus('idle');
          setUpload({ status: 'selected', percent: 0 });
          setErrors((prev) => ({ ...prev, file: fileTooLarge(MAX_FILE_BYTES) }));
          formRef.current?.querySelector<HTMLElement>(`#${id('file')}`)?.focus();
          return;
        }
      } else if ('error' in result) {
        await waitForMinimumLoading(startedAt);
        submittingRef.current = false;
        setStatus('error');
        setUpload((prev) => ({ status: 'error', percent: prev.percent }));
        setErrors((prev) => ({ ...prev, file: result.error }));
        return;
      } else {
        attachFile = false;
        data.append('fileKey', result.key);
        data.append('fileName', file.name);
      }
    }
    if (file && attachFile) data.append('file', file);

    try {
      const res = await postForm('/api/contact', data, file && attachFile ? (percent) => setUpload({ status: 'uploading', percent }) : undefined);
      if (res.ok) {
        await waitForMinimumLoading(startedAt);
        submittingRef.current = false;
        submissionId.current = null;
        setStatus('idle');
        setSuccessOpen(true);
        setFields(EMPTY);
        setCompany(null);
        projectTypeRef.current = '';
        if (file) {
          setSentFile({ name: file.name, size: file.size });
          setUpload({ status: 'success', percent: 100 });
        }
        setFile(null);
        setTouched({});
        setErrors({});
        return;
      }
      const body = res.body;
      if (body?.errors) {
        await waitForMinimumLoading(startedAt);
        submittingRef.current = false;
        setErrors(body.errors as ContactErrors);
        setStatus('idle');
        // Validation (including a server-side file rejection) is shown by the field errors, not as an upload failure.
        setUpload(file ? { status: 'selected', percent: 0 } : UPLOAD_IDLE);
        const first = ORDER.find((f) => body.errors[f]);
        if (first) formRef.current?.querySelector<HTMLElement>(`#${id(first)}`)?.focus();
        return;
      }
      if (process.env.NODE_ENV !== 'production') console.warn('[contact] Request failed with status', res.status, body);
      await waitForMinimumLoading(startedAt);
      submittingRef.current = false;
      setStatus('error');
      if (file) setUpload((prev) => ({ status: 'error', percent: prev.percent }));
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.warn('[contact] Request failed', err);
      await waitForMinimumLoading(startedAt);
      submittingRef.current = false;
      setStatus('error');
      if (file) setUpload((prev) => ({ status: 'error', percent: prev.percent }));
    }
  }

  const input = (field: 'fullName' | 'email' | 'mobileNumber', label: string, props: InputHTMLAttributes<HTMLInputElement>) => (
    <div className="contact-field">
      <label className="contact-label" htmlFor={id(field)}>{label}{props.required ? null : <span className="contact-optional"> (optional)</span>}</label>
      <input
        id={id(field)}
        name={field}
        className="contact-control"
        value={fields[field]}
        onChange={onChange(field)}
        onBlur={onBlur(field)}
        aria-invalid={errors[field] ? true : undefined}
        aria-describedby={describedBy(field)}
        {...props}
      />
      {errorText(field)}
    </div>
  );

  return (
    <form ref={formRef} className="contact-form" onSubmit={onSubmit} noValidate aria-label="Project enquiry">
      <div className="contact-grid">
        {input('fullName', 'Full Name', { type: 'text', autoComplete: 'name', required: true, maxLength: 100 })}
        {input('email', 'Email', { type: 'email', autoComplete: 'email', inputMode: 'email', required: true, maxLength: 254 })}
        {input('mobileNumber', 'Mobile Number', { type: 'tel', autoComplete: 'tel', inputMode: 'tel', maxLength: 24 })}
        <div className="contact-field">
          <label className="contact-label" htmlFor={id('company')}>Company<span className="contact-optional"> (optional)</span></label>
          <CompanyField
            id={id('company')}
            value={fields.company}
            selection={company}
            onTextChange={(text) => update('company', text)}
            onSelectionChange={setCompany}
            onBlur={onBlur('company')}
            invalid={Boolean(errors.company)}
            describedBy={describedBy('company')}
            maxLength={120}
          />
          {errorText('company')}
        </div>

        <div className="contact-field contact-field--full">
          {/* Pace UI Motion Combobox (input-inside-popup pattern): the trigger is the form control. */}
          {/* reducedMotion="user": motion skips transform/layout animation (highlight glide, press scale) when requested. */}
          <MotionConfig reducedMotion="user">
          <Combobox
            items={PROJECT_TYPES as unknown as string[]}
            value={fields.projectType || null}
            onValueChange={(value) => update('projectType', (value as string | null) ?? '')}
            onOpenChange={(open) => {
              if (open) setTouched((prev) => ({ ...prev, projectType: true }));
              else setError('projectType', validateField('projectType', projectTypeRef.current));
            }}
          >
            <ComboboxPrimitive.Label className="contact-label">Project Type</ComboboxPrimitive.Label>
            <ComboboxTrigger
              id={id('projectType')}
              className="contact-control project-type-trigger"
              data-filled={fields.projectType ? '' : undefined}
              aria-invalid={errors.projectType ? true : undefined}
              aria-describedby={describedBy('projectType')}
            >
              <ComboboxValue placeholder="Select project type" />
            </ComboboxTrigger>
            <ComboboxContent
              className="project-type-popup"
              aria-label="Project type options"
              transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <ComboboxPrimitive.Input className="project-type-search" placeholder="Search project type..." />
              <ComboboxEmpty>No matching project types.</ComboboxEmpty>
              <ComboboxList>
                {(item: string) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          </MotionConfig>
          {errorText('projectType')}
        </div>

        <FileUpload
          id={id('file')}
          maxBytes={maxFileBytes}
          file={file ?? (upload.status === 'success' ? sentFile : null)}
          error={errors.file}
          upload={upload}
          onChange={(next, error) => {
            setFile(next);
            setError('file', error);
            setSentFile(null);
            setUpload(next ? { status: 'selected', percent: 0 } : UPLOAD_IDLE);
            if (status === 'error') setStatus('idle');
          }}
        />

        <div className="contact-field contact-field--full">
          <div className="contact-label-row">
            <label className="contact-label" htmlFor={id('message')}>Message</label>
            <span className="contact-count" id={`${id('message')}-count`}>{fields.message.length} / {MESSAGE_MAX}</span>
          </div>
          <textarea
            id={id('message')}
            name="message"
            className="contact-control contact-textarea"
            rows={7}
            maxLength={MESSAGE_MAX}
            value={fields.message}
            onChange={onChange('message')}
            onBlur={onBlur('message')}
            required
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={describedBy('message', `${id('message')}-count`)}
          />
          {errorText('message')}
        </div>
      </div>

      {/* Honeypot: hidden from people and assistive tech, left empty by real visitors. */}
      <div className="contact-hp" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </div>

      <div className="contact-footer">
        <div className="contact-status" aria-live="polite">
          {status === 'error' && (
            <p className="contact-status__err"><strong>Unable to send your message right now.</strong> Please try again.</p>
          )}
        </div>
        <SpinnerButton3 type="submit" className={`contact-submit is-${status}`} loading={status === 'submitting'} disabled={status === 'submitting'} loadingLabel="Sending..." {...sendIcon.bind}>
          {BUTTON_LABEL[status]}
          <SendHorizontalIcon className="contact-submit__arrow" animate={sendIcon.active} size={18} aria-hidden="true" />
        </SpinnerButton3>
      </div>

      {successOpen && (
        <aside className="contact-success-alert" aria-label="Message sent">
          <span className="contact-success-alert__icon" aria-hidden="true">✓</span>
          <div role="status" aria-live="polite" aria-atomic="true">
            <strong>Thank you!</strong>
            <p>Dominic will reply to your email within 3–5 working days.</p>
          </div>
          <button type="button" className="contact-success-alert__close" onClick={() => setSuccessOpen(false)} aria-label="Dismiss success message">×</button>
        </aside>
      )}
    </form>
  );
}
