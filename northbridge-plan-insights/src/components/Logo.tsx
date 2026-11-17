import "./Logo.css";

/**
 * Northbridge mark: an arch (the bridge) with a north tick at its crown.
 * Deliberately abstract — no ships, sails or lookalike wordmarks.
 */
export function Logo({ product = "Plan Insights" }: { product?: string }) {
  return (
    <a className="nb-logo" href="#overview" aria-label={`Northbridge ${product}, home`}>
      <svg className="nb-logo__mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <rect className="nb-logo__tile" x="0" y="0" width="32" height="32" />
        <path className="nb-logo__arch" d="M7 24v-6a9 9 0 0 1 18 0v6" />
        <path className="nb-logo__tick" d="M16 5v6" />
      </svg>
      <span className="nb-logo__words">
        <span className="nb-logo__brand">Northbridge</span>
        <span className="nb-logo__product">{product}</span>
      </span>
    </a>
  );
}
