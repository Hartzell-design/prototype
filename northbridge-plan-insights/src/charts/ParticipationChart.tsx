import { useState } from "react";
import { participation } from "../data";
import { useElementWidth } from "../hooks/useElementWidth";
import "./charts.css";

const H = 240;
const M = { top: 28, right: 20, bottom: 30, left: 44 };
const Y_MIN = 81.5, Y_MAX = 86.5;
const TICKS = [82, 83, 84, 85, 86];

export function ParticipationChart() {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const w = Math.max(width, 260);
  const iw = w - M.left - M.right, ih = H - M.top - M.bottom;
  const n = participation.length;
  const x = (i: number) => M.left + (iw * i) / (n - 1);
  const y = (v: number) => M.top + ih - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * ih;

  const line = participation.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.rate).toFixed(1)}`).join("");
  const area = `${line}L${x(n - 1).toFixed(1)},${M.top + ih}L${x(0).toFixed(1)},${M.top + ih}Z`;
  const everyOther = iw < 420;
  const first = participation[0], last = participation[n - 1];
  const active = hover ?? n - 1;
  const a = participation[active];

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / r.width) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };

  // Keep the callout inside the plot.
  const labelX = Math.min(Math.max(x(active), M.left + 30), w - M.right - 30);

  return (
    <div ref={ref} className="nb-chart">
      <svg
        width={w}
        height={H}
        viewBox={`0 0 ${w} ${H}`}
        role="img"
        aria-label={`Line chart. Participation rose from ${first.rate}% in ${first.month} ${first.year} to ${last.rate}% in ${last.month} ${last.year}, increasing every month.`}
      >
        {TICKS.map((t) => (
          <g key={t}>
            <line className="nb-chart__grid" x1={M.left} x2={w - M.right} y1={y(t)} y2={y(t)} />
            <text className="nb-chart__tick" x={M.left - 10} y={y(t)} dy="0.32em" textAnchor="end">{t}%</text>
          </g>
        ))}
        <path className="nb-chart__area" d={area} />
        <path className="nb-chart__line" d={line} />
        {participation.map((d, i) => (
          <g key={d.month}>
            <circle className={`nb-chart__point${i === active ? " is-active" : ""}`} cx={x(i)} cy={y(d.rate)} r={i === active ? 5 : 3} />
            {(!everyOther || i % 2 === 1 || i === n - 1) && (
              <text className="nb-chart__tick" x={x(i)} y={H - 8} textAnchor="middle">{d.month}</text>
            )}
          </g>
        ))}
        <line className="nb-chart__guide" x1={x(active)} x2={x(active)} y1={y(a.rate) + 6} y2={M.top + ih} />
        <g transform={`translate(${labelX},${y(a.rate) - 14})`}>
          <text className="nb-chart__callout" textAnchor="middle">{a.rate.toFixed(1)}%</text>
          <text className="nb-chart__callout-sub" textAnchor="middle" dy="-1.35em">{a.month} {a.year}</text>
        </g>
        <rect
          x={M.left}
          y={M.top}
          width={iw}
          height={ih}
          fill="transparent"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>
    </div>
  );
}

export function ParticipationTable() {
  return (
    <table className="nb-mini-table">
      <caption>Participation rate by month, Dec 2025 to Nov 2026</caption>
      <thead><tr><th scope="col">Month</th><th scope="col" className="num">Participation</th></tr></thead>
      <tbody>
        {participation.map((d) => (
          <tr key={d.month}><th scope="row">{d.month} {d.year}</th><td className="num">{d.rate.toFixed(1)}%</td></tr>
        ))}
      </tbody>
    </table>
  );
}
