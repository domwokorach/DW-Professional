import { ConfettiOnInteract, TrueFocus } from '@/components/animations';
import { certifications } from '@/data';
import CertificationsCarousel from './CertificationsCarousel';

export default function CertificationsSection() {
  return (
    <section className="section certifications">
      <div className="section-tag"><span>04</span><i/>CERTIFICATIONS</div>
      <div className="cert-grid">
        <div className="section-heading cert-intro"><ConfettiOnInteract><TrueFocus prefix="Always" emphasis="learning." breakBeforeEmphasis /></ConfettiOnInteract><p>14 certifications across frontend, backend, databases, software engineering, and algorithms.</p></div>
        <CertificationsCarousel certifications={certifications} />
      </div>
    </section>
  );
}
