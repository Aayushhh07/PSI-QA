export function About() {
  const chips = [
    'HealthTech', 'LegalTech', 'FinTech', 'UrbanTech', 'EdTech', 'Industrial IoT', 'Enterprise NLP', 'LLMOps',
    'Voice AI', 'CivicTech', 'Retail & Consumer AI', 'Social Impact', 'Creator Tools', 'HR Tech', 'Media & Entertainment',
  ];

  const ventures = [
    'OpticAll', 'Choice AI', 'Indika AI', 'PredCo', 'RoadVision AI', 'Nyaay AI', 'Inspire AI', 'Insituate AI',
    'InvestorBase', 'OnFinance', 'Parchaa', 'DreamHire', 'SupportNest', 'FounderMode', 'QuantVerse', 'SheEO',
  ];

  const steps = [
    { n: '01', title: 'Co-Found Companies', body: 'We partner from ideation to co-create new ventures with founders.' },
    { n: '02', title: 'Growth', body: 'Operator-led execution, go-to-market support and early customer wins.' },
    { n: '03', title: 'Scale & Spin', body: 'Once traction is established, ventures spin out as independent entities.' },
    { n: '04', title: 'Ongoing Support', body: 'Continuous advisory, fundraising and platform support post spinout.' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Hero */}
      <section className="text-center">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
          India&apos;s Largest Deep Tech and AI Venture Studio
        </h1>
        <p className="mt-4 text-slate-300 max-w-3xl mx-auto">
          PanScience Innovations (PSI) builds and scales cutting‑edge deep‑tech and AI startups with passionate
          entrepreneurs. With hands‑on operator support, strategic mentorship and a powerful partner ecosystem,
          PSI transforms breakthrough ideas into market‑leading companies solving real‑world problems.
        </p>
      </section>

      {/* Focus */}
      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
          <h2 className="text-lg font-medium">What We Do</h2>
          <ul className="mt-3 space-y-2 text-slate-300 text-sm list-disc pl-5">
            <li>Co‑found and build ventures from Day 0 with founders.</li>
            <li>Operator‑first execution across product, engineering, GTM and hiring.</li>
            <li>Access to lighthouse partners, mentors, research bodies and investors.</li>
            <li>Systems for rapid prototyping, validation and scale.</li>
          </ul>
        </div>

        <div className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
          <h2 className="text-lg font-medium">AI in Action Across Industries</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((c) => (
              <span key={c} className="text-xs rounded-full px-3 py-1 ring-1 ring-white/10 bg-white/5">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Ventures */}
      <section className="mt-10">
        <h2 className="text-lg font-medium">Selected Ventures</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ventures.map((v) => (
            <div key={v} className="rounded-xl bg-slate-900/60 p-4 ring-1 ring-white/10 text-slate-200 text-sm">
              {v}
            </div>
          ))}
        </div>
      </section>

      {/* Lifecycle */}
      <section className="mt-10">
        <h2 className="text-lg font-medium">Life Cycle of Venture Building</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="rounded-xl bg-slate-900/60 p-5 ring-1 ring-white/10">
              <div className="text-xs opacity-70">{s.n}</div>
              <div className="mt-1 font-medium">{s.title}</div>
              <div className="mt-2 text-sm text-slate-300">{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Partner with PSI */}
      <section className="mt-10 rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
        <h2 className="text-lg font-medium">Partner with PSI</h2>
        <p className="mt-3 text-sm text-slate-300">
          PSI collaborates with government, investors, startups, corporations, universities and mentors to co‑create
          scalable solutions and accelerate innovation across India&apos;s deep‑tech landscape.
        </p>
      </section>

      <div className="mt-8 text-xs text-slate-400">
        Source: PanScience Innovations site. See reference.
      </div>
    </div>
  );
}


