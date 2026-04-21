import { useEffect } from "react";

export type KeyMap = Record<string, (e: KeyboardEvent) => void>;

// Global keyboard handler. Listens in the capture phase so it fires before
// any descendant (e.g. Mol*'s canvas keydown handlers) can swallow the
// event. Ignores keypresses while typing in form fields.
export function useKeyboard(map: KeyMap, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      if (t?.isContentEditable) return;

      const handler = map[e.key];
      if (handler) {
        e.preventDefault();
        e.stopPropagation();
        handler(e);
      }
    }

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [map, enabled]);
}
