// AppFooter is a server component; it is imported directly (app/layout.tsx), so client components that use this
// barrel (ThemeToggle in the admin dashboard) never pull it and its icon set into the browser.
export { default as BackgroundOrbs } from './BackgroundOrbs';
export { default as SiteHeader } from './SiteHeader';
export { default as ThemeToggle } from './ThemeToggle';
