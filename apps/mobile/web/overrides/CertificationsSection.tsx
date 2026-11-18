// Browser version of components/learning/CertificationsSection (the site's is an async server component).
import { ConfettiOnInteract, TrueFocus } from '@/components/animations';
import CertificationsCarousel from '@/components/learning/CertificationsCarousel';
import { getCertifications } from './certifications';
import { use } from 'react';

const certs = getCertifications();

export function CertificationsSectionSkeleton() {
  return <section className="section certifications" aria-label="Loading certifications"><div className="section-tag"><span>04</span><i/>CERTIFICATIONS</div><div className="cert-loading" aria-hidden="true"><span/><span/><span/></div></section>;
}

export default function CertificationsSection() {
  const { certifications, error } = use(certs);
  const count = certifications.length;
  return (
    <section className="section certifications">
      <div className="section-tag"><span>04</span><i/>CERTIFICATIONS</div>
      <div className="cert-grid">
        <div className="section-heading cert-intro"><ConfettiOnInteract><TrueFocus prefix="Always" emphasis="learning." breakBeforeEmphasis /></ConfettiOnInteract><p>{count ? `${count} certification${count === 1 ? '' : 's'} earned across frontend, backend, databases, software engineering and algorithms.` : 'Professional certifications across frontend, backend, databases, software engineering, and algorithms.'}</p></div>
        <CertificationsCarousel certifications={certifications} error={error} />
      </div>
    </section>
  );
}
