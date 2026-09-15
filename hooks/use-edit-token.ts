import { useSyncExternalStore } from "react";

const KEY = "mac-cs-2030:edit-token";

// The "storage" event only fires in other tabs, so this tab's own writes are announced by hand.
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(listener => listener());

// Storage can be blocked, for example in some private windows. Editing just isn't offered then.
export function readEditToken() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function saveEditToken(token: string) {
  try {
    localStorage.setItem(KEY, token);
  } catch {}
  notify();
}

export function forgetEditToken() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  notify();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The token for the polaroid this browser can edit. Undefined until the page is running in the browser. */
export function useEditToken(): string | null | undefined {
  return useSyncExternalStore(subscribe, readEditToken, () => undefined);
}
