import { cycleInfo, PHASES } from '../utils/cycle';
import './Insights.css';

function getAvgCycleLen(state) {
  const ps = [...state.periods].sort((a, b) => a.start.localeCompare(b.start));
  if (ps.length < 2) return state.avgCycle;
  const diffs = [];
  for (let i = 1; i < ps.length; i++) {
    const d = Math.round((new Date(ps[i].start) - new Date(ps[i-1].start)) / 86400000);
    diffs.push(d);
  }
  return Math.round(diffs.reduce((s, d) => s + d, 0) / diffs.length);
}

export default function Insights({ appState }) {
  const { state } = appState;

  const avgC = getAvgCycleLen(state);
  const isHealthy = avgC >= 21 && avgC <= 35;

  const symCounts = {};
  Object.values(state.days).forEach(d => (d.symptoms || []).forEach(s => {
    symCounts[s] = (symCounts[s] || 0) + 1;
  }));
  const topSym = Object.entries(symCounts).sort((a, b) => b[1] - a[1]);

  const phaseBloats = { menstrual: [], follicular: [], ovulation: [], luteal: [] };
  state.body.forEach(b => {
    if (b.bloat === null || b.bloat === undefined) return;
    const ci = cycleInfo(state, b.date);
    if (ci) phaseBloats[ci.phaseKey].push(b.bloat);
  });

  function bloatColor(avg) {
    if (avg >= 1.5) return 'var(--jazz-red)';
    if (avg >= 0.5) return 'var(--gold)';
    return 'var(--crystal)';
  }

  const triggers = state.foods.filter(f => (f.issues && f.issues.length > 0) || f.pref === 'react');

  const moodEntries = Object.values(state.days).filter(d => d.mood);
  const avgMood = moodEntries.length ? (moodEntries.reduce((s, d) => s + d.mood, 0) / moodEntries.length).toFixed(1) : null;

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="page-head-left">
          <div className="page-eyebrow">Pattern Recognition</div>
          <h1 className="page-title" data-en="INSIGHTS">Öngörüler</h1>
        </div>
        <div className="session-tag">{state.periods.length} döngü</div>
      </div>

      <div className="page-grid grid-3">
        <div className="stat-card">
          <div className="stat-label">Ortalama Döngü</div>
          <div className="stat-value">{avgC}<span>g</span></div>
          <div className="stat-sub">{isHealthy ? 'Sağlıklı aralıkta' : 'Düzensiz olabilir'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">En Sık Semptom</div>
          <div className="stat-value" style={{ fontSize: '28px' }}>{topSym[0]?.[0] || '—'}</div>
          <div className="stat-sub">{topSym[0] ? `${topSym[0][1]} kez` : 'henüz veri yok'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ort. Ruh Hali</div>
          <div className="stat-value">{avgMood || '—'}<span>/5</span></div>
          <div className="stat-sub">{moodEntries.length} kayıt</div>
        </div>
      </div>

      <div className="section-head mt-36">
        Faza göre şişkinlik
        <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Korelasyon</span>
      </div>
      <div className="card">
        <div className="bars ins-bars">
          {Object.entries(phaseBloats).map(([k, arr]) => {
            const avg = arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null;
            if (avg === null) {
              return (
                <div key={k} className="ins-bar ins-bar-empty">
                  <div className="ins-bar-label">{PHASES[k].name.slice(0, 4)}</div>
                </div>
              );
            }
            const h = Math.max(8, ((avg + 1) / 4) * 100);
            return (
              <div key={k} className="ins-bar" style={{ height: `${h}%`, background: bloatColor(avg) }}>
                <div className="ins-bar-val">{avg.toFixed(1)}</div>
                <div className="ins-bar-label">{PHASES[k].name.slice(0, 4)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section-head mt-36">
        En sık semptomlar
        <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Frekans</span>
      </div>
      <div className="card">
        {topSym.length === 0 ? (
          <div className="empty-msg">Semptom kaydı yok.</div>
        ) : topSym.slice(0, 10).map(([sym, count]) => (
          <div key={sym} className="sym-row">
            <div className="sym-name">{sym}</div>
            <div className="sym-bar-wrap">
              <div
                className="sym-bar-fill"
                style={{ width: `${(count / topSym[0][1]) * 100}%` }}
              />
            </div>
            <div className="sym-count">{count}×</div>
          </div>
        ))}
      </div>

      <div className="section-head mt-36">
        Yiyecek tetikleyiciler
        <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Senin için</span>
      </div>
      <div className="card">
        {triggers.length === 0 ? (
          <div className="empty-msg">Henüz tetikleyici yiyecek tespit edilmedi.</div>
        ) : triggers.map(f => (
          <div key={f.name} className="trigger-item">
            <span className="trigger-icon">!</span>
            <div>
              <div className="trigger-name">{f.name}</div>
              <div className="trigger-issues">
                {f.issues && f.issues.length ? f.issues.join(', ') : 'tepki olarak işaretli'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
