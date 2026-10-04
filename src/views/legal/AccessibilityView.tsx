import Link from 'next/link';
import LegalPage from './LegalPage';
import { HOME } from '@/config';

const FEATURES = [
  {
    title: 'Keyboard navigation',
    text: 'Key interactive elements — navigation, the Developer ID card, the project gallery, the experience timeline, the contact form, the file upload and the privacy pop-up — can be reached and operated with a keyboard (Tab, Shift + Tab, Enter and Space; the project gallery also supports the arrow keys).',
  },
  {
    title: 'Visible focus',
    text: 'Interactive controls show a visible focus outline, so keyboard users can see where they are on the page.',
  },
  {
    title: 'Colour and contrast',
    text: 'Text, controls and important interface elements are designed with readable contrast, and meaning is not communicated by colour alone — for example, form errors are always written out in words beneath the field.',
  },
  {
    title: 'Reduced motion',
    text: 'Where animations are used, the site respects your device’s reduced-motion setting: the heading effects, card drop-in, scrolling logo strip, timeline animations and pop-up movement are switched off or simplified.',
  },
  {
    title: 'Responsive design',
    text: 'Content is designed to stay readable and usable on desktop, tablet and mobile screens, without horizontal scrolling. Form inputs use a 16px text size so phones don’t zoom unexpectedly.',
  },
  {
    title: 'Semantic structure',
    text: 'Pages use headings, landmarks, lists, links, buttons and form elements for their intended purpose, to help with navigation by screen readers and other assistive technologies. Animated headings expose their full text once, and the live London clock is not announced every second.',
  },
  {
    title: 'Forms',
    text: 'Every contact-form field has a visible label, clear validation messages linked to the field they describe, and an accessible focus state. The file upload works by keyboard as well as by drag and drop.',
  },
  {
    title: 'Images',
    text: 'Meaningful images have alternative text. Decorative images and icons are hidden from assistive technologies so they don’t add noise.',
  },
];

export default function AccessibilityView() {
  return (
    <LegalPage eyebrow="Legal" title={<>Accessibility and <em>disability</em></>}>
      <div className="a11y-page">
      <p className="accessibility-intro">
        I aim to make this portfolio accessible and usable for as many people as possible, including people with disabilities. The site is designed with clear navigation, readable content, keyboard accessibility, visible focus states, responsive layouts, appropriate colour contrast, reduced-motion support, and consideration for assistive technologies.
      </p>
      <p>
        People visit with many different needs — visual, hearing, mobility or motor, cognitive or learning, and neurological disabilities, as well as temporary impairments and situational needs such as a bright screen or a single free hand. Two people with the same disability may need different things, so the aim is to keep the site flexible rather than assume one way of using it. The site does not rely on audio to convey information.
      </p>

      <section aria-labelledby="a11y-features">
        <h2 id="a11y-features" className="legal-label">Accessibility features</h2>
        <ul className="legal-features">
          {FEATURES.map((feature) => (
            <li key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </li>
          ))}
        </ul>
        <p className="legal-note">
          The site has not yet been formally audited against the Web Content Accessibility Guidelines (WCAG), so full conformance is not claimed. Accessibility is checked during development and will keep improving.
        </p>
      </section>

      <section aria-labelledby="a11y-feedback">
        <h2 id="a11y-feedback" className="legal-label">Accessibility feedback</h2>
        <p>
          If you experience an accessibility barrier while using this portfolio, please get in touch and describe the problem, the page you were using, and the assistive technology or browser involved if relevant. I will use that information to help investigate and improve the experience.
        </p>
        <Link href={`${HOME}#contact`} className="legal-cta">
          Contact me about an accessibility issue <span aria-hidden="true">→</span>
        </Link>
      </section>
      </div>
    </LegalPage>
  );
}
