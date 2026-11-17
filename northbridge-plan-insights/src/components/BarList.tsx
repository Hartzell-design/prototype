import "./BarList.css";

export interface BarItem { label: string; value: number; display: string; note?: string }

/**
 * Horizontal bars as a real list: label, value, and a bar scaled to the largest item.
 * Readable without the bars, so it needs no separate table view.
 */
export function BarList({ items, label, tone = "series-1", columns = false }: { items: BarItem[]; label: string; tone?: "series-1" | "series-2"; columns?: boolean }) {
  const max = Math.max(...items.map((i) => i.value));
  return (
    <ul className={`nb-barlist${columns ? " nb-barlist--columns" : ""}`} aria-label={label}>
      {items.map((i) => (
        <li key={i.label} className="nb-barlist__item">
          <span className="nb-barlist__label">
            {i.label}
            {i.note && <span className="nb-barlist__note">{i.note}</span>}
          </span>
          <span className="nb-barlist__value num">{i.display}</span>
          <span className="nb-barlist__track" aria-hidden="true">
            <span className={`nb-barlist__fill nb-barlist__fill--${tone}`} style={{ inlineSize: `${(i.value / max) * 100}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}
