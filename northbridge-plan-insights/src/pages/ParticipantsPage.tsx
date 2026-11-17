import { useMemo, useState } from "react";
import { alert, divisions, participants, totals, type Kpi, type Participant } from "../data";
import { downloadCsv } from "../csv";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { KpiCard } from "../components/KpiCard";
import { Card } from "../components/Card";
import { BarList } from "../components/BarList";
import { Input, Select } from "../components/Field";
import { Table, type Column } from "../components/Table";
import { PageHeader } from "../components/PageHeader";

const ALL = "All";
const fmtDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const kpiCards: Kpi[] = [
  { id: "eligible", label: "Eligible employees", value: totals.eligible.toLocaleString(), delta: "Across 5 divisions" },
  { id: "enrolled", label: "Enrolled", value: totals.enrolled.toLocaleString(), delta: `${((totals.enrolled / totals.eligible) * 100).toFixed(1)}% of eligible` },
  { id: "not-enrolled", label: "Not enrolled", value: totals.notEnrolled.toLocaleString(), delta: "Eligible, no active election" },
  { id: "missing", label: "Missing beneficiary", value: String(alert.count), delta: "Reminder due before Dec 31", tone: "negative" },
];

const notEnrolled = divisions
  .map((d) => ({ label: d.name, value: d.eligible - d.enrolled, display: String(d.eligible - d.enrolled), note: `of ${d.eligible} eligible` }))
  .sort((a, b) => b.value - a.value);

const statusTone = { Enrolled: "positive", "Not enrolled": "neutral", "Opted out": "info" } as const;

const columns: Column<Participant>[] = [
  {
    key: "name",
    header: "Participant",
    sortValue: (p) => p.name,
    render: (p) => (
      <span className="division">
        <span className="division__name">{p.name}</span>
        <span className="division__loc num">{p.id}</span>
      </span>
    ),
  },
  { key: "division", header: "Division", sortValue: (p) => p.division, render: (p) => p.division },
  { key: "status", header: "Status", sortValue: (p) => p.status, render: (p) => <Badge tone={statusTone[p.status]}>{p.status}</Badge> },
  { key: "deferral", header: "Deferral", align: "end", sortValue: (p) => p.deferral ?? -1, render: (p) => (p.deferral == null ? <span className="muted">—</span> : `${p.deferral}%`) },
  {
    key: "beneficiary",
    header: "Beneficiary",
    sortValue: (p) => p.beneficiary ?? "",
    render: (p) =>
      p.beneficiary === "Missing" ? <Badge tone="warning" dot>Missing</Badge> : p.beneficiary === "On file" ? <Badge tone="positive" dot>On file</Badge> : <span className="muted">Not applicable</span>,
  },
  { key: "hired", header: "Hire date", align: "end", sortValue: (p) => p.hired, render: (p) => fmtDate(p.hired) },
];

export function ParticipantsPage({ initialBeneficiary, reminder, onReminder }: { initialBeneficiary?: string; reminder: boolean; onReminder: () => void }) {
  const [query, setQuery] = useState("");
  const [division, setDivision] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [beneficiary, setBeneficiary] = useState(initialBeneficiary === "missing" ? "Missing" : ALL);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return participants.filter(
      (p) =>
        (!q || `${p.name} ${p.id}`.toLowerCase().includes(q)) &&
        (division === ALL || p.division === division) &&
        (status === ALL || p.status === status) &&
        (beneficiary === ALL || p.beneficiary === beneficiary),
    );
  }, [query, division, status, beneficiary]);

  const filtered = query || division !== ALL || status !== ALL || beneficiary !== ALL;
  const reset = () => { setQuery(""); setDivision(ALL); setStatus(ALL); setBeneficiary(ALL); };

  const exportRows = () =>
    downloadCsv(
      "northbridge-sample-participants.csv",
      ["Participant", "ID", "Division", "Status", "Deferral %", "Beneficiary", "Hire date"],
      rows.map((p) => [p.name, p.id, p.division, p.status, p.deferral, p.beneficiary ?? "Not applicable", p.hired]),
    );

  return (
    <>
      <PageHeader
        title="Participants"
        actions={
          <>
            <Button onClick={reminder ? undefined : onReminder} disabled={reminder}>{reminder ? "Reminder drafted" : "Send beneficiary reminder"}</Button>
            <Button variant="primary" onClick={exportRows}>Export CSV</Button>
          </>
        }
      />

      <section aria-labelledby="pkpi-heading">
        <h2 id="pkpi-heading" className="visually-hidden">Participant counts</h2>
        <div className="kpi-grid">{kpiCards.map((k) => <KpiCard key={k.id} kpi={k} />)}</div>
      </section>

      <Card title="Not enrolled, by division" description={`${totals.notEnrolled} eligible employees with no active election`}>
        <BarList label="Not enrolled by division" items={notEnrolled} columns />
      </Card>

      <section className="nb-card" aria-labelledby="directory-title">
          <header className="nb-card__header nb-card__header--stack">
            <div className="nb-card__titles">
              <h2 id="directory-title" className="nb-card__title">Participant directory</h2>
              <p className="nb-card__description num" aria-live="polite">
                Showing {rows.length} of {participants.length} sample records (the plan has {totals.eligible.toLocaleString()} eligible employees)
              </p>
            </div>
            <div className="filters">
              <Input label="Search participants" hideLabel placeholder="Search name or ID" type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
              <Select label="Division" options={[ALL, ...divisions.map((d) => d.name)]} value={division} onChange={(e) => setDivision(e.target.value)} />
              <Select label="Status" options={[ALL, "Enrolled", "Not enrolled", "Opted out"]} value={status} onChange={(e) => setStatus(e.target.value)} />
              <Select label="Beneficiary" options={[ALL, "On file", "Missing"]} value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} />
              {filtered && <Button variant="ghost" size="sm" className="filters__reset" onClick={reset}>Clear filters</Button>}
            </div>
          </header>
          <div className="nb-table-scroll" tabIndex={0} role="region" aria-label="Participant table, scrolls sideways on small screens">
            <Table caption="Participant directory, sample records" columns={columns} rows={rows} rowKey={(p) => p.id} empty="No participants match these filters." />
          </div>
      </section>
    </>
  );
}
