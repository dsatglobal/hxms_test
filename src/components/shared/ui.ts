/**
 * Universal style constants — single source of truth for typography,
 * status badge colors, and scenario colors across all list pages.
 */

export const T = {
  // Page
  pageTitle: "text-xl font-bold text-slate-900",
  pageSubtitle: "text-sm text-slate-500",

  // Table cell typography — USE EVERYWHERE
  cellPrimary: "text-sm font-semibold text-slate-900",   // company / customer / person names — ALWAYS BOLD
  cellId: "text-xs font-mono font-medium text-blue-600", // quote no, job no, container no, plate no — ALWAYS MONOSPACE BLUE
  cellSecondary: "text-sm text-slate-600",               // regular data values
  cellMuted: "text-xs text-slate-400",                   // dates, metadata, helper text
  cellAmount: "text-sm font-semibold text-slate-900 tabular-nums", // money values

  // Drawer typography
  drawerTitle: "text-lg font-bold text-slate-900",
  drawerLabel: "text-xs font-medium text-slate-400 uppercase tracking-wide",
  drawerValue: "text-sm text-slate-800",
  sectionHeader: "text-xs font-bold text-slate-500 uppercase tracking-wider",
};

export const BADGE_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  pending_approval: "bg-amber-50 text-amber-700 border border-amber-200",
  pending_global_approval: "bg-amber-50 text-amber-700 border border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border border-blue-200",
  approved: "bg-green-50 text-green-700 border border-green-200",
  active: "bg-green-50 text-green-700 border border-green-200",
  completed: "bg-slate-100 text-slate-500",
  expired: "bg-red-50 text-red-600 border border-red-200",
  exception: "bg-red-50 text-red-700 border border-red-200",
  cancelled: "bg-slate-100 text-slate-400 line-through",
  superseded: "bg-slate-100 text-slate-400",
  rejected: "bg-red-50 text-red-600 border border-red-200",
  paid: "bg-green-50 text-green-700",
  unpaid: "bg-amber-50 text-amber-700",
  overdue: "bg-red-50 text-red-700",
  issued: "bg-blue-50 text-blue-700",
  sent: "bg-blue-50 text-blue-700",
  signed: "bg-green-50 text-green-700",
  scheduled: "bg-indigo-50 text-indigo-700",
  dispatched: "bg-cyan-50 text-cyan-700",
  unassigned: "bg-amber-50 text-amber-700",
  idle: "bg-slate-100 text-slate-600",
  assigned: "bg-indigo-50 text-indigo-700",
  "in-transit": "bg-cyan-50 text-cyan-700",
  "at-site": "bg-blue-50 text-blue-700",
  maintenance: "bg-amber-50 text-amber-700",
};

export const SCENARIO_COLORS: Record<string, string> = {
  IMP: "bg-blue-100 text-blue-700",
  EXP: "bg-green-100 text-green-700",
  Inland: "bg-amber-100 text-amber-700",
  EMTY: "bg-purple-100 text-purple-700",
  RETURN: "bg-slate-200 text-slate-600",
};

/** Universal status badge classname builder */
export const badgeClass = (status: string) =>
  `inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize whitespace-nowrap ${
    BADGE_COLORS[status] ?? "bg-slate-100 text-slate-600"
  }`;

/** Pretty-print a status key: pending_approval → Pending Approval */
export const statusLabel = (status: string) =>
  status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
