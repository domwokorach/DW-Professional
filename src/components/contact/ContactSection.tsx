import { LinkIcon } from '@/components/animate-ui/icons/link';
import { IconLink } from '@/components/ui';
import { contactInfo } from '@/data';
import ContactInfoRow from './ContactInfoRow';
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
          <h2>Building thoughtful digital experiences from robust systems to <em>polished interfaces.</em></h2>
          <p className="contact-lede">I create scalable, accessible, and user-focused digital products by combining strong engineering foundations with carefully crafted frontend experiences. From application architecture and data integration to responsive interfaces and interaction details, every part is designed to work seamlessly together.</p>
          <dl className="contact-info">
            {contactInfo.map((item) => (
              <ContactInfoRow key={item.label} label={item.label} icon={item.icon}>
                {item.href ? <a href={item.href}>{item.value}</a> : item.value}
              </ContactInfoRow>
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
