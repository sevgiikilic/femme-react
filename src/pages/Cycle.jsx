import { useState } from 'react';
import { cycleInfo, PHASES, today, formatLong, daysBetween } from '../utils/cycle';
import './Cycle.css';

const NUMERALS = ['I','II','III','IV'];

export default function Cycle({ appState }) {
  const { state, update } = appState;
  const [start, setStart]   = useState(today());
  const [length, setLength] = useState('5');
  const [flow, setFlow]     = useState('orta');

  const info = cycleInfo(state);
  const sorted = [...state.periods].sort((a, b) => b.start.localeCompare(a.start));

  const avgLen = (() => {
    if (sorted.length < 2) return state.avgCycle;
    const diffs = [];
    for (let i = 0; i < sorted.length - 1; i++)
      diffs.push(daysBetween(sorted[i + 1].start, sorted[i].start));
    return Math.round(diffs.reduce((s, d) => s + d, 0) / diffs.length);
  })();

  const accuracy = sorted.length < 2 ? 'Düşük' : sorted.length < 4 ? 'Orta' : 'Yüksek';

  function addPeriod() {
    if (!start) return;
    const exists = state.periods.find(p => p.start === start);
    if (exists) return;
    update({ periods: [...state.periods, { start, length: parseInt(length) || 5, flow }] });
    setStart(today()); setLength('5');
  }

  function deletePeriod(s) {
    update({ periods: state.periods.filter(p => p.start !== s) });
  }

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="page-head-left">
          <div className="page-eyebrow">Cycle Log</div>
          <h1 className="page-title" data-en="CYCLE">Döngü</h1>
        </div>
        <div className="session-tag">
          {sorted.length} kayıt · {avgLen}g ort.
        </div>
      </div>

      <div className="card">
        <div className="card-label">Yeni Adet Kaydı</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Başlangıç Tarihi</label>
            <input type="date" className="input" value={start} onChange={e => setStart(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Süre (gün)</label>
            <input type="number" min="1" max="10" className="input" value={length} onChange={e => setLength(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Akış</label>
            <select className="select" value={flow} onChange={e => setFlow(e.target.value)}>
              <option value="hafif">Hafif</option>
              <option value="orta">Orta</option>
              <option value="ağır">Ağır</option>
            </select>
          </div>
          <button className="btn btn-primary" type="button" onClick={addPeriod}>Ekle</button>
        </div>
      </div>

      <div className="cycle-stats">
        <div className="cycle-stat-card">
          <div className="cycle-stat-label">Ortalama Döngü</div>
          <div className="cycle-stat-val">{avgLen}<span>g</span></div>
          <div className="cycle-stat-sub">{accuracy} kesinlik</div>
        </div>
        <div className="cycle-stat-card">
          <div className="cycle-stat-label">Kayıt Sayısı</div>
          <div className="cycle-stat-val">{sorted.length}</div>
          <div className="cycle-stat-sub">{accuracy === 'Yüksek' ? 'Güvenilir tahmin' : 'Daha fazla kayıt ekle'}</div>
        </div>
        {info && (
          <div className="cycle-stat-card">
            <div className="cycle-stat-label">Mevcut Faz</div>
            <div className="cycle-stat-val" style={{ color: PHASES[info.phaseKey].color }}>
              {PHASES[info.phaseKey].name}
            </div>
            <div className="cycle-stat-sub">Gün {info.dayInCycle} / {info.avgC}</div>
          </div>
        )}
      </div>

      <div className="section-head mt-36">
        Adet Geçmişi
        <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Tüm kayıtlar</span>
      </div>
      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr><th>Başlangıç</th><th>Süre</th><th>Akış</th><th>Döngü Uzunluğu</th><th></th></tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan="5" className="empty-cell">Henüz kayıt yok.</td></tr>
            ) : sorted.map((p, i) => {
              const prev = sorted[i + 1];
              const cycLen = prev ? daysBetween(prev.start, p.start) : '—';
              return (
                <tr key={p.start}>
                  <td className="num-cell">{formatLong(p.start)}</td>
                  <td>{p.length || '—'} gün</td>
                  <td>{p.flow || '—'}</td>
                  <td>{typeof cycLen === 'number' ? `${cycLen} gün` : cycLen}</td>
                  <td>
                    <button className="micro-btn danger" type="button" onClick={() => deletePeriod(p.start)}>Sil</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="section-head mt-36">
        Faz Rehberi
        <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>4 faz</span>
      </div>
      {Object.entries(PHASES).map(([key, p], i) => (
        <div key={key} className={`phase-card${info?.phaseKey === key ? ' active' : ''}`} style={{ borderColor: p.color }}>
          <div className="phase-card-head" style={{ background: p.color }}>
            <span className="phase-roman">{NUMERALS[i]}</span>
            <span className="phase-name">{p.name}</span>
            <span className="phase-days">{p.days}. gün</span>
          </div>
          <div className="phase-card-body">
            <p className="phase-desc">{p.desc}</p>
            <div className="phase-recs">
              <div>
                <div className="phase-rec-label">Beslenme</div>
                {p.food.map((f, j) => <div key={j} className="phase-rec-item">+ {f}</div>)}
              </div>
              <div>
                <div className="phase-rec-label">Spor</div>
                {p.fitness.map((f, j) => <div key={j} className="phase-rec-item">→ {f}</div>)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
