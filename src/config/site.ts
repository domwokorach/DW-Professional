export const site = {
  title: 'Dominic Olanya — Frontend Software Engineer',
  description: 'Editorial portfolio rebuilt from the supplied video reference.',
};

/** Primary navigation; each label maps to a section id (lower-cased). */
export const navItems = ['About', 'Skills', 'Work', 'Experience', 'Achievements', 'Contact'] as const;
export type NavItem = (typeof navItems)[number];
