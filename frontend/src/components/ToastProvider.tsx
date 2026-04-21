import { createContext, useCallback, useContext, useState } from "react";
import type { PropsWithChildren } from "react";

interface Toast {
  id: number;
  text: string;
  severity: "info" | "good" | "warn";
  ttl: number;
}

interface ToastCtx {
  show: (text: string, severity?: Toast["severity"], ttlMs?: number) => void;
}

const Ctx = createContext<ToastCtx>({ show: () => {} });

export function useToast() {
  return useContext(Ctx);
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback<ToastCtx["show"]>((text, severity = "info", ttlMs = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text, severity, ttl: ttlMs }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, ttlMs);
  }, []);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div
        style={{
          position: "fixed",
          right: 16,
          bottom: 72,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 9999,
          pointerEvents: "none",
        }}
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="panel-raised"
            style={{
              padding: "10px 14px",
              minWidth: 240,
              maxWidth: 360,
              borderLeft: `3px solid ${
                t.severity === "good"
                  ? "var(--good)"
                  : t.severity === "warn"
                  ? "var(--warn)"
                  : "var(--accent-cyan)"
              }`,
              pointerEvents: "auto",
              animation: "toast-in 240ms var(--ease-standard)",
              fontSize: 13,
            }}
          >
            {t.text}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toast-in {
          from { transform: translateX(24px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </Ctx.Provider>
  );
}
