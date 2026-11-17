import { useState } from "react";
import { contributionsByMonth } from "../data";
import { usd, usdShort } from "../csv";
import { useElementWidth } from "../hooks/useElementWidth";
import "./charts.css";

const H = 260;
const M = { top: 28, right: 8, bottom: 30, left: 52 };
const Y_MAX = 700_000;
const TICKS = [0, 200_000, 400_000, 600_000];

/** Stacked monthly bars: employee deferrals (series 1) under employer match (series 2). */
export function ContributionsChart() {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const w = Math.max(width, 280);
  const iw = w - M.left - M.right, ih = H - M.top - M.bottom;
  const n = contributionsByMonth.length;
  const band = iw / n;
  const bw = Math.min(band * 0.62, 44);
  const y = (v: number) => M.top + ih - (v / Y_MAX) * ih;
  const first = contributionsByMonth[0], last = contributionsByMonth[n - 1];
  const tot = (m: typeof first) => m.employee + m.employer;
  const active = hover ?? n - 1;

  return (
    <div ref={ref} className="nb-chart">
      <svg
        width={w}
        height={H}
        viewBox={`0 0 ${w} ${H}`}
        role="img"
        aria-label={`Stacked bar chart of monthly contributions, January to October 2026. Totals rose from ${usd(tot(first))} in January to ${usd(tot(last))} in October. Employee deferrals are about two thirds of each month.`}
        onPointerLeave={() => setHover(null)}
      >
        {TICKS.map((t) => (
          <g key={t}>
            <line className={t === 0 ? "nb-chart__baseline" : "nb-chart__grid"} x1={M.left} x2={w - M.right} y1={y(t)} y2={y(t)} />
            <text className="nb-chart__tick" x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end">{t === 0 ? "$0" : usdShort(t)}</text>
          </g>
        ))}
        {contributionsByMonth.map((m, i) => {
          const cx = M.left + band * i + band / 2;
          const dim = hover !== null && hover !== i;
          return (
            <g key={m.month} onPointerEnter={() => setHover(i)}>
              <rect className="nb-chart__hit" x={M.left + band * i} y={M.top} width={band} height={ih} />
              <rect className={`nb-chart__bar${dim ? " is-dim" : ""}`} x={cx - bw / 2} y={y(m.employee)} width={bw} height={y(0) - y(m.employee)} />
              <rect className={`nb-chart__bar nb-chart__bar--series-2${dim ? " is-dim" : ""}`} x={cx - bw / 2} y={y(tot(m))} width={bw} height={y(m.employee) - y(tot(m))} />
              {i === active && (
                <text className="nb-chart__value" x={Math.min(Math.max(cx, M.left + 24), w - M.right - 24)} y={y(tot(m)) - 8} textAnchor="middle">{usdShort(tot(m))}</text>
              )}
              <text className="nb-chart__tick" x={cx} y={H - 8} textAnchor="middle">{m.month}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function ContributionsTable() {
  return (
    <table className="nb-mini-table">
      <caption>Contributions by month, Jan–Oct 2026</caption>
      <thead>
        <tr><th scope="col">Month</th><th scope="col" className="num">Employee</th><th scope="col" className="num">Employer</th><th scope="col" className="num">Total</th></tr>
      </thead>
      <tbody>
        {contributionsByMonth.map((m) => (
          <tr key={m.month}>
            <th scope="row">{m.month} 2026</th>
            <td className="num">{usd(m.employee)}</td>
            <td className="num">{usd(m.employer)}</td>
            <td className="num">{usd(m.employee + m.employer)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
