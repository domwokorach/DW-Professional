import { TrueFocus } from '@/components/animations';
import { certifications } from '@/data';

export default function CertificationsSection() {
  return (
    <section className="section certifications">
      <div className="section-tag"><span>04</span><i/>CERTIFICATIONS</div>
      <div className="cert-grid">
        <div className="section-heading cert-intro"><TrueFocus prefix="Always" emphasis="learning." breakBeforeEmphasis /><p>{certifications.length} certifications across frontend, backend, databases and algorithms.</p></div>
        <div className="cert-list">{certifications.map(({ number, name, issuer }, i) => <article key={number} className={i===6?'highlight':''}><span>{number}</span><div><h3>{name}</h3><p>{issuer}</p></div></article>)}</div>
      </div>
    </section>
  );
}
