import { useId } from "react";
import type { Kpi } from "../data";
import "./KpiCard.css";

const arrows = {
  up: <path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" />,
  down: <path d="M8 3v10M3.5 8.5L8 13l4.5-4.5" />,
  flat: <path d="M3 8h10" />,
};

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const id = useId();
  return (
    <article className="nb-kpi" aria-labelledby={id}>
      <h3 id={id} className="nb-kpi__label">{kpi.label}</h3>
      <p className="nb-kpi__value">{kpi.value}</p>
      <p className={`nb-kpi__delta nb-kpi__delta--${kpi.tone}`}>
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">{arrows[kpi.trend]}</svg>
        <span aria-hidden="true">{kpi.delta}</span>
        <span className="visually-hidden">{kpi.deltaSpoken}</span>
      </p>
    </article>
  );
}
