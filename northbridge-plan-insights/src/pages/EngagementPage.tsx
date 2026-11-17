import { useMemo, useState } from "react";
import { alert, divisions, kpis, type Division } from "../data";
import { downloadCsv } from "../csv";
import { Button, ButtonLink } from "../components/Button";
import { Badge } from "../components/Badge";
import { Alert } from "../components/Alert";
import { KpiCard } from "../components/KpiCard";
import { ChartCard } from "../components/ChartCard";
import { Input } from "../components/Field";
import { Table, type Column } from "../components/Table";
import { PageHeader } from "../components/PageHeader";
import { ParticipationChart, ParticipationTable } from "../charts/ParticipationChart";
import { DeferralChart, DeferralTable } from "../charts/DeferralChart";

const pct = (n: number) => `${n.toFixed(1)}%`;

const columns: Column<Division>[] = [
  {
    key: "division",
    header: "Division / location",
    sortValue: (d) => d.name,
    render: (d) => (
      <span className="division">
        <span className="division__name">{d.name}</span>
        <span className="division__loc">{d.location}</span>
      </span>
    ),
  },
  { key: "eligible", header: "Eligible", align: "end", sortValue: (d) => d.eligible, render: (d) => d.eligible.toLocaleString() },
  { key: "enrolled", header: "Enrolled", align: "end", sortValue: (d) => d.enrolled, render: (d) => d.enrolled.toLocaleString() },
  {
    key: "participation",
    header: "Participation",
    align: "end",
    sortValue: (d) => d.participation,
    render: (d) => (
      <span className="meter">
        <span className="meter__track" aria-hidden="true"><span className="meter__fill" style={{ inlineSize: `${d.participation}%` }} /></span>
        {pct(d.participation)}
      </span>
    ),
  },
  { key: "deferral", header: "Avg. deferral", align: "end", sortValue: (d) => d.avgDeferral, render: (d) => pct(d.avgDeferral) },
  {
    key: "status",
    header: "Status",
    sortValue: (d) => d.status,
    render: (d) => (d.status === "on-track" ? <Badge tone="positive" dot>On track</Badge> : <Badge tone="warning" dot>Needs review</Badge>),
  },
];

export function exportDivisions() {
  downloadCsv(
    "northbridge-sample-participation-by-division.csv",
    ["Division", "Location", "Eligible", "Enrolled", "Participation %", "Avg. deferral %", "Status"],
    divisions.map((d) => [d.name, d.location, d.eligible, d.enrolled, d.participation, d.avgDeferral, d.status === "on-track" ? "On track" : "Needs review"]),
  );
}

export function EngagementPage({ reminder, onReminder }: { reminder: boolean; onReminder: () => void }) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? divisions.filter((d) => `${d.name} ${d.location}`.toLowerCase().includes(q)) : divisions;
  }, [query]);

  return (
    <>
      <PageHeader
        title="Plan engagement"
        actions={
          <>
            <Button onClick={() => window.print()}>Print</Button>
            <Button variant="primary" onClick={exportDivisions}>Export CSV</Button>
          </>
        }
      />

      <Alert
        tone="warning"
        title="Beneficiary designations missing"
        action={
          reminder ? (
            <ButtonLink size="sm" href="#participants?beneficiary=missing">Reminder drafted · view participants</ButtonLink>
          ) : (
            <Button size="sm" variant="primary" onClick={onReminder}>Send reminder</Button>
          )
        }
      >
        {alert.message}
      </Alert>

      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="visually-hidden">Key metrics</h2>
        <div className="kpi-grid">
          {kpis.map((k) => <KpiCard key={k.id} kpi={k} />)}
        </div>
      </section>

      <div className="chart-grid">
        <ChartCard title="Participation rate" description="Last 12 months, Dec 2025 – Nov 2026" chart={<ParticipationChart />} table={<ParticipationTable />} />
        <ChartCard title="Deferral rate distribution" description="Participants by elected deferral rate" chart={<DeferralChart />} table={<DeferralTable />} />
      </div>

      <section className="nb-card" aria-labelledby="division-title">
        <header className="nb-card__header">
          <div className="nb-card__titles">
            <h2 id="division-title" className="nb-card__title">Participation by division</h2>
            <p className="nb-card__description">{divisions.length} divisions · select a column heading to sort</p>
          </div>
          <Input className="card-filter" label="Filter divisions" hideLabel placeholder="Filter by division or location" type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
        </header>
        <div className="nb-table-scroll" tabIndex={0} role="region" aria-label="Division table, scrolls sideways on small screens">
          <Table caption="Participation by division" columns={columns} rows={rows} rowKey={(d) => d.name} empty={`No divisions match “${query}”.`} />
        </div>
      </section>
    </>
  );
}
