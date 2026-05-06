import { useState } from 'react';
import { today, formatLong, addDays } from '../utils/cycle';
import './Supplements.css';

const COMMON_SUPS = [
  { name: 'D Vitamini', dose: '1000 IU' },
  { name: 'Omega-3',    dose: '1000 mg' },
  { name: 'Magnezyum',  dose: '300 mg' },
  { name: 'B12',        dose: '1000 mcg' },
  { name: 'Demir',      dose: '14 mg' },
  { name: 'Çinko',      dose: '15 mg' },
  { name: 'Probiyotik', dose: '1 kapsül' },
  { name: 'Folik Asit', dose: '400 mcg' },
  { name: 'C Vitamini', dose: '500 mg' },
  { name: 'B6',         dose: '25 mg' },
];

const TIMES = ['Sabah', 'Öğle', 'Akşam', 'Yatmadan önce'];

export default function Supplements({ appState }) {
  const { state, update } = appState;
  const [name, setName]   = useState('');
  const [dose, setDose]   = useState('');
  const [time, setTime]   = useState('Sabah');
  const [notes, setNotes] = useState('');
  const [schedName, setSchedName] = useState('');
  const [schedDose, setSchedDose] = useState('');
  const [schedTime, setSchedTime] = useState('Sabah');

  const supplements   = state.supplements  || [];
  const supSchedule   = state.supSchedule  || [];
  const todayDate     = today();
  const todayEntries  = supplements.filter(s => s.date === todayDate);

  function logSupplement(n, d, t) {
    const newSup = { date: todayDate, name: n, dose: d || '', time: t || '', notes: '' };
    update({ supplements: [...supplements, newSup] });
  }

  function addManual() {
    const n = name.trim();
    if (!n) return;
    logSupplement(n, dose.trim(), time);
    setName(''); setDose(''); setNotes('');
  }

  function addToSchedule() {
    const n = schedName.trim();
    if (!n) return;
    const already = supSchedule.find(s => s.name.toLowerCase() === n.toLowerCase());
    if (already) return;
    const newSched = [...supSchedule, { name: n, dose: schedDose.trim(), time: schedTime, active: true }];
    update({ supSchedule: newSched });
    setSchedName(''); setSchedDose('');
  }

  function removeScheduled(i) {
    update({ supSchedule: supSchedule.filter((_, idx) => idx !== i) });
  }

  function deleteTodayEntry(i) {
    update({ supplements: supplements.filter((_, idx) => idx !== i) });
  }

  // Compute last 14 days × supplement names from schedule
  const last14 = Array.from({ length: 14 }, (_, i) => addDays(todayDate, -(13 - i)));
  const schedNames = supSchedule.map(s => s.name);

  // Group history by date for table
  const byDate = {};
  supplements.forEach((s, idx) => {
    if (!byDate[s.date]) byDate[s.date] = [];
    byDate[s.date].push({ ...s, _idx: idx });
  });
  const historyDates = Object.keys(byDate).sort().reverse().slice(0, 30);

  // Today stats
  const uniqueToday = [...new Set(todayEntries.map(s => s.name))];
  const totalLogged  = supplements.length;

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="page-head-left">
          <div className="page-eyebrow">Daily Tracker</div>
          <h1 className="page-title" data-en="SUPPLEMENTS">Takviyeler</h1>
        </div>
        <div className="session-tag">
          Bugün <strong>{uniqueToday.length}</strong> takviye
        </div>
      </div>

      {/* Quick log from schedule */}
      {supSchedule.length > 0 && (
        <div className="card">
          <div className="card-label">
            <span>Bugün al</span>
            <span>Programa göre</span>
          </div>
          <div className="sup-quick-chips">
            {supSchedule.map((s, i) => {
              const taken = todayEntries.some(e => e.name === s.name);
              return (
                <button
                  key={i}
                  className={`sup-chip${taken ? ' taken' : ''}`}
                  type="button"
                  onClick={() => !taken && logSupplement(s.name, s.dose, s.time)}
                  disabled={taken}
                >
                  <span className="sup-chip-name">{s.name}</span>
                  {s.dose && <span className="sup-chip-dose">{s.dose}</span>}
                  {taken && <span className="sup-chip-check">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual log */}
      <div className="card">
        <div className="card-label">Manuel Ekle</div>

        <div className="sup-common">
          <div className="sup-common-label">Hızlı seç</div>
          <div className="sup-common-chips">
            {COMMON_SUPS.map(s => (
              <button
                key={s.name}
                className="sup-common-chip"
                type="button"
                onClick={() => { setName(s.name); setDose(s.dose); }}
              >{s.name}</button>
            ))}
          </div>
        </div>

        <div className="form-row mt-16">
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">Takviye Adı</label>
            <input
              type="text"
              className="input"
              value={name}
              placeholder="ör. D Vitamini, Magnezyum"
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addManual()}
            />
          </div>
          <div className="form-group" style={{ maxWidth: 140 }}>
            <label className="form-label">Doz</label>
            <input
              type="text"
              className="input"
              value={dose}
              placeholder="ör. 1000 IU"
              onChange={e => setDose(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ maxWidth: 160 }}>
            <label className="form-label">Zaman</label>
            <select className="select" value={time} onChange={e => setTime(e.target.value)}>
              {TIMES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" type="button" onClick={addManual}>Kaydet</button>
        </div>
      </div>

      {/* Today's log */}
      {todayEntries.length > 0 && (
        <>
          <div className="section-head mt-36">
            Bugün alınanlar
            <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>{formatLong(todayDate)}</span>
          </div>
          <div className="card">
            {todayEntries.map((s, i) => {
              const realIdx = supplements.indexOf(s);
              return (
                <div key={i} className="sup-entry">
                  <div className="sup-entry-dot" />
                  <div className="sup-entry-name">{s.name}</div>
                  {s.dose && <div className="sup-entry-dose">{s.dose}</div>}
                  {s.time && <div className="sup-entry-time">{s.time}</div>}
                  <button className="micro-btn danger" type="button" onClick={() => deleteTodayEntry(realIdx)}>Sil</button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Supplement schedule manager */}
      <div className="section-head mt-36">
        Rutin Program
        <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Her gün hatırlatır</span>
      </div>
      <div className="card">
        <div className="card-label">Programa Ekle</div>
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">Takviye</label>
            <input
              type="text"
              className="input"
              value={schedName}
              placeholder="ör. Omega-3"
              onChange={e => setSchedName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addToSchedule()}
            />
          </div>
          <div className="form-group" style={{ maxWidth: 140 }}>
            <label className="form-label">Doz</label>
            <input
              type="text"
              className="input"
              value={schedDose}
              placeholder="isteğe bağlı"
              onChange={e => setSchedDose(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ maxWidth: 160 }}>
            <label className="form-label">Zaman</label>
            <select className="select" value={schedTime} onChange={e => setSchedTime(e.target.value)}>
              {TIMES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <button className="btn" type="button" onClick={addToSchedule}>+ Ekle</button>
        </div>

        {supSchedule.length > 0 ? (
          <div className="sup-schedule-list mt-16">
            {supSchedule.map((s, i) => (
              <div key={i} className="sup-schedule-item">
                <div className="sup-schedule-dot" />
                <div className="sup-schedule-name">{s.name}</div>
                {s.dose && <div className="sup-schedule-dose">{s.dose}</div>}
                <div className="sup-schedule-time">{s.time}</div>
                <button className="micro-btn" type="button" onClick={() => removeScheduled(i)}>Kaldır</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-msg">Program henüz boş — takviyelerini ekle, her gün hızlıca kaydet.</div>
        )}
      </div>

      {/* 14-day adherence grid */}
      {schedNames.length > 0 && (
        <>
          <div className="section-head mt-36">
            14 Günlük Uyum
            <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Program takibi</span>
          </div>
          <div className="card">
            <div className="sup-grid">
              <div className="sup-grid-header">
                <div className="sup-grid-name-col" />
                {last14.map(d => (
                  <div key={d} className="sup-grid-day-label">{d.slice(8)}</div>
                ))}
              </div>
              {schedNames.map(sn => (
                <div key={sn} className="sup-grid-row">
                  <div className="sup-grid-name-col">{sn}</div>
                  {last14.map(d => {
                    const taken = supplements.some(s => s.date === d && s.name === sn);
                    return (
                      <div key={d} className={`sup-grid-cell${taken ? ' taken' : ''}`}>
                        {taken ? '✓' : '·'}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* History */}
      {historyDates.length > 0 && (
        <>
          <div className="section-head mt-36">
            Geçmiş
            <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>{totalLogged} kayıt</span>
          </div>
          <div className="card table-card">
            <table className="data-table">
              <thead>
                <tr><th>Tarih</th><th>Takviye</th><th>Doz</th><th>Zaman</th></tr>
              </thead>
              <tbody>
                {historyDates.flatMap(d =>
                  byDate[d].map((s, j) => (
                    <tr key={`${d}-${j}`}>
                      <td className="num-cell">{formatLong(d)}</td>
                      <td>{s.name}</td>
                      <td>{s.dose || '—'}</td>
                      <td>{s.time || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
