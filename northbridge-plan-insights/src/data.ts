// Sample data only. Northbridge and Quillfield Instruments are fictional.
// Every value below is copied from the legacy files (legacy-a-2011.html, legacy-b-2016.html)
// so the before and after screens map one-to-one.

export const plan = {
  name: "Quillfield Instruments 401(k)",
  asOf: "Nov 13, 2026",
  user: { name: "Jordan Ellery", initials: "JE" },
};

export const plans = [plan.name];

export const alert = {
  count: 42,
  message:
    "42 participants are missing a beneficiary designation. Send a reminder before the plan-year close.",
};

export type Trend = "up" | "down" | "flat";

export interface Kpi {
  id: string;
  label: string;
  value: string;
  /** Change or supporting note under the value. */
  delta?: string;
  /** Spoken form of the delta for screen readers (defaults to delta). */
  deltaSpoken?: string;
  /** Arrow direction. Omit for a plain note. */
  trend?: Trend;
  /** Whether the movement is good, bad or neutral for the plan. */
  tone?: "positive" | "negative" | "neutral";
}

export const kpis: Kpi[] = [
  { id: "eligible", label: "Eligible employees", value: "1,284", delta: "+18 since Q2", deltaSpoken: "Up 18 since Q2", trend: "up", tone: "positive" },
  { id: "participation", label: "Participation rate", value: "85.8%", delta: "+2.1 pts vs. last quarter", deltaSpoken: "Up 2.1 points versus last quarter", trend: "up", tone: "positive" },
  { id: "deferral", label: "Avg. deferral rate", value: "5.6%", delta: "No change vs. last quarter", deltaSpoken: "No change versus last quarter", trend: "flat", tone: "neutral" },
  { id: "beneficiary", label: "Beneficiary on file", value: "64.2%", delta: "−0.4 pts vs. last quarter", deltaSpoken: "Down 0.4 points versus last quarter", trend: "down", tone: "negative" },
];

/** Participation rate, Dec 2025 to Nov 2026 (read from the legacy line charts). */
export const participation: { month: string; year: number; rate: number }[] = [
  { month: "Dec", year: 2025, rate: 82.1 },
  { month: "Jan", year: 2026, rate: 82.4 },
  { month: "Feb", year: 2026, rate: 82.9 },
  { month: "Mar", year: 2026, rate: 83.0 },
  { month: "Apr", year: 2026, rate: 83.6 },
  { month: "May", year: 2026, rate: 84.0 },
  { month: "Jun", year: 2026, rate: 84.2 },
  { month: "Jul", year: 2026, rate: 84.9 },
  { month: "Aug", year: 2026, rate: 85.1 },
  { month: "Sep", year: 2026, rate: 85.3 },
  { month: "Oct", year: 2026, rate: 85.6 },
  { month: "Nov", year: 2026, rate: 85.8 },
];

/** Participants by deferral rate band. */
export const deferral: { band: string; count: number }[] = [
  { band: "1–2%", count: 96 },
  { band: "3%", count: 214 },
  { band: "4%", count: 168 },
  { band: "5%", count: 152 },
  { band: "6%", count: 281 },
  { band: "7–9%", count: 121 },
  { band: "10%+", count: 70 },
];

export type DivisionStatus = "on-track" | "needs-review";

export interface Division {
  name: string;
  location: string;
  eligible: number;
  enrolled: number;
  participation: number;
  avgDeferral: number;
  status: DivisionStatus;
}

export const divisions: Division[] = [
  { name: "Manufacturing", location: "Dayton, OH", eligible: 412, enrolled: 338, participation: 82.0, avgDeferral: 5.1, status: "on-track" },
  { name: "Engineering", location: "Boulder, CO", eligible: 268, enrolled: 251, participation: 93.7, avgDeferral: 6.6, status: "on-track" },
  { name: "Sales", location: "Remote", eligible: 196, enrolled: 152, participation: 77.6, avgDeferral: 4.4, status: "needs-review" },
  { name: "Operations", location: "Reno, NV", eligible: 244, enrolled: 205, participation: 84.0, avgDeferral: 5.0, status: "on-track" },
  { name: "Corporate", location: "Chicago, IL", eligible: 164, enrolled: 156, participation: 95.1, avgDeferral: 7.1, status: "on-track" },
];

// ---------------------------------------------------------------------------
// Data for the Overview, Participants, Contributions and Reports tabs.
// Also sample data. Where a figure can be derived from the legacy numbers above
// it is derived (not typed in), so every tab agrees with the Engagement tab.
// ---------------------------------------------------------------------------

const eligibleTotal = divisions.reduce((s, d) => s + d.eligible, 0);
const enrolledTotal = divisions.reduce((s, d) => s + d.enrolled, 0);
export const totals = { eligible: eligibleTotal, enrolled: enrolledTotal, notEnrolled: eligibleTotal - enrolledTotal }; // 1,284 / 1,102 / 182

export const planDetails: { term: string; value: string }[] = [
  { term: "Plan", value: plan.name },
  { term: "Plan number", value: "001" },
  { term: "Plan year", value: "Jan 1 – Dec 31, 2026" },
  { term: "Automatic enrollment", value: "Yes, at 3% for new hires" },
  { term: "Employer match", value: "100% of the first 3%, plus 50% of the next 2%" },
  { term: "Payroll frequency", value: "Semi-monthly" },
  { term: "Record-keeper", value: "Northbridge (fictional)" },
];

export interface KeyDate { date: string; iso: string; title: string; detail: string }
export const keyDates: KeyDate[] = [
  { date: "Nov 14, 2026", iso: "2026-11-14", title: "Payroll", detail: "Contributions post 1–2 business days after the pay date" },
  { date: "Dec 31, 2026", iso: "2026-12-31", title: "Plan-year close", detail: "Last day to send beneficiary reminders for this plan year" },
  { date: "Jan 15, 2027", iso: "2027-01-15", title: "Year-end census due", detail: "Hours, pay and hire dates for every eligible employee" },
  { date: "Mar 15, 2027", iso: "2027-03-15", title: "Nondiscrimination testing results", detail: "Sample timeline; confirm with your plan consultant" },
];

export type ParticipantStatus = "Enrolled" | "Not enrolled" | "Opted out";
export interface Participant {
  id: string;
  name: string;
  division: string;
  status: ParticipantStatus;
  deferral: number | null;
  beneficiary: "On file" | "Missing" | null;
  hired: string;
}

type Raw = [string, string, ParticipantStatus, number | null, Participant["beneficiary"], string];
const rawParticipants: Raw[] = [
  ["Avery Okafor", "Manufacturing", "Enrolled", 6, "On file", "2019-03-11"],
  ["Bianca Restrepo", "Engineering", "Enrolled", 8, "On file", "2017-08-21"],
  ["Caleb Whitlock", "Sales", "Not enrolled", null, null, "2026-06-02"],
  ["Dana Pruitt", "Operations", "Enrolled", 3, "Missing", "2026-02-16"],
  ["Elias Varga", "Corporate", "Enrolled", 10, "On file", "2012-05-07"],
  ["Farah Haddad", "Engineering", "Enrolled", 6, "On file", "2021-01-19"],
  ["Gideon Marsh", "Manufacturing", "Enrolled", 4, "Missing", "2025-09-29"],
  ["Hana Sato", "Sales", "Enrolled", 5, "On file", "2020-11-02"],
  ["Imani Brooks", "Operations", "Opted out", null, null, "2024-04-15"],
  ["Jonah Albrecht", "Manufacturing", "Enrolled", 3, "On file", "2023-07-10"],
  ["Keira Donnelly", "Corporate", "Enrolled", 7, "On file", "2016-10-03"],
  ["Luis Carmona", "Manufacturing", "Not enrolled", null, null, "2026-08-24"],
  ["Mira Lindqvist", "Engineering", "Enrolled", 12, "On file", "2014-02-24"],
  ["Nikhil Rao", "Sales", "Enrolled", 2, "Missing", "2026-01-12"],
  ["Odette Fournier", "Operations", "Enrolled", 6, "On file", "2018-06-18"],
  ["Pavel Novak", "Manufacturing", "Enrolled", 5, "On file", "2022-03-07"],
  ["Quinn Harlow", "Engineering", "Enrolled", 6, "On file", "2019-09-09"],
  ["Rosa Delgado", "Manufacturing", "Enrolled", 4, "On file", "2015-11-16"],
  ["Samir Aziz", "Sales", "Not enrolled", null, null, "2026-09-14"],
  ["Tessa Gallagher", "Corporate", "Enrolled", 6, "Missing", "2026-03-30"],
  ["Umar Siddiqui", "Operations", "Enrolled", 3, "On file", "2023-12-04"],
  ["Valeria Moretti", "Engineering", "Enrolled", 9, "On file", "2013-04-22"],
  ["Wes Tanaka", "Manufacturing", "Enrolled", 6, "On file", "2020-08-03"],
  ["Ximena Castillo", "Sales", "Enrolled", 4, "On file", "2021-05-24"],
  ["Yusuf Demir", "Operations", "Not enrolled", null, null, "2026-10-05"],
  ["Zoe Whitaker", "Engineering", "Enrolled", 6, "Missing", "2025-11-10"],
  ["Ana Lucía Paredes", "Corporate", "Enrolled", 8, "On file", "2018-01-08"],
  ["Ben Oyelaran", "Manufacturing", "Enrolled", 3, "Missing", "2026-04-20"],
  ["Chloe Vance", "Sales", "Enrolled", 6, "On file", "2017-02-13"],
  ["Dmitri Volkov", "Operations", "Enrolled", 5, "On file", "2019-07-29"],
];

/** 30 fictional sample records for the directory. Not the full population. */
export const participants: Participant[] = rawParticipants.map(([name, division, status, deferral, beneficiary, hired], i) => ({
  id: `QI-${String(10421 + i * 37).padStart(5, "0")}`,
  name, division, status, deferral, beneficiary, hired,
}));

/** Contributions by month, plan year to date (Jan–Oct 2026; November payrolls haven't posted). */
export const contributionsByMonth: { month: string; employee: number; employer: number }[] = [
  { month: "Jan", employee: 372400, employer: 198300 },
  { month: "Feb", employee: 378900, employer: 201800 },
  { month: "Mar", employee: 384100, employer: 204600 },
  { month: "Apr", employee: 389600, employer: 207500 },
  { month: "May", employee: 395800, employer: 210800 },
  { month: "Jun", employee: 401200, employer: 213700 },
  { month: "Jul", employee: 404900, employer: 215600 },
  { month: "Aug", employee: 409700, employer: 218200 },
  { month: "Sep", employee: 413300, employer: 220100 },
  { month: "Oct", employee: 417500, employer: 222400 },
];

const employeeYtd = contributionsByMonth.reduce((s, m) => s + m.employee, 0);
const employerYtd = contributionsByMonth.reduce((s, m) => s + m.employer, 0);
const rothYtd = Math.round((employeeYtd * 0.28) / 100) * 100;
export const contributionTotals = {
  employee: employeeYtd,
  employer: employerYtd,
  total: employeeYtd + employerYtd,
  pretax: employeeYtd - rothYtd,
  roth: rothYtd,
  rollovers: 312600,
};

export type RemittanceStatus = "Posted" | "Scheduled";
export interface Remittance { payDate: string; iso: string; posted: string; employee: number; employer: number; status: RemittanceStatus }

const byMonth = Object.fromEntries(contributionsByMonth.map((m) => [m.month, m]));
/** Each semi-monthly payroll is half of its month, so the two rows add back to the monthly figure. */
const payroll = (payDate: string, iso: string, posted: string, month: string, first: boolean): Remittance => {
  const half = (k: "employee" | "employer") => (first ? Math.floor(byMonth[month][k] / 2) : byMonth[month][k] - Math.floor(byMonth[month][k] / 2));
  return { payDate, iso, posted, employee: half("employee"), employer: half("employer"), status: "Posted" };
};

export const remittances: Remittance[] = [
  { payDate: "Nov 14, 2026", iso: "2026-11-14", posted: "—", employee: 210400, employer: 112100, status: "Scheduled" },
  payroll("Oct 30, 2026", "2026-10-30", "Nov 2, 2026", "Oct", false),
  payroll("Oct 15, 2026", "2026-10-15", "Oct 16, 2026", "Oct", true),
  payroll("Sep 30, 2026", "2026-09-30", "Oct 1, 2026", "Sep", false),
  payroll("Sep 15, 2026", "2026-09-15", "Sep 16, 2026", "Sep", true),
  payroll("Aug 31, 2026", "2026-08-31", "Sep 1, 2026", "Aug", false),
  payroll("Aug 14, 2026", "2026-08-14", "Aug 17, 2026", "Aug", true),
];
