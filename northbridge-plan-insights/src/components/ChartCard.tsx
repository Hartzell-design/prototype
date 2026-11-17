import { useId, useState, type ReactNode } from "react";
import "./ChartCard.css";
import "./Segmented.css";

interface ChartCardProps {
  title: string;
  description?: string;
  chart: ReactNode;
  /** The same data as an accessible table. Shown when the reader picks "Table". */
  table: ReactNode;
  footnote?: ReactNode;
  className?: string;
}

export function ChartCard({ title, description, chart, table, footnote, className }: ChartCardProps) {
  const id = useId();
  const [view, setView] = useState<"chart" | "table">("chart");
  return (
    <section className={["nb-card", "nb-chart-card", className].filter(Boolean).join(" ")} aria-labelledby={id}>
      <header className="nb-card__header">
        <div className="nb-card__titles">
          <h2 id={id} className="nb-card__title">{title}</h2>
          {description && <p className="nb-card__description">{description}</p>}
        </div>
        <div className="nb-segmented nb-segmented--sm" role="group" aria-label={`${title}: view as`}>
          <button type="button" aria-pressed={view === "chart"} onClick={() => setView("chart")}>Chart</button>
          <button type="button" aria-pressed={view === "table"} onClick={() => setView("table")}>Table</button>
        </div>
      </header>
      <div className="nb-chart-card__body">{view === "chart" ? chart : table}</div>
      {footnote && <footer className="nb-chart-card__footnote">{footnote}</footer>}
    </section>
  );
}
