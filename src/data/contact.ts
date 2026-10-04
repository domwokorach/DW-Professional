import type { ContactInfoItem } from '@/types';

export const CONTACT_EMAIL = 'Dominic.Wokorach-O@outlook.com';

export const contactInfo: ContactInfoItem[] = [
  { label: 'Email', value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}`, icon: 'tabler:mail' },
  { label: 'Location', value: 'London, UK', icon: 'tabler:map-pin' },
  { label: 'Work', value: 'Frontend Software Engineering', icon: 'tabler:code' },
];
