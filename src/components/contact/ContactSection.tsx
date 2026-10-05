import { LinkIcon } from '@/components/animate-ui/icons/link';
import { IconLink, TechIcon } from '@/components/ui';
import { contactInfo } from '@/data';
import LazyContactForm from './LazyContactForm';

/** Whether attachments go straight to S3 (bigger files) or through the server (fallback). Read on the server. */
const directUploads = () => Boolean(process.env.AWS_S3_BUCKET_NAME && process.env.AWS_REGION);
import ContactGlobe from './ContactGlobe';

export default function ContactSection() {
  return (
    <section id="contact" className="section contact-section">
      <ContactGlobe />
      <div className="section-tag"><span>08</span><i/>CONTACT</div>
      <div className="contact-layout">
        <div className="contact-intro">
          <p className="contact-kicker">LET&apos;S BUILD SOMETHING</p>
          <h2>From the database to the <em>last pixel</em></h2>
          <p className="contact-lede">Available for freelance projects, product development, frontend engineering and full-stack opportunities.</p>
          <dl className="contact-info">
            {contactInfo.map((item) => (
              <div key={item.label} className="contact-info__row">
                <TechIcon icon={item.icon} fallback={item.label} className="contact-info__icon" />
                <dt>{item.label}</dt>
                <dd>{item.href ? <a href={item.href}>{item.value}</a> : item.value}</dd>
              </div>
            ))}
          </dl>
          <IconLink className="contact-link" href="#work" icon={LinkIcon}>View work</IconLink>
          <p className="contact-meta" aria-hidden="true">CONTACT / PORTFOLIO / 2026</p>
        </div>
        <LazyContactForm directUploads={directUploads()} />
      </div>
    </section>
  );
}
