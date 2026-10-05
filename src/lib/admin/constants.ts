// Admin auth constants shared by the server code and the middleware (which can't import Node-only modules).

/** `__Host-` pins the cookie to this exact host over HTTPS with path=/ (browsers enforce it). Plain name in local dev over http. */
export const SESSION_COOKIE = process.env.NODE_ENV === 'production' ? '__Host-portfolio_admin' : 'portfolio_admin';
export const CSRF_HEADER = 'x-csrf-token';
export const LOGIN_PATH = '/admin/login';
export const HOME_PATH = '/admin/comments';
