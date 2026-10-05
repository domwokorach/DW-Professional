/** localStorage key for the visitor's explicit theme choice. Written only when they press the toggle. */
export const THEME_KEY = 'portfolio-theme';
export type Theme = 'light' | 'dark';

/**
 * Runs in <head> before the first paint, so the page never flashes the wrong theme. Uses the saved
 * choice if there is one, otherwise the system setting; light if neither can be read.
 * Plain ES5 on purpose: it is inlined into the HTML and must never throw.
 */
export const THEME_INIT_SCRIPT = `(function(){var t='light';try{var s=localStorage.getItem('${THEME_KEY}');if(s==='dark'||s==='light'){t=s}else if(matchMedia('(prefers-color-scheme: dark)').matches){t='dark'}}catch(e){try{if(matchMedia('(prefers-color-scheme: dark)').matches)t='dark'}catch(e2){}}document.documentElement.setAttribute('data-theme',t)})();`;
