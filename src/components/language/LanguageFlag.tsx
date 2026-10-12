import type { LanguageOption } from '@/lib/i18n/languages';

/** A circular flag (flag-icons' square "fis" artwork), or a neutral globe when no single flag fits the language. */
export default function LanguageFlag({ flag }: { flag: LanguageOption['flag'] }) {
  if (flag) return <span className={`fi fis fi-${flag} lang-flag`} aria-hidden="true" />;
  return (
    <span className="lang-flag lang-flag--globe" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="62%" height="62%" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3Z" />
      </svg>
    </span>
  );
}
