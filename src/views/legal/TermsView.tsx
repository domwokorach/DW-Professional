import Link from 'next/link';
import { legal } from '@/config';
import { CONTACT_EMAIL } from '@/data';
import LegalPage from './LegalPage';

export default function TermsView() {
  return (
    <LegalPage eyebrow="Legal" title={<>Terms and <em>conditions.</em></>}>
      <p>These terms apply to your use of this portfolio website, run by {legal.owner}. By using the site you agree to them.</p>

      <h2>Content</h2>
      <p>The text, designs and other content on this site belong to {legal.owner} unless stated otherwise. You may view and share links to it, but please don&apos;t copy or reuse it for commercial purposes without permission. Third-party names and logos shown on the site belong to their owners.</p>

      <h2>Information on this site</h2>
      <p>The site is provided to showcase work and experience. Content is provided “as is”; reasonable care is taken to keep it accurate, but it may change without notice.</p>

      <h2>Contact form</h2>
      <p>Please use the contact form only for genuine enquiries. Don&apos;t send unlawful, harmful or malicious content or files. Submissions are handled as described in the <Link href="/privacy">Privacy</Link> notice.</p>

      <h2>External links</h2>
      <p>Links to other websites, such as LinkedIn and GitHub, are provided for convenience. Those sites are not controlled by {legal.owner}, who isn&apos;t responsible for their content.</p>

      <h2>Changes and contact</h2>
      <p>These terms may be updated from time to time; the date above shows the latest version. Questions: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
    </LegalPage>
  );
}
