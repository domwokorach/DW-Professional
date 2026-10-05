import Link from 'next/link';
import { legal } from '@/config';
import { CONTACT_EMAIL } from '@/data';
import { MAX_FILE_BYTES, MAX_UPLOAD_BYTES } from '@/lib';
import LegalPage, { ToConfirm } from './LegalPage';

export default function PrivacyView() {
  return (
    <LegalPage eyebrow="Legal" title={<>Privacy <em>notice.</em></>}>
      <p>This notice explains what personal information this portfolio handles and why. The site is run by {legal.owner}, based in {legal.location}.</p>

      <h2>What this site does not do</h2>
      <ul>
        <li>It does not use analytics, advertising or tracking tools.</li>
        <li>It does not set cookies. See the <Link href="/cookies">Cookie</Link> page for the items it stores in your browser (your privacy choice and, if you use the theme button, your light or dark preference).</li>
        <li>It does not keep a record of visitors. Only enquiries you choose to send are saved (see below).</li>
      </ul>

      <h2>When you use the contact form</h2>
      <p>If you send an enquiry, the details you enter are used only to reply to you:</p>
      <ul>
        <li>full name, email address and message (required);</li>
        <li>mobile number and company (optional);</li>
        <li>project type, and one optional file up to {MAX_UPLOAD_BYTES / 1024 / 1024} MB.</li>
      </ul>
      <p>The form is delivered to {legal.owner} as an email through <a href="https://resend.com" target="_blank" rel="noopener noreferrer">Resend</a>, an email delivery service, which processes it to send the message. A copy of your enquiry (the details above, plus the time it was sent and whether the email was delivered) is also saved in this site&apos;s database, a PostgreSQL database hosted by <a href="https://www.prisma.io" target="_blank" rel="noopener noreferrer">Prisma</a>, so enquiries aren&apos;t lost if an email fails.</p>
      <p>If you attach a file, it is either sent with the email (files up to {MAX_FILE_BYTES / 1024 / 1024} MB) or uploaded by your browser to a private Amazon Web Services (S3) storage bucket in London, with only a time-limited download link in the email. The file&apos;s name, type and size are recorded with your enquiry.</p>
      <p>To stop repeated automated submissions, the server briefly keeps your IP address in memory (for up to 10 minutes). It is not written to storage.</p>
      <p>Enquiries, including the saved copy and any attached file, are kept for: <ToConfirm value={legal.enquiryRetention} what="Retention period" />.</p>

      <h2>Hosting</h2>
      <p>Like any website, the hosting provider may record standard server logs (such as IP address, browser type and time of request) to keep the site running and secure. Hosting provider: <ToConfirm value={legal.hostingProvider} what="Hosting provider" />.</p>

      <h2>Images and links</h2>
      <p>Images are stored with Cloudinary but delivered through this site&apos;s own image service, so your browser does not connect to Cloudinary for them. The videos in the Achievements section are streamed directly from Cloudinary, so when they load your browser connects to Cloudinary, which receives your IP address. Links to LinkedIn and GitHub open those sites, which have their own privacy policies.</p>

      <h2>Your rights</h2>
      <p>Under UK data protection law you can ask to access, correct or delete personal information you have sent, or object to how it is used. To make a request, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. You can also complain to the Information Commissioner&apos;s Office (<a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>).</p>
    </LegalPage>
  );
}
