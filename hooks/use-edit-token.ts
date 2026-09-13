import { useSyncExternalStore } from "react";

const KEY = "mac-cs-2030:edit-token";

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
}

export function forgetEditToken() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/** The token for the polaroid this browser added. Undefined until the page is running in the browser. */
export function useEditToken(): string | null | undefined {
  return useSyncExternalStore(subscribe, readEditToken, () => undefined);
}
