import { getOverview } from "@/lib/api";

const metrics = [
  { label: "Active campaigns", key: "active_campaigns" as const, note: "Connected investigations" },
  { label: "High risk", key: "high_risk_campaigns" as const, note: "Prioritized for review" },
  { label: "Sightings", key: "sightings" as const, note: "Across monitored surfaces" },
  { label: "Brands", key: "brands" as const, note: "Trusted identity records" },
];

export default async function Home() {
  const overview = await getOverview();

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup"><span className="brand-mark">A</span><span>ASTRA</span></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list" aria-label="Main navigation">
          <a className="nav-item nav-item-active" href="#overview"><span>◫</span> Overview</a>
          <a className="nav-item" href="#campaigns"><span>◎</span> Campaigns</a>
          <a className="nav-item" href="#sightings"><span>⌕</span> Sightings</a>
          <a className="nav-item" href="#brands"><span>◇</span> Brand DNA</a>
        </nav>
        <div className="sidebar-bottom"><span className="status-dot" /> Local environment</div>
      </aside>

      <section className="main-panel" id="overview">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> Overview</div>
          <div className="topbar-right"><span className="demo-pill">FOUNDATION BUILD</span><span className="avatar">A</span></div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">DIGITAL RISK PROTECTION</p>
              <h1>Threat overview</h1>
              <p className="subtitle">Connect the signals. Understand the campaign. Decide what happens next.</p>
            </div>
            <button className="button-primary" type="button" disabled title="Available in the ingestion phase">＋ Add sighting</button>
          </div>

          {!overview && <div className="notice notice-warning">API not connected. Start the services with <strong>docker compose up --build</strong>.</div>}
          {overview && <div className="notice notice-info">Phase 1 foundation is online. Metrics will populate as Brand DNA, ingestion, and campaign analysis ship.</div>}

          <div className="section-label">WORKSPACE SIGNALS <span className="section-line" /></div>
          <div className="metric-grid">
            {metrics.map((metric, index) => (
              <article className="metric-card" key={metric.key}>
                <div className="metric-top"><span>{metric.label}</span><span className={`metric-icon metric-icon-${index}`}>{["↗", "!", "⌕", "◇"][index]}</span></div>
                <div className="metric-value">{overview ? overview[metric.key] : "—"}</div>
                <div className="metric-note">{metric.note}</div>
              </article>
            ))}
          </div>

          <div className="content-grid">
            <section className="panel-card">
              <div className="panel-heading"><div><h2>Campaign workspace</h2><p>Related threats will appear as connected investigations.</p></div><span className="coming-soon">PHASE 4</span></div>
              <div className="empty-graph">
                <div className="graph-orbit orbit-one" /><div className="graph-orbit orbit-two" />
                <div className="graph-center">A</div>
                <span className="graph-caption">Evidence graph will appear here</span>
              </div>
              <div className="panel-foot"><span className="status-dot muted" /> No campaign data yet</div>
            </section>
            <section className="panel-card activity-card">
              <div className="panel-heading"><div><h2>Build progress</h2><p>Product milestones</p></div><span className="progress-count">01 / 06</span></div>
              <ol className="milestone-list">
                <li className="milestone milestone-done"><span className="milestone-marker">✓</span><div><strong>Platform foundation</strong><small>Web, API, database, migrations</small></div><span className="milestone-state">READY</span></li>
                <li><span className="milestone-marker">02</span><div><strong>Brand DNA & evidence</strong><small>Trusted identity and sighting intake</small></div><span className="milestone-state">NEXT</span></li>
                <li><span className="milestone-marker">03</span><div><strong>Detection signals</strong><small>Versioned, evidence-backed checks</small></div></li>
                <li><span className="milestone-marker">04</span><div><strong>Campaign graph</strong><small>Cross-surface linking and triage</small></div></li>
                <li><span className="milestone-marker">05</span><div><strong>Analyst response</strong><small>Review, audit, response packet</small></div></li>
                <li><span className="milestone-marker">06</span><div><strong>Release readiness</strong><small>Safety, polish, demo deployment</small></div></li>
              </ol>
            </section>
          </div>
          <footer className="page-footer"><span>ASTRA · Digital Risk Protection</span><span>Evidence-led · Human-reviewed · Tenant-aware</span></footer>
        </div>
      </section>
    </main>
  );
}
