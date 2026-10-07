'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import CommentsCarousel from './CommentsCarousel';
import CompanyField, { type CompanySelection } from '@/components/contact/CompanyField';
import { initials } from './format';
import {
  AVATAR_ACCEPT,
  AVATAR_MAX_BYTES,
  AVATAR_UNREADABLE,
  COMMENT_MAX,
  COMPANY_MAX,
  CONSENT_REQUIRED,
  CONSENT_TEXT,
  EMAIL_MAX,
  NAME_MAX,
  validateAvatar,
  validateComment,
  validateCommentField,
  type CommentErrors,
  type CommentField,
  type CommentFields,
  type CommentFormField,
  type PublicComment,
} from '@/lib/comments';

const EMPTY: CommentFields = { fullName: '', email: '', company: '', comment: '' };
type Status = 'idle' | 'submitting' | 'success' | 'error';


const FIELD_ORDER: CommentFormField[] = ['avatar', 'fullName', 'email', 'company', 'comment', 'consent'];
const FIELD_ID: Record<CommentFormField, string> = {
  avatar: 'cm-avatar', fullName: 'cm-name', email: 'cm-email', company: 'cm-company', comment: 'cm-comment', consent: 'cm-consent',
};

/** Uploads the avatar straight to private storage with a presigned URL and returns its key. */
async function uploadAvatar(file: File): Promise<string> {
  const res = await fetch('/api/comments/avatar-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, size: file.size }),
  });
  const data = (await res.json().catch(() => ({}))) as { key?: string; uploadUrl?: string; contentType?: string; errors?: { avatar?: string } };
  if (!res.ok || !data.key || !data.uploadUrl) throw new Error(data.errors?.avatar ?? 'avatar_upload');
  const put = await fetch(data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': data.contentType ?? file.type }, body: file });
  if (!put.ok) throw new Error('avatar_upload');
  return data.key;
}

/**
 * The candidate side of "What people are saying": the Add Comment form and the feed of approved comments.
 * New comments are saved as pending and only appear here once approved. There are no moderation controls on
 * this side at all; those live behind admin sign-in at /admin/comments. Everything user-written is rendered as
 * plain text by React (never as HTML), and the server cleans and validates it again.
 */
export default function CommentsBoard({ avatarsEnabled }: { avatarsEnabled: boolean }) {
  const [feed, setFeed] = useState<PublicComment[] | null>(null); // null while loading
  const [feedFailed, setFeedFailed] = useState(false);
  const [fields, setFields] = useState<CommentFields>(EMPTY);
  const [companySelection, setCompanySelection] = useState<CompanySelection | null>(null);
  const [consent, setConsent] = useState(false);
  const [avatar, setAvatar] = useState<{ file: File; preview: string } | null>(null);
  const [errors, setErrors] = useState<CommentErrors>({});
  const [touched, setTouched] = useState<Partial<Record<CommentField, boolean>>>({});
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<{ title: string; detail?: string } | null>(null);
  // One id per submission attempt, reused on retry and replaced after success, so a double click or a retry
  // can never create two comments. `busy` blocks a second submit while one is in flight. The uploaded avatar
  // key is reused on retry too, so the image isn't uploaded twice.
  const submissionId = useRef<string | null>(null);
  const uploadedAvatar = useRef<{ file: File; key: string } | null>(null);
  const busy = useRef(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const avatarPick = useRef(0); // guards against two quick selections finishing out of order

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/comments', { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bad status'))))
      .then((data: { comments?: PublicComment[] }) => setFeed(Array.isArray(data.comments) ? data.comments : []))
      .catch((err: Error) => {
        if (err.name === 'AbortError') return;
        setFeed([]);
        setFeedFailed(true);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => () => { if (avatar) URL.revokeObjectURL(avatar.preview); }, [avatar]);

  const clearStatus = () => {
    if (status === 'success' || status === 'error') { setStatus('idle'); setMessage(null); }
  };
  const update = (field: CommentField) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFields((f) => ({ ...f, [field]: value }));
    if (touched[field]) setErrors((er) => ({ ...er, [field]: validateCommentField(field, value) }));
    clearStatus();
  };
  const blur = (field: CommentField) => () => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((er) => ({ ...er, [field]: validateCommentField(field, fields[field]) }));
  };
  const chooseAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    // Type and size first (nothing is uploaded or previewed until they pass), then a real decode in the browser so
    // a corrupt or disguised file is refused here. The server repeats every check on the stored file.
    const problem = validateAvatar(file);
    setErrors((er) => ({ ...er, avatar: problem }));
    if (problem) { input.value = ''; return; }
    const pick = ++avatarPick.current;
    try {
      if (typeof createImageBitmap === 'function') (await createImageBitmap(file)).close();
    } catch {
      if (avatarPick.current === pick) { setErrors((er) => ({ ...er, avatar: AVATAR_UNREADABLE })); input.value = ''; }
      return;
    }
    if (avatarPick.current !== pick) return;
    setAvatar({ file, preview: URL.createObjectURL(file) });
    clearStatus();
  };
  const removeAvatar = () => {
    setAvatar(null);
    setErrors((er) => ({ ...er, avatar: undefined }));
    if (avatarInput.current) avatarInput.current.value = '';
    avatarInput.current?.focus();
  };

  const focusFirst = (found: CommentErrors) => {
    const first = FIELD_ORDER.find((f) => found[f]);
    if (first) document.getElementById(FIELD_ID[first])?.focus();
    return Boolean(first);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy.current) return;
    const found = { ...validateComment(fields, consent), ...(errors.avatar ? { avatar: errors.avatar } : {}) };
    setErrors(found);
    setTouched({ fullName: true, email: true, company: true, comment: true });
    if (focusFirst(found)) { setStatus('idle'); setMessage(null); return; }

    busy.current = true;
    setStatus('submitting');
    setMessage(null);
    submissionId.current ??= crypto.randomUUID();
    try {
      let avatarKey: string | undefined;
      if (avatar) {
        if (uploadedAvatar.current?.file !== avatar.file) {
          try {
            uploadedAvatar.current = { file: avatar.file, key: await uploadAvatar(avatar.file) };
          } catch (err) {
            const detail = (err as Error).message;
            setErrors((er) => ({ ...er, avatar: detail !== 'avatar_upload' ? detail : 'Your photo could not be uploaded. Remove it or try again.' }));
            setStatus('idle');
            document.getElementById(FIELD_ID.avatar)?.focus();
            return;
          }
        }
        avatarKey = uploadedAvatar.current.key;
      }

      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, companyNumber: companySelection?.companyName === fields.company ? companySelection.companyNumber : undefined, consent, avatarKey, submissionId: submissionId.current, website: honeypot }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; errors?: CommentErrors; error?: string };
      if (res.ok && data.ok) {
        setFields(EMPTY);
        setCompanySelection(null);
        setConsent(false);
        setAvatar(null);
        if (avatarInput.current) avatarInput.current.value = '';
        uploadedAvatar.current = null;
        setErrors({});
        setTouched({});
        submissionId.current = null;
        setStatus('success');
        setMessage({ title: 'Thank you! Your comment has been submitted for approval.' });
        return;
      }
      if (res.status === 400 && data.errors) {
        setErrors(data.errors);
        if (data.errors.avatar) uploadedAvatar.current = null;
        setStatus('idle');
        focusFirst(data.errors);
        return;
      }
      setStatus('error');
      setMessage({
        title: 'Your comment could not be sent.',
        detail:
          res.status === 429 ? 'You have sent a few comments recently. Please try again later.'
          : data.error === 'unavailable' ? 'Comments are not available right now. Please try again later.'
          : 'Something went wrong. Please try again.',
      });
    } catch {
      setStatus('error');
      setMessage({ title: 'Your comment could not be sent.', detail: 'Please check your connection and try again.' });
    } finally {
      busy.current = false;
    }
  };

  const submitting = status === 'submitting';
  const items = feed ?? [];
  const count = fields.comment.length;

  const describedBy = (f: CommentFormField, extra?: string) =>
    [errors[f] ? `${FIELD_ID[f]}-error` : '', extra ?? ''].filter(Boolean).join(' ') || undefined;
  const field = (f: CommentField, extra?: string) => ({
    id: FIELD_ID[f],
    name: f,
    value: fields[f],
    onChange: update(f),
    onBlur: blur(f),
    disabled: submitting,
    'aria-invalid': errors[f] ? true : undefined,
    'aria-describedby': describedBy(f, extra),
  });
  const fieldError = (f: CommentFormField) =>
    errors[f] ? <p className="cm-error" id={`${FIELD_ID[f]}-error`}>{errors[f]}</p> : null;
  const required = <><span className="cm-req" aria-hidden="true">*</span><span className="sr-only"> (required)</span></>;

  return (
    <div className="cm-layout">
      <form className="cm-form" onSubmit={onSubmit} noValidate aria-labelledby="cm-form-title" aria-busy={submitting}>
        <h3 id="cm-form-title" className="cm-form__title">Add a comment</h3>

        {avatarsEnabled && (
          <div className="cm-field">
            <span className="cm-label" id="cm-avatar-label">Avatar <span className="cm-opt">(optional)</span></span>
            <div className="cm-avatar-pick">
              <span className="cm-avatar cm-avatar--lg" aria-hidden={avatar ? undefined : true}>
                {avatar ? <img src={avatar.preview} alt="Preview of your selected avatar" /> : initials(fields.fullName)}
              </span>
              <div className="cm-avatar-pick__actions">
                <label className="cm-file" htmlFor="cm-avatar">
                  Upload avatar
                  <input
                    ref={avatarInput}
                    id="cm-avatar"
                    type="file"
                    accept={AVATAR_ACCEPT}
                    onChange={chooseAvatar}
                    disabled={submitting}
                    aria-describedby={describedBy('avatar', 'cm-avatar-hint')}
                    aria-invalid={errors.avatar ? true : undefined}
                  />
                </label>
                {avatar && (
                  <button type="button" className="cm-link" onClick={removeAvatar} disabled={submitting} aria-label="Remove avatar">Remove</button>
                )}
                <span className="cm-hint" id="cm-avatar-hint">Maximum file size: {AVATAR_MAX_BYTES / 1024 / 1024} MB. JPG, PNG or WebP.</span>
              </div>
            </div>
            {fieldError('avatar')}
          </div>
        )}

        <div className="cm-row">
          <div className="cm-field">
            <label htmlFor="cm-name">Full name {required}</label>
            <input {...field('fullName')} type="text" autoComplete="name" maxLength={NAME_MAX} required />
            {fieldError('fullName')}
          </div>
          <div className="cm-field">
            <label htmlFor="cm-email">Email {required}</label>
            <input {...field('email', 'cm-email-hint')} type="email" inputMode="email" autoComplete="email" maxLength={EMAIL_MAX} required />
            <span className="cm-hint" id="cm-email-hint">Never shown publicly.</span>
            {fieldError('email')}
          </div>
        </div>

        <div className="cm-field">
          <label htmlFor="cm-company">Company <span className="cm-opt">(optional)</span></label>
          <CompanyField
            id="cm-company"
            value={fields.company}
            selection={companySelection}
            onTextChange={(value) => {
              setFields((f) => ({ ...f, company: value }));
              if (touched.company) setErrors((er) => ({ ...er, company: validateCommentField('company', value) }));
              clearStatus();
            }}
            onSelectionChange={setCompanySelection}
            onBlur={blur('company')}
            invalid={Boolean(errors.company)}
            describedBy={describedBy('company')}
            maxLength={COMPANY_MAX}
            disabled={submitting}
            variant="comment"
          />
          {fieldError('company')}
        </div>

        <div className="cm-field">
          <div className="cm-field__head">
            <label htmlFor="cm-comment">Comment {required}</label>
            <span className="cm-count" id="cm-comment-count">{count} / {COMMENT_MAX}</span>
          </div>
          <textarea {...field('comment', 'cm-comment-count')} rows={5} maxLength={COMMENT_MAX} required />
          {fieldError('comment')}
        </div>

        <div className="cm-consent">
          <input
            id="cm-consent"
            type="checkbox"
            checked={consent}
            disabled={submitting}
            onChange={(e) => {
              setConsent(e.target.checked);
              setErrors((er) => ({ ...er, consent: e.target.checked ? undefined : er.consent && CONSENT_REQUIRED }));
              clearStatus();
            }}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={describedBy('consent', 'cm-consent-note')}
            required
          />
          <label htmlFor="cm-consent">{CONSENT_TEXT} {required}</label>
          <p className="cm-hint cm-consent__note" id="cm-consent-note">
            To moderate comments, the date and time, your IP address and your device type (for example “Mobile · iOS ·
            Safari”) are recorded with your comment. Your email and these details are never shown publicly.
            See the <a href="/privacy">privacy notice</a>.
          </p>
          {fieldError('consent')}
        </div>

        {/* Honeypot: hidden from people and assistive tech, left empty by real visitors. */}
        <div className="cm-hp" aria-hidden="true">
          <label htmlFor="cm-website">Website</label>
          <input id="cm-website" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </div>

        <button type="submit" className="cm-submit" disabled={submitting}>
          {submitting && <span className="cm-spinner" aria-hidden="true" />}
          {submitting ? 'Submitting…' : 'Submit Comment'}
        </button>

        <div className="cm-status" aria-live="polite">
          {status === 'success' && message && <p className="cm-status__ok"><strong>{message.title}</strong></p>}
        </div>
        <div role="alert">
          {status === 'error' && message && (
            <p className="cm-status__err"><strong>{message.title}</strong> {message.detail}</p>
          )}
        </div>
      </form>

      <div className="cm-feedwrap">
        {feed === null ? (
          <ul className="cm-feed" aria-busy="true" aria-label="Loading comments">
            {[0, 1].map((i) => <li key={`sk${i}`} className="cm-card cm-card--skeleton" aria-hidden="true"><span /><span /><span /></li>)}
          </ul>
        ) : items.length === 0 ? (
          <p className="cm-empty">{feedFailed ? 'Comments could not be loaded right now.' : 'No comments yet. Be the first to leave one.'}</p>
        ) : (
          <CommentsCarousel items={items} />
        )}
      </div>
    </div>
  );
}
