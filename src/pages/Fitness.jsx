import { useState } from 'react';
import { cycleInfo, PHASES, today, formatLong, addDays } from '../utils/cycle';
import './Fitness.css';

const TYPES = ['Yürüyüş','Kardio','Güç','Yoga','Pilates','Esneme','HIIT','Diğer'];

export default function Fitness({ appState }) {
  const { state, update } = appState;
  const [date, setDate]       = useState(today());
  const [type, setType]       = useState('Yürüyüş');
  const [min, setMin]         = useState('');
  const [intensity, setInt]   = useState('');
  const [note, setNote]       = useState('');

  const info  = cycleInfo(state);
  const phase = info ? PHASES[info.phaseKey] : null;

  const weekStart = addDays(today(), -7);
  const weekW     = state.workouts.filter(w => w.date >= weekStart);
  const cutoff30  = addDays(today(), -30);
  const recent    = [...state.workouts].filter(w => w.date >= cutoff30).sort((a, b) => b.date.localeCompare(a.date));

  function addWorkout() {
    if (!date || !type) return;
    const entry = { date, type, min: parseInt(min) || 0, intensity: parseInt(intensity) || 3, note };
    update({ workouts: [...state.workouts, entry].sort((a, b) => b.date.localeCompare(a.date)) });
    setMin(''); setInt(''); setNote('');
  }

  function deleteWorkout(i) {
    update({ workouts: state.workouts.filter((_, idx) => idx !== i) });
  }

  function phaseName(d) {
    const ci = cycleInfo(state, d);
    return ci ? PHASES[ci.phaseKey].name : '—';
  }

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="page-head-left">
          <div className="page-eyebrow">Movement</div>
          <h1 className="page-title" data-en="FITNESS">Spor</h1>
        </div>
        <div className="session-tag">Bu Hafta <strong>{weekW.length}x</strong></div>
      </div>

      <div className="card">
        <div className="card-label">Antrenman Ekle</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tarih</label>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Tür</label>
            <select className="select" value={type} onChange={e => setType(e.target.value)}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ maxWidth: 100 }}>
            <label className="form-label">Süre (dk)</label>
            <input type="number" className="input" value={min} placeholder="30" onChange={e => setMin(e.target.value)} />
          </div>
          <div className="form-group" style={{ maxWidth: 100 }}>
            <label className="form-label">Yoğunluk 1-5</label>
            <input type="number" min="1" max="5" className="input" value={intensity} placeholder="3" onChange={e => setInt(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="button" onClick={addWorkout}>Ekle</button>
        </div>
        <div className="form-row mt-12">
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Notlar</label>
            <input type="text" className="input" value={note} placeholder="ör. headstand 2 set, pelvik açma" onChange={e => setNote(e.target.value)} />
          </div>
        </div>
      </div>

      {phase && (
        <>
          <div className="section-head mt-36">
            Faza özel antrenman
            <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6, color: phase.color }}>{phase.name} Fazı</span>
          </div>
          <div className="card">
            <div className="card-inner">
              {phase.fitness.map((t, i) => (
                <div key={i} className="rec-item">
                  <span className="rec-icon">→</span>{t}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="section-head mt-36">
        Antrenman günlüğü
        <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Son 30 gün</span>
      </div>
      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr><th>Tarih</th><th>Tür</th><th>Süre</th><th>Yoğunluk</th><th>Faz</th><th></th></tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr><td colSpan="6" className="empty-cell">Henüz antrenman yok.</td></tr>
            ) : recent.map((w, i) => {
              const realIdx = state.workouts.indexOf(w);
              return (
                <tr key={i}>
                  <td className="num-cell">{formatLong(w.date)}</td>
                  <td>{w.type}</td>
                  <td className="num-cell">{w.min} dk</td>
                  <td>{w.intensity}/5</td>
                  <td>{phaseName(w.date)}</td>
                  <td><button className="micro-btn danger" type="button" onClick={() => deleteWorkout(realIdx)}>Sil</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
