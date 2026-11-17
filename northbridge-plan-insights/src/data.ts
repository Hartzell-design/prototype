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
  delta: string;
  /** Spoken form of the delta for screen readers. */
  deltaSpoken: string;
  trend: Trend;
  /** Whether the movement is good, bad or neutral for the plan. */
  tone: "positive" | "negative" | "neutral";
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
