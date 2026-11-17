import { useId, type ReactNode } from "react";
import "./ChartCard.css";

/** Plain card with the same header as Chart Card. */
export function Card({ title, description, actions, children, className, flush }: {
  title: string; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; flush?: boolean;
}) {
  const id = useId();
  return (
    <section className={["nb-card", className].filter(Boolean).join(" ")} aria-labelledby={id}>
      <header className="nb-card__header">
        <div className="nb-card__titles">
          <h2 id={id} className="nb-card__title">{title}</h2>
          {description && <p className="nb-card__description">{description}</p>}
        </div>
        {actions}
      </header>
      <div className={flush ? undefined : "nb-card__body"}>{children}</div>
    </section>
  );
}
