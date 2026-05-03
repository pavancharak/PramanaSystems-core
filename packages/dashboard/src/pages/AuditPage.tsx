import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useApp } from "../lib/ctx.ts";
import type { Settings } from "../lib/ctx.ts";
import { CheckBadge } from "../components/CheckBadge.tsx";
import { JsonViewer } from "../components/JsonViewer.tsx";
import { Spinner } from "../components/Spinner.tsx";

// ── Types (dashboard-local, dates arrive as ISO strings from JSON) ─────────

interface DecisionRow {
  execution_id: string;
  policy_id: string;
  policy_version: string;
  decision: string;
  runtime_version: string;
  runtime_hash: string;
  executed_at: string;
  recorded_at: string;
  verification_valid: boolean | null;
  verified_at: string | null;
}

interface SecurityRow {
  event_type: string;
  severity: string;
  event_count: string;
  last_occurrence: string;
  first_occurrence: string;
}

interface AuditStats {
  total_decisions: string;
  decisions_today: string;
  total_verifications: string;
  valid_verifications: string;
  invalid_verifications: string;
  total_security_events: string;
  total_api_calls: string;
}

interface DecisionDetail {
  id: number;
  execution_id: string;
  policy_id: string;
  policy_version: string;
  schema_version: string;
  runtime_version: string;
  runtime_hash: string;
  decision: string;
  signals_hash: string;
  signature: string;
  attestation: unknown;
  executed_at: string;
  recorded_at: string;
}

interface VerificationRow {
  id: number;
  execution_id: string;
  valid: boolean;
  signature_verified: boolean;
  runtime_verified: boolean;
  schema_compatible: boolean;
  verified_at: string;
}

// ── Shared fetch helper ───────────────────────────────────────────────────────

type FetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };

async function auditFetch<T>(path: string, settings: Settings): Promise<FetchResult<T>> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (settings.apiKey) headers.Authorization = `Bearer ${settings.apiKey}`;
  try {
    const res = await fetch(`${settings.baseUrl}${path}`, { headers });
    if (res.ok) {
      return { ok: true, data: (await res.json()) as T };
    }
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch { /* ignore */ }
    return { ok: false, status: res.status, message };
  } catch (err) {
    return { ok: false, status: 0, message: err instanceof Error ? err.message : String(err) };
  }
}

// ── Shared display helpers ────────────────────────────────────────────────────

function fmt(iso: string | null | undefined): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

function truncate(id: string, len = 12): string {
  return id.length > len ? `${id.slice(0, len)}…` : id;
}

function DecisionBadge({ decision }: { decision: string }) {
  const cls =
    decision === "approve"
      ? "border-emerald-700/50 bg-emerald-900/30 text-emerald-300"
      : decision === "deny"
      ? "border-red-700/50 bg-red-900/30 text-red-300"
      : "border-slate-700 bg-slate-800 text-slate-300";
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {decision}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const cls =
    severity === "critical"
      ? "border-red-700/50 bg-red-900/30 text-red-300"
      : severity === "high"
      ? "border-orange-700/50 bg-orange-900/30 text-orange-300"
      : severity === "medium"
      ? "border-amber-700/50 bg-amber-900/30 text-amber-300"
      : "border-slate-700 bg-slate-800 text-slate-400";
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {severity}
    </span>
  );
}

function NotConfiguredCard() {
  return (
    <div className="rounded-xl border border-amber-700/50 bg-amber-900/20 p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-amber-700/50 bg-amber-900/40">
          <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-amber-300">Audit database not configured</p>
          <p className="mt-1 text-sm text-amber-400/80">
            Set <code className="rounded bg-amber-900/50 px-1 font-mono text-amber-300">AUDIT_DATABASE_URL</code> to enable governance audit trails.
          </p>
        </div>
      </div>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-800/50 bg-red-900/20 p-5">
      <p className="mb-1 text-xs font-medium uppercase tracking-widest text-red-500">Error</p>
      <p className="font-mono text-sm text-red-300 break-all">{message}</p>
    </div>
  );
}

function EmptyState({ message = "No records found" }: { message?: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-slate-800 text-sm text-slate-600">
      {message}
    </div>
  );
}

// ── Inner tab bar ─────────────────────────────────────────────────────────────

type AuditTab = "decisions" | "security" | "stats" | "history";

const AUDIT_TABS: { id: AuditTab; label: string }[] = [
  { id: "decisions", label: "Decisions" },
  { id: "security",  label: "Security" },
  { id: "stats",     label: "Stats" },
  { id: "history",   label: "Verify History" },
];

function AuditTabBar({
  active,
  onChange,
}: {
  active: AuditTab;
  onChange: (t: AuditTab) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1 self-start">
      {AUDIT_TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
            active === tab.id
              ? "bg-slate-800 text-slate-100 shadow"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ── Field helper (matches ExecutePage) ───────────────────────────���───────────

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </label>
      <input
        {...props}
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 font-mono transition focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
      />
    </div>
  );
}

function FetchButton({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 active:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading && <Spinner size="sm" />}
      {loading ? loadingLabel : label}
    </button>
  );
}

// ── Decisions tab ─────────────────────────────────────────────────────────────

function DecisionsTab({ settings }: { settings: Settings }) {
  const [policyId, setPolicyId]     = useState("");
  const [decision, setDecision]     = useState("");
  const [fromDate, setFromDate]     = useState("");
  const [toDate, setToDate]         = useState("");
  const [limit, setLimit]           = useState("50");
  const [loading, setLoading]       = useState(false);
  const [rows, setRows]             = useState<DecisionRow[] | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [notConfigured, setNotConf] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandData, setExpandData] = useState<Record<string, unknown>>({});

  async function fetch_(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotConf(false);
    setRows(null);

    const params = new URLSearchParams();
    params.set("limit", limit || "50");
    if (policyId.trim()) params.set("policy_id", policyId.trim());
    if (decision)        params.set("decision", decision);
    if (fromDate)        params.set("from", fromDate);
    if (toDate)          params.set("to", toDate);

    const result = await auditFetch<DecisionRow[]>(`/audit/decisions?${params}`, settings);
    setLoading(false);

    if (result.ok) {
      setRows(result.data);
    } else if (result.status === 404) {
      setNotConf(true);
    } else {
      setError(result.message);
    }
  }

  async function toggleExpand(row: DecisionRow) {
    if (expandedId === row.execution_id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(row.execution_id);
    if (expandData[row.execution_id]) return;

    const result = await auditFetch<DecisionDetail>(`/audit/decisions/${row.execution_id}`, settings);
    if (result.ok) {
      setExpandData(prev => ({ ...prev, [row.execution_id]: result.data }));
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={fetch_} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Policy ID"
            placeholder="access-control"
            value={policyId}
            onChange={e => setPolicyId(e.target.value)}
          />
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
              Decision
            </label>
            <select
              value={decision}
              onChange={e => setDecision(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 transition focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">Any</option>
              <option value="approve">approve</option>
              <option value="deny">deny</option>
            </select>
          </div>
          <Field
            label="From date"
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
          />
          <Field
            label="To date"
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
          />
          <Field
            label="Limit"
            type="number"
            min="1"
            max="1000"
            placeholder="50"
            value={limit}
            onChange={e => setLimit(e.target.value)}
          />
        </div>
        <div className="mt-4">
          <FetchButton loading={loading} label="Fetch Decisions" loadingLabel="Fetching…" />
        </div>
      </form>

      {notConfigured && <NotConfiguredCard />}
      {error && <ErrorCard message={error} />}

      {loading && (
        <div className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 py-12">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="md" />
            <p className="text-sm text-slate-500">Fetching decisions…</p>
          </div>
        </div>
      )}

      {rows !== null && !loading && (
        rows.length === 0 ? (
          <EmptyState message="No decisions match the current filters" />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Execution ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Policy
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Decision
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Executed At
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Verified
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950">
                {rows.map(row => (
                  <>
                    <tr
                      key={row.execution_id}
                      onClick={() => toggleExpand(row)}
                      className="cursor-pointer transition hover:bg-slate-900"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-300">
                        <span title={row.execution_id}>{truncate(row.execution_id, 14)}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <span className="font-medium">{row.policy_id}</span>
                        <span className="ml-1.5 text-xs text-slate-500">{row.policy_version}</span>
                      </td>
                      <td className="px-4 py-3">
                        <DecisionBadge decision={row.decision} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{fmt(row.executed_at)}</td>
                      <td className="px-4 py-3">
                        {row.verification_valid === true ? (
                          <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : row.verification_valid === false ? (
                          <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                    {expandedId === row.execution_id && (
                      <tr key={`${row.execution_id}-expand`}>
                        <td colSpan={5} className="bg-slate-900 px-4 py-4">
                          {expandData[row.execution_id] ? (
                            <JsonViewer value={expandData[row.execution_id]} maxHeight="20rem" />
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Spinner size="sm" /> Loading detail…
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
            <div className="border-t border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-600">
              {rows.length} row{rows.length !== 1 ? "s" : ""} — click a row to expand full attestation
            </div>
          </div>
        )
      )}
    </div>
  );
}

// ── Security tab ──────────────────────────────────────────────────────────────

function SecurityTab({ settings }: { settings: Settings }) {
  const [loading, setLoading]       = useState(false);
  const [rows, setRows]             = useState<SecurityRow[] | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [notConfigured, setNotConf] = useState(false);

  async function fetch_(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotConf(false);
    setRows(null);

    const result = await auditFetch<SecurityRow[]>("/audit/security", settings);
    setLoading(false);

    if (result.ok) {
      setRows(result.data);
    } else if (result.status === 404) {
      setNotConf(true);
    } else {
      setError(result.message);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={fetch_} className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
        <p className="flex-1 text-sm text-slate-500">
          Aggregated security events grouped by type and severity.
        </p>
        <FetchButton loading={loading} label="Fetch Security Events" loadingLabel="Fetching…" />
      </form>

      {notConfigured && <NotConfiguredCard />}
      {error && <ErrorCard message={error} />}

      {loading && (
        <div className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 py-12">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="md" />
            <p className="text-sm text-slate-500">Fetching security events…</p>
          </div>
        </div>
      )}

      {rows !== null && !loading && (
        rows.length === 0 ? (
          <EmptyState message="No security events recorded" />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Event Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Severity
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                    Count
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Last Occurrence
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    First Occurrence
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950">
                {rows.map((row, i) => (
                  <tr key={i} className="transition hover:bg-slate-900">
                    <td className="px-4 py-3">
                      <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-300">
                        {row.event_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={row.severity} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">
                      {row.event_count}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{fmt(row.last_occurrence)}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{fmt(row.first_occurrence)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

// ── Stats tab ─────────────────────────────────────────────────────────────────

const STAT_CARDS: { key: keyof AuditStats; label: string; color: string }[] = [
  { key: "total_decisions",      label: "Total Decisions",       color: "text-blue-400" },
  { key: "decisions_today",      label: "Decisions Today",       color: "text-sky-400" },
  { key: "total_verifications",  label: "Total Verifications",   color: "text-violet-400" },
  { key: "valid_verifications",  label: "Valid Verifications",   color: "text-emerald-400" },
  { key: "invalid_verifications",label: "Invalid Verifications", color: "text-red-400" },
  { key: "total_security_events",label: "Security Events",       color: "text-amber-400" },
  { key: "total_api_calls",      label: "API Calls",             color: "text-slate-400" },
];

function StatsTab({ settings }: { settings: Settings }) {
  const [stats, setStats]           = useState<AuditStats | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [notConfigured, setNotConf] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotConf(false);

    const result = await auditFetch<AuditStats>("/audit/stats", settings);
    setLoading(false);

    if (result.ok) {
      setStats(result.data);
    } else if (result.status === 404) {
      setNotConf(true);
    } else {
      setError(result.message);
    }
  }, [settings]);

  // Auto-fetch when the tab mounts
  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Aggregate counts across all audit tables.</p>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-slate-100 disabled:opacity-50"
        >
          <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Refresh
        </button>
      </div>

      {notConfigured && <NotConfiguredCard />}
      {error && <ErrorCard message={error} />}

      {loading && !stats && (
        <div className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 py-16">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-slate-500">Loading statistics…</p>
          </div>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {STAT_CARDS.map(card => (
            <div key={card.key} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
                {card.label}
              </p>
              <p className={`mt-2 font-mono text-3xl font-bold ${card.color} ${loading ? "opacity-50" : ""}`}>
                {stats[card.key]}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Verify History tab ────────────────────────────────────────────────────────

const CHECK_LABELS: Record<string, string> = {
  signature_verified: "Cryptographic signature verified",
  runtime_verified:   "Runtime hash and version match",
  schema_compatible:  "Schema version compatible",
};

function HistoryTab({ settings }: { settings: Settings }) {
  const [executionId, setExecutionId]   = useState("");
  const [loading, setLoading]           = useState(false);
  const [decision, setDecision]         = useState<DecisionDetail | null>(null);
  const [verifications, setVerifs]      = useState<VerificationRow[]>([]);
  const [error, setError]               = useState<string | null>(null);
  const [notFound, setNotFound]         = useState(false);
  const [notConfigured, setNotConf]     = useState(false);

  async function lookup(e: FormEvent) {
    e.preventDefault();
    const id = executionId.trim();
    if (!id) return;

    setLoading(true);
    setError(null);
    setNotFound(false);
    setNotConf(false);
    setDecision(null);
    setVerifs([]);

    const [decRes, verRes] = await Promise.all([
      auditFetch<DecisionDetail>(`/audit/decisions/${id}`, settings),
      auditFetch<VerificationRow[]>(`/audit/verifications/${id}`, settings),
    ]);
    setLoading(false);

    if (!decRes.ok) {
      if (decRes.status === 404 && decRes.message === "Decision not found") {
        setNotFound(true);
      } else if (decRes.status === 404) {
        setNotConf(true);
      } else {
        setError(decRes.message);
      }
      return;
    }

    setDecision(decRes.data);
    if (verRes.ok) setVerifs(verRes.data);
  }

  const everVerified = verifications.some(v => v.valid);
  const lastVerifiedAt = verifications[0]?.verified_at ?? null;
  const latestVerif = verifications[0] ?? null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Lookup form */}
      <div className="space-y-5">
        <form onSubmit={lookup} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <Field
            label="Execution ID"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={executionId}
            onChange={e => setExecutionId(e.target.value)}
          />
          <FetchButton
            loading={loading}
            label="Look Up Execution"
            loadingLabel="Looking up…"
          />
        </form>

        {notConfigured && <NotConfiguredCard />}
        {notFound && (
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 text-sm text-slate-500">
            No decision found for execution ID{" "}
            <span className="font-mono text-slate-400">{executionId}</span>.
          </div>
        )}
        {error && <ErrorCard message={error} />}

        {loading && (
          <div className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 py-10">
            <div className="flex flex-col items-center gap-3">
              <Spinner size="md" />
              <p className="text-sm text-slate-500">Looking up execution…</p>
            </div>
          </div>
        )}

        {decision && !loading && (
          <div className="space-y-3">
            {/* Summary row */}
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3">
              <DecisionBadge decision={decision.decision} />
              <span className="font-mono text-xs text-slate-400" title={decision.execution_id}>
                {truncate(decision.execution_id, 16)}
              </span>
              <span className="ml-auto text-xs text-slate-500">{fmt(decision.executed_at)}</span>
            </div>

            {/* Decision metadata */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Policy ID",      value: decision.policy_id },
                { label: "Version",        value: decision.policy_version },
                { label: "Schema",         value: decision.schema_version },
                { label: "Runtime",        value: decision.runtime_version },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
                  <p className="mt-0.5 font-mono text-sm text-slate-200">{value}</p>
                </div>
              ))}
            </div>

            {/* Audit summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Verifications</p>
                <p className="mt-0.5 font-mono text-xl font-bold text-slate-200">{verifications.length}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Ever Valid</p>
                <p className={`mt-0.5 text-xl font-bold ${everVerified ? "text-emerald-400" : "text-slate-500"}`}>
                  {verifications.length === 0 ? "—" : everVerified ? "Yes" : "No"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Last Verified</p>
                <p className="mt-0.5 font-mono text-xs text-slate-400">{fmt(lastVerifiedAt)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Verification checks */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Latest Verification</h2>
          <p className="mt-0.5 text-sm text-slate-500">Per-check results from the most recent verification attempt</p>
        </div>

        {!decision && !loading && !notFound && !error && !notConfigured && (
          <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-slate-800 text-sm text-slate-600">
            Enter an execution ID to look up
          </div>
        )}

        {decision && latestVerif && (
          <div className="space-y-3">
            {/* Overall result */}
            <div className={`flex items-center gap-4 rounded-xl border p-5 ${
              latestVerif.valid
                ? "border-emerald-700/50 bg-emerald-900/20"
                : "border-red-700/50 bg-red-900/20"
            }`}>
              {latestVerif.valid ? (
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-emerald-700/50 bg-emerald-900/40">
                  <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
              ) : (
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-red-700/50 bg-red-900/40">
                  <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              <div>
                <p className={`text-lg font-bold ${latestVerif.valid ? "text-emerald-400" : "text-red-400"}`}>
                  {latestVerif.valid ? "VALID" : "INVALID"}
                </p>
                <p className="text-xs text-slate-500">{fmt(latestVerif.verified_at)}</p>
              </div>
            </div>

            {/* Per-check badges */}
            <div className="space-y-2">
              {(["signature_verified", "runtime_verified", "schema_compatible"] as const).map(k => (
                <CheckBadge
                  key={k}
                  label={CHECK_LABELS[k] ?? k.replace(/_/g, " ")}
                  passed={latestVerif[k]}
                />
              ))}
            </div>

            {/* All verification history */}
            {verifications.length > 1 && (
              <details className="group">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-400">
                    <svg className="h-3.5 w-3.5 transition group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                    All {verifications.length} verification attempts
                  </div>
                </summary>
                <div className="mt-2">
                  <JsonViewer value={verifications} maxHeight="16rem" />
                </div>
              </details>
            )}
          </div>
        )}

        {decision && verifications.length === 0 && !loading && (
          <EmptyState message="No verifications recorded for this execution" />
        )}
      </div>
    </div>
  );
}

// ── Main AuditPage ────────────────────────────────────────────────────────────

export function AuditPage() {
  const { settings } = useApp();
  const [activeTab, setActiveTab] = useState<AuditTab>("decisions");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Audit Trail</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Governance decisions, verifications, security events, and statistics
          </p>
        </div>
        <AuditTabBar active={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === "decisions" && <DecisionsTab settings={settings} />}
      {activeTab === "security"  && <SecurityTab  settings={settings} />}
      {activeTab === "stats"     && <StatsTab     settings={settings} />}
      {activeTab === "history"   && <HistoryTab   settings={settings} />}
    </div>
  );
}
