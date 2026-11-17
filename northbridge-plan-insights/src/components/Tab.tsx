import type { MouseEvent, ReactNode } from "react";
import "./Tab.css";

/** A top-level navigation tab. It's a link, so the current one uses aria-current="page". */
export function Tab({ href, current, onSelect, children }: { href: string; current?: boolean; onSelect?: () => void; children: ReactNode }) {
  return (
    <a
      className="nb-tab"
      href={href}
      aria-current={current ? "page" : undefined}
      onClick={(e: MouseEvent) => {
        if (onSelect) {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {children}
    </a>
  );
}
