"use client";

export type Theme = "dark" | "light";

/**
 * The persisted colour-scheme preference, as an external store.
 *
 * The dashboards used to read localStorage inside a useState initialiser:
 *
 *   useState(() => localStorage.getItem("theme") === "dark" ? "dark" : "light")
 *
 * The server has no localStorage, so it rendered "light" while the first client
 * render produced "dark" whenever the user had chosen dark — a hydration
 * mismatch. Reading it in an effect instead fixes the mismatch but trips React
 * 19's `set-state-in-effect` rule (and causes a cascading render).
 *
 * useSyncExternalStore is the intended API for "a client-only value that can
 * change over time": `getServerSnapshot` returns the constant the server and
 * the hydration pass must agree on, and React swaps in the real value
 * immediately after.
 */

const THEME_EVENT = "freeclouds:theme-change";

function subscribe(onChange: () => void): () => void {
  window.addEventListener(THEME_EVENT, onChange);
  // Keep other tabs in sync.
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): Theme {
  try {
    return localStorage.getItem("theme") === "dark" ? "dark" : "light";
  } catch {
    // localStorage throws in some private-browsing modes.
    return "light";
  }
}

/** The value the server — and therefore the hydration render — must use. */
function getServerSnapshot(): Theme {
  return "light";
}

function setTheme(next: Theme): void {
  try {
    localStorage.setItem("theme", next);
  } catch {
    // Persisting is best-effort; the in-memory value still updates below.
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

export const themeStore = {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  setTheme,
};
