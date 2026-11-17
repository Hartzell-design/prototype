import type { ReactNode } from "react";
import "./Badge.css";

export type BadgeTone = "positive" | "warning" | "negative" | "info" | "neutral";

export function Badge({ tone = "neutral", dot = false, children }: { tone?: BadgeTone; dot?: boolean; children: ReactNode }) {
  return (
    <span className={`nb-badge nb-badge--${tone}`}>
      {dot && <span className="nb-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
