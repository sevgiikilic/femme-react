import { useState } from 'react';
import { cycleInfo, PHASES, today, formatLong, addDays } from '../utils/cycle';
import './Sleep.css';

function calcDuration(bed, wake) {
  const [bh, bm] = bed.split(':').map(Number);
  const [wh, wm] = wake.split(':').map(Number);
  let mins = (wh * 60 + wm) - (bh * 60 + bm);
  if (mins < 0) mins += 1440;
  return mins;
}

function fmtDur(mins) {
  if (!mins && mins !== 0) return '—';
  return `${Math.floor(mins / 60)}s ${mins % 60}dk`;
}

function qualityColor(q) {
  if (q >= 4) return 'var(--crystal)';
  if (q >= 3) return 'var(--gold)';
  return 'var(--jazz-red)';
}

export default function Sleep({ appState }) {
  const { state, update } = appState;
  const sleep = state.sleep || [];

  const [date, setBed_date] = useState(today());
  const [bedtime, setBedtime]   = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality]   = useState(null);
  const [notes, setNotes]       = useState('');

  function saveSleep() {
    const duration = calcDuration(bedtime, wakeTime);
    const entry = { date, bedtime, wakeTime, duration, quality, notes: notes.trim() };
    const idx = sleep.findIndex(s => s.date === date);
    const newSleep = idx >= 0
      ? sleep.map((s, i) => i === idx ? entry : s)
      : [...sleep, entry].sort((a, b) => b.date.localeCompare(a.date));
    update({ sleep: newSleep });
    setNotes(''); setQuality(null);
  }

  const last14 = Array.from({ length: 14 }, (_, i) => addDays(today(), -(13 - i)));
  const sorted = [...sleep].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);

  const avgQuality  = sleep.length ? (sleep.reduce((s, e) => s + (e.quality || 0), 0) / sleep.length).toFixed(1) : null;
  const avgDuration = sleep.length ? Math.round(sleep.reduce((s, e) => s + (e.duration || 0), 0) / sleep.length) : null;
  const recent7     = sleep.filter(s => s.date >= addDays(today(), -7));
  const avgRecent   = recent7.length ? Math.round(recent7.reduce((s, e) => s + (e.duration || 0), 0) / recent7.length) : null;

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="page-head-left">
          <div className="page-eyebrow">Rest Signal</div>
          <h1 className="page-title" data-en="SLEEP">Uyku</h1>
        </div>
        <div className="session-tag">{sleep.length} kayıt</div>
      </div>

      <div className="page-grid grid-3">
        <div className="stat-card">
          <div className="stat-label">Ort. Kalite</div>
          <div className="stat-value">{avgQuality || '—'}<span>/5</span></div>
          <div className="stat-sub">{sleep.length} gece</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ort. Süre</div>
          <div className="stat-value" style={{ fontSize: '38px' }}>{fmtDur(avgDuration)}</div>
          <div className="stat-sub">tüm kayıtlar</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Son 7 Gece</div>
          <div className="stat-value" style={{ fontSize: '38px' }}>{fmtDur(avgRecent)}</div>
          <div className="stat-sub">{recent7.length} gece</div>
        </div>
      </div>

      <div className="section-head mt-36">
        Uyku Kaydı
        <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Bugün veya geçmiş</span>
      </div>
      <div className="card">
        <div className="card-label">Yeni Giriş</div>
        <div style={{ padding: '16px 20px 0' }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tarih</label>
              <input type="date" className="input" value={date} onChange={e => setBed_date(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Uyudum</label>
              <input type="time" className="input" value={bedtime} onChange={e => setBedtime(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Uyandım</label>
              <input type="time" className="input" value={wakeTime} onChange={e => setWakeTime(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Süre</label>
              <div className="sleep-dur-badge">{fmtDur(calcDuration(bedtime, wakeTime))}</div>
            </div>
          </div>

          <label className="form-label mt-16">Uyku Kalitesi · 1=kötü, 5=harika</label>
          <div className="scale-row">
            {[1, 2, 3, 4, 5].map(v => (
              <button
                key={v}
                className={`scale-btn${quality === v ? ' selected' : ''}`}
                onClick={() => setQuality(v)}
                type="button"
              >{v}</button>
            ))}
          </div>

          <input
            type="text" className="input mt-16"
            value={notes}
            placeholder="Not (opsiyonel): gece uyandım, kabus, huzursuz..."
            onChange={e => setNotes(e.target.value)}
          />
          <div className="mt-16 mb-20">
            <button className="btn btn-primary" type="button" onClick={saveSleep}>Kaydet</button>
          </div>
        </div>
      </div>

      <div className="section-head mt-36">
        Son 14 Gece
        <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Kalite</span>
      </div>
      <div className="card" style={{ padding: '20px 20px 0' }}>
        <div className="sleep-bars">
          {last14.map(d => {
            const e = sleep.find(s => s.date === d);
            if (!e) return (
              <div key={d} className="sleep-bar sleep-bar-empty">
                <div className="sleep-bar-label">{d.slice(8)}</div>
              </div>
            );
            const h = Math.max(10, (e.quality / 5) * 100);
            return (
              <div key={d} className="sleep-bar" style={{ height: `${h}%`, background: qualityColor(e.quality) }}>
                <div className="sleep-bar-val">{e.quality}</div>
                <div className="sleep-bar-label">{d.slice(8)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section-head mt-36">
        Uyku Günlüğü
        <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Geçmiş</span>
      </div>
      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr><th>Tarih</th><th>Faz</th><th>Uyudum</th><th>Uyandım</th><th>Süre</th><th>Kalite</th><th>Not</th></tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan="7" className="empty-cell">Henüz uyku kaydı yok.</td></tr>
            ) : sorted.map((s, i) => {
              const ci = cycleInfo(state, s.date);
              return (
                <tr key={i}>
                  <td className="num-cell">{formatLong(s.date)}</td>
                  <td>{ci ? PHASES[ci.phaseKey].name : '—'}</td>
                  <td>{s.bedtime || '—'}</td>
                  <td>{s.wakeTime || '—'}</td>
                  <td>{fmtDur(s.duration)}</td>
                  <td style={{ color: qualityColor(s.quality), fontFamily: 'var(--f-mono)', fontWeight: 700 }}>
                    {s.quality ? `${s.quality}/5` : '—'}
                  </td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--ink-soft)' }}>
                    {s.notes || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
