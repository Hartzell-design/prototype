import type { ReactNode } from "react";
import { plan } from "../data";
import { Badge } from "./Badge";

/** Page title row shared by every tab: title, plan and as-of date, sample-data badge, actions. */
export function PageHeader({ title, actions, meta }: { title: string; actions?: ReactNode; meta?: ReactNode }) {
  return (
    <div className="page__header">
      <div className="page__heading">
        <h1 className="page__title">{title}</h1>
        <p className="page__meta">
          <span>{plan.name}</span>
          <span className="page__sep" aria-hidden="true">·</span>
          <span className="num">{meta ?? <>Data as of {plan.asOf}</>}</span>
          <Badge tone="neutral">Sample data</Badge>
        </p>
      </div>
      {actions && <div className="page__actions">{actions}</div>}
    </div>
  );
}
