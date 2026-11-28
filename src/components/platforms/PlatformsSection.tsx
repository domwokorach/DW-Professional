import { ArrowUpRight, Globe } from 'lucide-react';
import type { ReactNode } from 'react';
import { HOME } from '@/config';

const EXPO_GO_IOS = 'https://apps.apple.com/app/expo-go/id982107779';
const EXPO_GO_ANDROID = 'https://play.google.com/store/apps/details?id=host.exp.exponent';
const WEBSITE = `https://www.dominicwokorach.me${HOME}`;

// Apple and Android marks are not in lucide-react; paths from Simple Icons (24×24).
const brandIcon = (d: string) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor"><path d={d} /></svg>
);

const platforms: { name: string; icon: ReactNode; devices: string; text: string; cta: string; href: string; label: string; external: boolean }[] = [
  {
    name: 'iOS',
    icon: brandIcon('M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04c-2.04.027-3.91 1.183-4.961 3.014c-2.117 3.675-.546 9.103 1.519 12.09c1.013 1.454 2.208 3.09 3.792 3.039c1.52-.065 2.09-.987 3.935-.987c1.831 0 2.35.987 3.96.948c1.637-.026 2.676-1.48 3.676-2.948c1.156-1.688 1.636-3.325 1.662-3.415c-.039-.013-3.182-1.221-3.22-4.857c-.026-3.04 2.48-4.494 2.597-4.559c-1.429-2.09-3.623-2.324-4.39-2.376c-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83c-1.207.052-2.662.805-3.532 1.818c-.78.896-1.454 2.338-1.273 3.714c1.338.104 2.715-.688 3.559-1.701'),
    devices: 'iPhone and iPad',
    text: 'Expo Go for iOS, for running Expo apps on iPhone and iPad.',
    cta: 'Install Expo Go',
    href: EXPO_GO_IOS,
    label: 'Install Expo Go on the Apple App Store (opens in a new tab)',
    external: true,
  },
  {
    name: 'Web',
    icon: <Globe aria-hidden="true" strokeWidth={1.75} />,
    devices: 'Desktop, tablet and mobile',
    text: 'The live portfolio, in any modern browser. No install needed.',
    cta: 'Open Website',
    href: WEBSITE,
    label: 'Open Website: the DW portfolio website',
    external: false,
  },
  {
    name: 'Android',
    icon: brandIcon('M18.44 5.559q-1.015 1.748-2.028 3.498q-.055-.023-.111-.043a12.1 12.1 0 0 0-8.68.033C7.537 8.897 5.868 6.026 5.6 5.56a1 1 0 0 0-.141-.19a1.104 1.104 0 0 0-1.768 1.298c1.947 3.37-.096-.216 1.948 3.36c.017.03-.495.263-1.393 1.017C2.9 12.176.452 14.772 0 18.99h24a11.7 11.7 0 0 0-.746-3.068a12.1 12.1 0 0 0-2.74-4.184a12 12 0 0 0-2.131-1.687c.66-1.122 1.312-2.256 1.965-3.385a1.11 1.11 0 0 0-.008-1.12a1.1 1.1 0 0 0-.852-.532c-.522-.054-.939.313-1.049.545m-.04 8.46c.395.593.324 1.331-.156 1.65c-.48.32-1.188.1-1.582-.493s-.324-1.33.156-1.65c.473-.316 1.182-.11 1.582.494m-11.193-.492c.48.32.55 1.058.156 1.65c-.394.593-1.103.815-1.584.495c-.48-.32-.55-1.058-.156-1.65c.4-.603 1.109-.811 1.584-.495'),
    devices: 'Android phones and tablets',
    text: 'Expo Go for Android, for running Expo apps on phones and tablets.',
    cta: 'Install Expo Go',
    href: EXPO_GO_ANDROID,
    label: 'Install Expo Go on Google Play (opens in a new tab)',
    external: true,
  },
];

export default function PlatformsSection() {
  return (
    <section id="platforms" className="section platforms-section" aria-labelledby="platforms-heading">
      <div className="section-tag"><span>09</span><i/>PLATFORMS</div>
      <div className="section-heading">
        <h2 id="platforms-heading">iOS, Web <em>&amp; Android.</em></h2>
        <p>This portfolio runs in any browser. Expo Go is the official app for previewing Expo projects on your phone or tablet.</p>
      </div>
      <ul className="platform-grid">
        {platforms.map((p) => (
          <li key={p.name} className="platform-card">
            <span className="platform-card__icon">{p.icon}</span>
            <h3>{p.name}</h3>
            <p className="platform-card__devices">{p.devices}</p>
            <p>{p.text}</p>
            <a
              className="platform-card__cta"
              href={p.href}
              aria-label={p.label}
              {...(p.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {p.cta} <ArrowUpRight aria-hidden="true" size={16} />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
