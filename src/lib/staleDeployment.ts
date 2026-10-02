// A tab opened before a new deployment still runs the old JavaScript. When it
// later lazy-loads a chunk, that file no longer exists and the import throws.
// A full reload fetches the current deployment and fixes it, so do that once
// automatically instead of showing an error screen.

const RELOAD_KEY = "stale-deployment-reload-at";
// Don't auto-reload again within this window, so a genuinely broken chunk
// can't trap the visitor in a reload loop.
const RELOAD_COOLDOWN_MS = 30_000;

const CHUNK_ERROR_PATTERN =
  /ChunkLoadError|Loading (CSS )?chunk [\w-]+ failed|Failed to load chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i;

export function isStaleDeploymentError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return CHUNK_ERROR_PATTERN.test(`${error.name} ${error.message}`);
}

/** Reloads the page once per cooldown window. Returns true if it reloaded. */
export function reloadForStaleDeployment(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last < RELOAD_COOLDOWN_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Storage blocked (private mode etc.) — without the loop guard, fall
    // back to the manual Reload button rather than risk reloading forever.
    return false;
  }
  window.location.reload();
  return true;
}
