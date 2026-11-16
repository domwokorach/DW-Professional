import { createContext, useContext } from 'react';
import type { SectionId } from './sections';

/** Lets any control inside the page (e.g. the Hero buttons) scroll to a section instead of navigating. */
export const ScrollContext = createContext<(id: SectionId) => void>(() => {});
export const useScrollToSection = () => useContext(ScrollContext);
