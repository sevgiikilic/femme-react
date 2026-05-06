import { useState } from 'react';
import { cycleInfo, PHASES, today, formatLong } from '../utils/cycle';
import './Symptoms.css';

export default function Symptoms({ appState }) {
  const { state, update } = appState;
  const [customInput, setCustomInput] = useState('');

  const info = cycleInfo(state);
  const phase = info ? PHASES[info.phaseKey] : null;
  const log = state.days[today()] || {};
  const selected = new Set(log.symptoms || []);

  const otherSymptoms = phase
    ? [...new Set(
        Object.entries(PHASES)
          .filter(([k]) => k !== info.phaseKey)
          .flatMap(([, p]) => p.symptoms)
          .filter(s => !phase.symptoms.includes(s))
      )]
    : Object.values(PHASES).flatMap(p => p.symptoms);

  function updateDay(patch) {
    const day = state.days[today()] || {};
    update({ days: { ...state.days, [today()]: { ...day, ...patch } } });
  }

  function toggleSymptom(s) {
    const day = state.days[today()] || {};
    const syms = new Set(day.symptoms || []);
    if (syms.has(s)) syms.delete(s); else syms.add(s);
    update({ days: { ...state.days, [today()]: { ...day, symptoms: [...syms] } } });
  }

  function addCustom() {
    const val = customInput.trim();
    if (!val) return;
    const customs = [...new Set([...(state.customSymptoms || []), val])];
    update({ customSymptoms: customs });
    setCustomInput('');
    toggleSymptom(val);
  }

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="page-head-left">
          <div className="page-eyebrow">Daily Log</div>
          <h1 className="page-title" data-en="SYMPTOMS">Semptomlar</h1>
        </div>
        <div className="session-tag">
          {formatLong(today())}
          {phase && <strong style={{ color: phase.color }}>{phase.name}</strong>}
        </div>
      </div>

      <div className="card">
        <div className="card-label">
          <span>Bugün için seç</span>
          <span>Otomatik kaydedilir</span>
        </div>

        {phase && (
          <>
            <div className="chip-cat">
              <span className="chip-cat-icon">C</span> Bu fazda yaygın
            </div>
            <div className="chip-group">
              {phase.symptoms.map(s => (
                <button
                  key={s}
                  className={`chip${selected.has(s) ? ' selected' : ''}`}
                  onClick={() => toggleSymptom(s)}
                  type="button"
                >{s}</button>
              ))}
            </div>
          </>
        )}

        <div className="chip-cat">
          <span className="chip-cat-icon">C</span> Diğer
        </div>
        <div className="chip-group">
          {otherSymptoms.map(s => (
            <button
              key={s}
              className={`chip${selected.has(s) ? ' selected' : ''}`}
              onClick={() => toggleSymptom(s)}
              type="button"
            >{s}</button>
          ))}
        </div>

        {state.customSymptoms && state.customSymptoms.length > 0 && (
          <>
            <div className="chip-cat">
              <span className="chip-cat-icon">C</span> Özel
            </div>
            <div className="chip-group">
              {state.customSymptoms.map(s => (
                <button
                  key={s}
                  className={`chip chip-custom${selected.has(s) ? ' selected' : ''}`}
                  onClick={() => toggleSymptom(s)}
                  type="button"
                >{s}</button>
              ))}
            </div>
          </>
        )}

        <div className="form-label mt-16">Kendi Semptomunu Ekle</div>
        <div className="sym-add-row">
          <input
            type="text"
            className="input"
            value={customInput}
            placeholder="ör. tatlı krizi, ağız aft"
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustom()}
          />
          <button className="btn" type="button" onClick={addCustom}>· Ekle</button>
        </div>
      </div>

      <div className="section-head mt-36">
        Ruh hali &amp; enerji
        <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Scale 1—5</span>
      </div>
      <div className="page-grid grid-2">
        <div className="card">
          <div className="card-label">Ruh Hali · 1=düşük, 5=harika</div>
          <div className="scale-row">
            {[1,2,3,4,5].map(v => (
              <button
                key={v}
                className={`scale-btn${log.mood === v ? ' selected' : ''}`}
                onClick={() => updateDay({ mood: v })}
                type="button"
              >{v}</button>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-label">Enerji · 1=tükenmiş, 5=zinde</div>
          <div className="scale-row">
            {[1,2,3,4,5].map(v => (
              <button
                key={v}
                className={`scale-btn${log.energy === v ? ' selected' : ''}`}
                onClick={() => updateDay({ energy: v })}
                type="button"
              >{v}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="card mt-24">
        <div className="card-label">
          <span>Notlar</span>
          <span>Yazarken otomatik kaydedilir</span>
        </div>
        <textarea
          className="textarea"
          value={log.notes || ''}
          placeholder="Bugüne dair gözlemlerin..."
          onChange={e => updateDay({ notes: e.target.value })}
        />
      </div>
    </div>
  );
}
