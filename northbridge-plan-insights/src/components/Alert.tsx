import { useId, type ReactNode } from "react";
import "./Alert.css";

type Tone = "warning" | "info" | "positive" | "negative";

export function Alert({ tone = "warning", title, children, action }: { tone?: Tone; title: string; children: ReactNode; action?: ReactNode }) {
  const id = useId();
  return (
    <section className={`nb-alert nb-alert--${tone}`} aria-labelledby={id}>
      <svg className="nb-alert__icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <circle cx="10" cy="10" r="8.25" />
        <path d="M10 5.75v5.5" />
        <circle className="nb-alert__dot" cx="10" cy="14.25" r="1.1" />
      </svg>
      <div className="nb-alert__body">
        <h2 id={id} className="nb-alert__title">{title}</h2>
        <p className="nb-alert__text">{children}</p>
      </div>
      {action && <div className="nb-alert__action">{action}</div>}
    </section>
  );
}
