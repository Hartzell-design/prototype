import { useState } from "react";
import { deferral } from "../data";
import { useElementWidth } from "../hooks/useElementWidth";
import "./charts.css";

const H = 240;
const M = { top: 24, right: 8, bottom: 30, left: 36 };
const Y_MAX = 300;
const TICKS = [0, 100, 200, 300];

export function DeferralChart() {
  const [ref, width] = useElementWidth<HTMLDivElement>(400);
  const [hover, setHover] = useState<number | null>(null);

  const w = Math.max(width, 260);
  const iw = w - M.left - M.right, ih = H - M.top - M.bottom;
  const band = iw / deferral.length;
  const bw = Math.min(band * 0.62, 56);
  const y = (v: number) => M.top + ih - (v / Y_MAX) * ih;
  const total = deferral.reduce((s, d) => s + d.count, 0);
  const mode = deferral.reduce((m, d) => (d.count > m.count ? d : m));

  return (
    <div ref={ref} className="nb-chart">
      <svg
        width={w}
        height={H}
        viewBox={`0 0 ${w} ${H}`}
        role="img"
        aria-label={`Bar chart of ${total.toLocaleString()} participants by deferral rate. The largest group, ${mode.count}, defers ${mode.band}.`}
        onPointerLeave={() => setHover(null)}
      >
        {TICKS.map((t) => (
          <g key={t}>
            <line className={t === 0 ? "nb-chart__baseline" : "nb-chart__grid"} x1={M.left} x2={w - M.right} y1={y(t)} y2={y(t)} />
            <text className="nb-chart__tick" x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end">{t}</text>
          </g>
        ))}
        {deferral.map((d, i) => {
          const cx = M.left + band * i + band / 2;
          return (
            <g key={d.band} onPointerEnter={() => setHover(i)}>
              <rect className="nb-chart__hit" x={M.left + band * i} y={M.top} width={band} height={ih} />
              <rect className={`nb-chart__bar${hover !== null && hover !== i ? " is-dim" : ""}`} x={cx - bw / 2} y={y(d.count)} width={bw} height={y(0) - y(d.count)} />
              <text className="nb-chart__value" x={cx} y={y(d.count) - 6} textAnchor="middle">{d.count}</text>
              <text className="nb-chart__tick" x={cx} y={H - 8} textAnchor="middle">{d.band}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function DeferralTable() {
  return (
    <table className="nb-mini-table">
      <caption>Participants by deferral rate</caption>
      <thead><tr><th scope="col">Deferral rate</th><th scope="col" className="num">Participants</th></tr></thead>
      <tbody>
        {deferral.map((d) => (
          <tr key={d.band}><th scope="row">{d.band}</th><td className="num">{d.count}</td></tr>
        ))}
      </tbody>
    </table>
  );
}
