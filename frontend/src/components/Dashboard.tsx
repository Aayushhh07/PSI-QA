import { useCallback, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

type SiteKey = 'choice-ai' | 'opticall';

type ApiResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
};

type ExecutionResult = {
  success: boolean;
  logs: string[];
  error?: string;
  performance?: { loadTime: number };
};

type Execution = {
  id: string;
  websiteId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result: ExecutionResult;
  startedAt?: string;
  finishedAt?: string;
};

type HistoryItem = {
  id: string;
  executionId: string;
  generatedAt: string;
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    successRate: number;
    averageDuration: number;
  };
};

const API_BASE = '/api';

function siteMeta(site: SiteKey) {
  return site === 'choice-ai'
    ? {
        name: 'Choice-AI',
        endpoint: `${API_BASE}/choice-ai/e2e`,
        history: `${API_BASE}/choice-ai/e2e/history`,
      }
    : {
        name: 'OpticAll',
        endpoint: `${API_BASE}/opticall/e2e`,
        history: `${API_BASE}/opticall/e2e/history`,
      };
}

export function Dashboard() {
  const [activeSite, setActiveSite] = useState<SiteKey | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [result, setResult] = useState<Execution | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const cardClass =
    'rounded-2xl bg-slate-900/60 ring-1 ring-white/10 p-6 hover:ring-white/20 transition shadow-xl backdrop-blur';

  const runTest = useCallback(async (site: SiteKey) => {
    setActiveSite(site);
    setIsRunning(true);
    setShowPopup(true);
    setLogs([`▶️ Starting ${siteMeta(site).name} test...`]);
    setResult(null);

    try {
      const res = await fetch(siteMeta(site).endpoint, { method: 'POST' });
      const json: ApiResponse<{ execution: Execution; report?: any }> = await res.json();
      if (!json.success) throw new Error(json.error || json.message);

      const exec = json.data!.execution;
      const report = (json.data as any)?.report;
      setResult(exec);
      const safeLogs: string[] = Array.isArray(exec?.result?.logs)
        ? exec.result.logs
        : Array.isArray(report?.details?.[0]?.result?.logs)
          ? report.details[0].result.logs
          : [];
      setLogs((prev) => [...prev, ...safeLogs]);
    } catch (e: any) {
      setLogs((prev) => [...prev, `❌ Failed to run test: ${e.message || e}`]);
    } finally {
      setIsRunning(false);
      // Hide popup shortly after completion
      setTimeout(() => setShowPopup(false), 1500);
    }
  }, []);

  const fetchHistory = useCallback(async (site: SiteKey) => {
    setActiveSite(site);
    try {
      const res = await fetch(siteMeta(site).history);
      const json: ApiResponse<{ tests: HistoryItem[] }> = await res.json();
      if (!json.success) throw new Error(json.error || json.message);
      const items = (json.data?.tests ?? []) as any[];
      items.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
      setHistory(items.map((x:any)=>({ ...x, site })) as any);
    } catch (e: any) {
      setLogs((prev) => [...prev, `⚠️ Failed to load history: ${e.message || e}`]);
    }
  }, []);

  const statusColor = useMemo(() => {
    if (!result) return '';
    const ok = result.result.success;
    return ok ? 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/30' : 'bg-rose-500/20 text-rose-300 ring-rose-500/30';
  }, [result]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
          QA Automation Dashboard
        </h1>
      </header>

      <section className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className={`${cardClass}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium">Choice-AI</h2>
            <span className="inline-flex items-center rounded-full px-3 py-1 text-sm ring-1 ring-white/10 bg-gradient-to-r from-emerald-400/10 to-cyan-500/10 text-emerald-200">
              API
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-300">Run end-to-end tests and inspect recent results.</p>
          <div className="mt-4 flex gap-3 flex-wrap">
            <button disabled={isRunning} onClick={() => runTest('choice-ai')} className="rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 disabled:opacity-50">Run Test</button>
            <button onClick={() => fetchHistory('choice-ai')} className="rounded-lg px-4 py-2 text-sm font-medium text-sky-300 ring-1 ring-white/10 hover:bg-white/5">View Past Tests</button>
          </div>
        </div>

        <div className={`${cardClass}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium">OpticAll</h2>
            <span className="inline-flex items-center rounded-full px-3 py-1 text-sm ring-1 ring-white/10 bg-gradient-to-r from-sky-500/10 to-violet-500/10 text-sky-200">
              API
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-300">Run end-to-end tests and inspect recent results.</p>
          <div className="mt-4 flex gap-3 flex-wrap">
            <button disabled={isRunning} onClick={() => runTest('opticall')} className="rounded-lg bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 disabled:opacity-50">Run Test</button>
            <button onClick={() => fetchHistory('opticall')} className="rounded-lg px-4 py-2 text-sm font-medium text-violet-300 ring-1 ring-white/10 hover:bg-white/5">View Past Tests</button>
          </div>
        </div>
      </section>

      {/* Floating logs popup */}
      {showPopup && logs.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 w-[92vw] max-w-lg rounded-xl bg-slate-900/90 backdrop-blur ring-1 ring-white/10 shadow-2xl">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="text-sm font-medium">Live Logs</div>
            <button onClick={() => setShowPopup(false)} className="text-xs text-slate-300 hover:text-white">Close</button>
          </div>
          <div className="max-h-64 overflow-auto px-4 pb-4 text-sm">
            {logs.map((line, idx) => (
              <div key={idx} className="leading-6">{line}</div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {result && (
        <section className="mt-8">
          <h3 className="text-lg font-medium text-slate-200">Result</h3>
          <div className={`mt-3 rounded-xl p-4 ring-1 ${statusColor}`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">{result.websiteId}</span>
              <span className="text-sm opacity-80">{result.status}</span>
            </div>
            <div className="mt-2 text-sm opacity-90">{result.result.success ? 'Passed' : 'Failed'}</div>
            <div className="mt-3 flex justify-end">
              <Link
                to={`/details/${(result.websiteId as SiteKey)}/${result.id}`}
                className="text-xs rounded-lg px-2.5 py-1 ring-1 ring-white/10 hover:bg-white/5 text-sky-300"
              >
                View details
              </Link>
            </div>
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section className="mt-8">
          <h3 className="text-lg font-medium text-slate-200">Past Tests</h3>
          <div className="mt-3 rounded-xl ring-1 ring-white/10 bg-slate-900/40 divide-y divide-white/10">
            {history.map((h: any) => (
              <div key={h.executionId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 gap-2">
                <div className="flex items-center gap-3">
                  <div className={`text-xs px-2 py-1 rounded-full ${h.summary.failed > 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                    {h.summary.failed > 0 ? 'Failed' : 'Passed'}
                  </div>
                  <div className="text-sm text-slate-200">{new Date(h.generatedAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-300">
                  <div>Site: <span className="opacity-90">{h.site}</span></div>
                  <div>Total: <span className="opacity-90">{h.summary.totalTests}</span></div>
                  <div>Passed: <span className="opacity-90">{h.summary.passed}</span></div>
                  <div>Failed: <span className="opacity-90">{h.summary.failed}</span></div>
                  <Link to={`/details/${h.site}/${h.executionId}`} state={{ report: h }} className="text-sky-300 hover:underline whitespace-nowrap">View details</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}


