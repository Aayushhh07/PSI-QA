import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

type HistoryItem = {
  executionId: string;
  generatedAt: string;
  summary: { totalTests: number; passed: number; failed: number; successRate: number; averageDuration: number };
};

async function fetchHistory(site: 'choice-ai' | 'opticall') {
  const res = await fetch(`/api/${site}/e2e/history`);
  const json = await res.json();
  return (json.data?.tests || []) as HistoryItem[];
}

export function Analytics() {
  const [choice, setChoice] = useState<HistoryItem[]>([]);
  const [optic, setOptic] = useState<HistoryItem[]>([]);

  useEffect(() => {
    fetchHistory('choice-ai').then(setChoice).catch(()=>{});
    fetchHistory('opticall').then(setOptic).catch(()=>{});
  }, []);

  const toChart = (arr: HistoryItem[]) =>
    arr.map((t) => ({
      date: new Date(t.generatedAt).toLocaleString(),
      passed: t.summary.passed,
      failed: t.summary.failed,
      duration: t.summary.averageDuration,
      rate: t.summary.successRate,
    })).reverse();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Analytics</h1>
      <div className="grid gap-8">
        <section className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
          <h2 className="font-medium">Choice-AI</h2>
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={toChart(choice)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8' }} />
                  <YAxis tick={{ fill: '#94a3b8' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="passed" stroke="#22c55e" />
                  <Line type="monotone" dataKey="failed" stroke="#ef4444" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={toChart(choice)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8' }} />
                  <YAxis tick={{ fill: '#94a3b8' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="duration" fill="#38bdf8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
          <h2 className="font-medium">OpticAll</h2>
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={toChart(optic)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8' }} />
                  <YAxis tick={{ fill: '#94a3b8' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="passed" stroke="#22c55e" />
                  <Line type="monotone" dataKey="failed" stroke="#ef4444" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={toChart(optic)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8' }} />
                  <YAxis tick={{ fill: '#94a3b8' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="duration" fill="#a78bfa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}



