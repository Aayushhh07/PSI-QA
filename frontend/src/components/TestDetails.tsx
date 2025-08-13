import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';

type Exec = {
  executionId: string;
  websiteId: string;
  status: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  result: { success: boolean; error?: string; logs: string[] };
};

export function TestDetails() {
  const { executionId, site } = useParams();
  const [exec, setExec] = useState<Exec | null>(null);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation() as any;

  useEffect(() => {
    async function load() {
      if (!executionId) return;
      // If we have report info from navigation state, show immediate metadata
      if (location?.state?.report && !exec) {
        const r = location.state.report;
        setExec({
          executionId,
          websiteId: site || 'unknown',
          status: r.summary.failed > 0 ? 'failed' : 'completed',
          duration: r.summary.averageDuration ?? 0,
          result: { success: r.summary.failed === 0, logs: [] },
        });
      }
      const target = site === 'choice-ai' || site === 'opticall' ? site : 'choice-ai';
      const res = await fetch(`/api/${target}/e2e/status/${executionId}`);
      if (res.ok) {
        const json = await res.json();
        setExec(json.data);
        setError(null);
        return;
      }

      // Fallback: mark not found so UI doesn’t hang
      setError('Execution not found. It may be an older run saved before execution details were persisted.');
      setExec({
        executionId,
        websiteId: target,
        status: 'unknown',
        duration: 0,
        result: { success: false, error: 'No execution details available', logs: [] },
      });

      // If choice-ai, try to fetch logs from dedicated logs collection
      if (target === 'choice-ai') {
        try {
          const lr = await fetch(`/api/choice-ai/e2e/logs/${executionId}`);
          if (lr.ok) {
            const lj = await lr.json();
            setExec((prev) => prev ? { ...prev, result: { ...prev.result, logs: lj.data?.logs || [] } } : prev);
          }
        } catch {}
      }
    }
    load();
  }, [executionId, site]);

  if (!exec) return <div className="mx-auto max-w-4xl px-4 py-8">Loading...</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Test Details</h1>
      <div className="mt-4 rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
        {error && (
          <div className="mb-4 rounded-md bg-amber-500/10 text-amber-200 px-3 py-2 text-sm ring-1 ring-amber-500/30">
            {error}
          </div>
        )}
        <div className="text-sm">Execution ID: {exec.executionId}</div>
        <div className="text-sm">Website: {exec.websiteId}</div>
        <div className="text-sm">Status: {exec.status}</div>
        <div className="text-sm">Duration: {exec.duration ?? 0} ms</div>
        <div className="mt-4 text-sm font-medium">Logs</div>
        <div className="mt-2 max-h-80 overflow-auto rounded-lg bg-black/40 p-4 text-sm">
          {exec.result.logs.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
}


