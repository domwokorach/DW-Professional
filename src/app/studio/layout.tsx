import type { Metadata } from 'next';
import { Courier_Prime, Newsreader } from 'next/font/google';
import '@/styles/studio.css';

const serif = Newsreader({ subsets: ['latin'], weight: ['400', '500', '600'], style: ['normal', 'italic'], variable: '--studio-serif', display: 'swap' });
const mono = Courier_Prime({ subsets: ['latin'], weight: ['400', '700'], variable: '--studio-mono', display: 'swap' });

// Placeholder content: keep it out of search results until the real brand and figures are supplied.
export const metadata: Metadata = { title: 'Nibwork (placeholder)', robots: { index: false, follow: false } };

export default function StudioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={`${serif.variable} ${mono.variable}`}>{children}</div>;
}
