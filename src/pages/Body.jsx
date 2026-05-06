import { useState } from 'react';
import { cycleInfo, PHASES, today, formatLong, addDays } from '../utils/cycle';
import './Body.css';

export default function Body({ appState }) {
  const { state, update } = appState;
  const [date, setDate]     = useState(today());
  const [weight, setWeight] = useState('');
  const [waist, setWaist]   = useState('');
  const [bloat, setBloat]   = useState(null);

  function saveBody() {
    if (!date) return;
    const entry = { date, weight: weight ? parseFloat(weight) : null, waist: waist ? parseFloat(waist) : null, bloat };
    const existing = state.body.findIndex(b => b.date === date);
    let newBody;
    if (existing >= 0) {
      newBody = state.body.map((b, i) => i === existing ? entry : b);
    } else {
      newBody = [...state.body, entry].sort((a, b) => b.date.localeCompare(a.date));
    }
    update({ body: newBody });
    setWeight(''); setWaist(''); setBloat(null);
  }

  const sorted = [...state.body].sort((a, b) => b.date.localeCompare(a.date));

  const last14 = Array.from({ length: 14 }, (_, i) => addDays(today(), -(13 - i)));
  const maxBar = 100;

  function bloatColor(v) {
    if (v >= 2) return 'var(--jazz-red)';
    if (v === 1) return 'var(--gold)';
    if (v === 0) return 'var(--ink-soft)';
    return 'var(--crystal)';
  }

  function prevWeight(i) {
    const prev = sorted[i + 1];
    if (!prev?.weight || !sorted[i].weight) return null;
    return (sorted[i].weight - prev.weight).toFixed(1);
  }

  function phaseName(date) {
    const ci = cycleInfo(state, date);
    return ci ? PHASES[ci.phaseKey].name : '—';
  }

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="page-head-left">
          <div className="page-eyebrow">Measurements</div>
          <h1 className="page-title" data-en="BODY">Beden</h1>
        </div>
        <div className="session-tag">Toplam {state.body.length} kayıt</div>
      </div>

      <div className="card">
        <div className="card-label">Bugünün Ölçümü</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tarih</label>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Kilo (kg)</label>
            <input type="number" step="0.1" className="input" value={weight} placeholder="—" onChange={e => setWeight(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Bel (cm)</label>
            <input type="number" step="0.1" className="input" value={waist} placeholder="—" onChange={e => setWaist(e.target.value)} />
          </div>
        </div>

        <div className="form-group mt-16">
          <label className="form-label">Göbek Şişkinliği</label>
          <div className="scale-row">
            {[-1,0,1,2,3].map(v => (
              <button
                key={v}
                className={`scale-btn${bloat === v ? ' selected' : ''}`}
                onClick={() => setBloat(v)}
                type="button"
              >{v > 0 ? `+${v}` : v}</button>
            ))}
          </div>
          <div className="bloat-labels">
            <span>−1 düz</span><span>0 nötr</span><span>+1</span><span>+2</span><span>+3 en şişkin</span>
          </div>
        </div>

        <div className="mt-16">
          <button className="btn btn-primary" type="button" onClick={saveBody}>Ölçümü Kaydet</button>
        </div>
      </div>

      <div className="section-head mt-36">
        Şişkinlik seyri
        <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Son 14 gün</span>
      </div>
      <div className="card">
        <div className="bars">
          {last14.map(d => {
            const e = state.body.find(b => b.date === d);
            const v = e?.bloat;
            if (v === null || v === undefined) {
              return (
                <div key={d} className="bar bar-empty">
                  <div className="bar-label">{d.slice(8)}</div>
                </div>
              );
            }
            const h = Math.max(8, ((v + 1) / 4) * maxBar);
            return (
              <div key={d} className="bar" style={{ height: `${h}%`, background: bloatColor(v) }}>
                <div className="bar-val">{v > 0 ? `+${v}` : v}</div>
                <div className="bar-label">{d.slice(8)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section-head mt-36">
        Ölçüm günlüğü
        <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Karşılaştırma</span>
      </div>
      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr><th>Tarih</th><th>Kilo</th><th>Δ Kilo</th><th>Bel</th><th>Şişkinlik</th><th>Faz</th></tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan="6" className="empty-cell">Henüz ölçüm yok.</td></tr>
            ) : sorted.map((b, i) => {
              const d = prevWeight(i);
              return (
                <tr key={b.date}>
                  <td className="num-cell">{formatLong(b.date)}</td>
                  <td>{b.weight ?? '—'} {b.weight ? 'kg' : ''}</td>
                  <td className={d ? (parseFloat(d) > 0 ? 'delta-up' : parseFloat(d) < 0 ? 'delta-down' : '') : ''}>
                    {d ? `${parseFloat(d) > 0 ? '↑' : '↓'} ${Math.abs(d)}` : '—'}
                  </td>
                  <td>{b.waist ?? '—'} {b.waist ? 'cm' : ''}</td>
                  <td>{b.bloat != null ? (b.bloat > 0 ? `+${b.bloat}` : b.bloat) : '—'}</td>
                  <td>{phaseName(b.date)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
