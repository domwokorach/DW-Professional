import type { SFSymbol } from 'expo-symbols';
import type { Ionicons } from '@expo/vector-icons';

export type SectionId = 'home' | 'about' | 'experience' | 'projects' | 'contact';
export type SectionDef = { id: SectionId; label: string; sf: SFSymbol; selectedSf: SFSymbol; fallback: React.ComponentProps<typeof Ionicons>['name'] };

/** Page order. Each id is the scroll target for its navigation item. */
export const SECTIONS: SectionDef[] = [
  { id: 'home', label: 'Home', sf: 'house', selectedSf: 'house.fill', fallback: 'home-outline' },
  { id: 'about', label: 'About', sf: 'person', selectedSf: 'person.fill', fallback: 'person-outline' },
  { id: 'experience', label: 'Experience', sf: 'briefcase', selectedSf: 'briefcase.fill', fallback: 'briefcase-outline' },
  { id: 'projects', label: 'Projects', sf: 'square.grid.2x2', selectedSf: 'square.grid.2x2.fill', fallback: 'grid-outline' },
  { id: 'contact', label: 'Contact', sf: 'envelope', selectedSf: 'envelope.fill', fallback: 'mail-outline' },
];
