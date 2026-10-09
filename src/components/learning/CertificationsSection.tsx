import { ConfettiOnInteract, TrueFocus } from '@/components/animations';
import { getCertifications } from '@/lib/certifications.server';
import CertificationsCarousel from './CertificationsCarousel';

export function CertificationsSectionSkeleton() {
  return <section className="section certifications" aria-label="Loading certifications"><div className="section-tag"><span>04</span><i/>CERTIFICATIONS</div><div className="cert-loading" aria-hidden="true"><span/><span/><span/></div></section>;
}

export default async function CertificationsSection() {
  const { certifications, error } = await getCertifications();
  const count = certifications.length;
  return (
    <section className="section certifications">
      <div className="section-tag"><span>04</span><i/>CERTIFICATIONS</div>
      <div className="cert-grid">
        <div className="section-heading cert-intro"><ConfettiOnInteract><TrueFocus prefix="Always" emphasis="learning." breakBeforeEmphasis /></ConfettiOnInteract><p>{count ? `${count} certification${count === 1 ? '' : 's'} imported securely from AWS S3.` : 'Professional certifications across frontend, backend, databases, software engineering, and algorithms.'}</p></div>
        <CertificationsCarousel certifications={certifications} error={error} />
      </div>
    </section>
  );
}
