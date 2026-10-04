import { CookiePreferences } from '@/components/privacy';
import { CONSENT_KEY } from '@/lib';
import LegalPage from './LegalPage';

export default function CookieView() {
  return (
    <LegalPage eyebrow="Legal" title={<>Cookie <em>policy.</em></>}>
      <p>This site does not set any cookies, and it does not use analytics, advertising or tracking tools.</p>

      <h2>What is stored in your browser</h2>
      <p>One item is saved in your browser&apos;s local storage to remember your choice in the privacy pop-up, so it isn&apos;t shown on every visit:</p>
      <div className="legal-table" role="table" aria-label="Stored items">
        <div role="row" className="legal-table__head"><span role="columnheader">Name</span><span role="columnheader">Purpose</span><span role="columnheader">Kept until</span></div>
        <div role="row"><span role="cell"><code>{CONSENT_KEY}</code></span><span role="cell">Remembers whether you chose “Accept all” or “Reject all”. Strictly necessary.</span><span role="cell">You change your choice or clear your browser data</span></div>
      </div>

      <h2>Optional cookies</h2>
      <p>If optional cookies (for example, analytics) are ever added, they will only run after you choose “Accept all”, and this page will list them. Choosing “Reject all” keeps them off.</p>

      <h2>Change your choice</h2>
      <p>You can change your decision at any time. This reopens the privacy pop-up.</p>
      <CookiePreferences />
    </LegalPage>
  );
}
