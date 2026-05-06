import { useState } from 'react';
import { cycleInfo, PHASES } from '../utils/cycle';
import './Food.css';

const CATS = ['İçecek','Süt Ürünü','Tahıl','Sebze','Meyve','Protein','Yağ & Tohum','Atıştırmalık','Diğer'];
const PREF_LABELS = { love: 'A · Severim', neutral: '○ Nötr', skip: '× Tercih etmem', react: '! Tepki' };
const PREF_ORDER  = ['love','skip','react','neutral'];

export default function Food({ appState }) {
  const { state, update } = appState;
  const [name, setName] = useState('');
  const [pref, setPref] = useState('neutral');
  const [cat, setCat]   = useState('Diğer');

  const info  = cycleInfo(state);
  const phase = info ? PHASES[info.phaseKey] : null;

  const groups = { love: [], skip: [], react: [], neutral: [] };
  state.foods.forEach(f => groups[f.pref || 'neutral'].push(f));

  function addFood() {
    const n = name.trim();
    if (!n) return;
    if (state.foods.find(f => f.name.toLowerCase() === n.toLowerCase())) return;
    update({ foods: [...state.foods, { name: n, pref, cat, issues: [] }] });
    setName('');
  }

  function setFoodPref(foodName, newPref) {
    update({ foods: state.foods.map(f => f.name === foodName ? { ...f, pref: newPref } : f) });
  }

  function addIssue(foodName) {
    const issue = prompt('Tepki/semptom ekle (ör. baş ağrısı):');
    if (!issue) return;
    update({
      foods: state.foods.map(f =>
        f.name === foodName ? { ...f, pref: 'react', issues: [...(f.issues || []), issue.trim()] } : f
      ),
    });
  }

  function removeIssue(foodName, idx) {
    update({
      foods: state.foods.map(f =>
        f.name === foodName ? { ...f, issues: f.issues.filter((_, i) => i !== idx) } : f
      ),
    });
  }

  function deleteFood(foodName) {
    update({ foods: state.foods.filter(f => f.name !== foodName) });
  }

  const groupLabels = { love: 'A · Sevdiklerim', skip: '× Tercih etmediklerim', react: '! Tepki verdiklerim', neutral: '○ Diğerleri' };

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="page-head-left">
          <div className="page-eyebrow">Personal Library</div>
          <h1 className="page-title" data-en="FOOD">Beslenme</h1>
        </div>
        <div className="session-tag">{state.foods.length} tercih</div>
      </div>

      <div className="card">
        <div className="card-label">Yiyecek / İçecek Ekle</div>
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">Ad</label>
            <input
              type="text" className="input" value={name}
              placeholder="ör. somon, koyu çikolata, papatya çayı"
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addFood()}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tercih</label>
            <select className="select" value={pref} onChange={e => setPref(e.target.value)}>
              {Object.entries(PREF_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Kategori</label>
            <select className="select" value={cat} onChange={e => setCat(e.target.value)}>
              {CATS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" type="button" onClick={addFood}>Ekle</button>
        </div>
      </div>

      {PREF_ORDER.map(key => (
        <div key={key}>
          <div className="section-head mt-28">
            {groupLabels[key]}
            <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>{groups[key].length}</span>
          </div>
          <div className="card food-list-card">
            {groups[key].length === 0 ? (
              <div className="empty-msg">Henüz yok.</div>
            ) : groups[key].map(f => (
              <div key={f.name} className="food-item">
                <div className={`food-pref food-pref-${f.pref || 'neutral'}`}>
                  {f.pref === 'love' ? 'A' : f.pref === 'skip' ? '×' : f.pref === 'react' ? '!' : '○'}
                </div>
                <div className="food-info">
                  <div className="food-name">{f.name}</div>
                  <div className="food-meta">
                    {f.cat}
                    {f.issues && f.issues.length > 0 && (
                      <> · {f.issues.map((iss, i) => (
                        <span key={i} className="issue-tag" onClick={() => removeIssue(f.name, i)} title="kaldır">
                          {iss}
                        </span>
                      ))}</>
                    )}
                  </div>
                </div>
                <div className="food-actions">
                  <select
                    className="select select-sm"
                    value={f.pref || 'neutral'}
                    onChange={e => setFoodPref(f.name, e.target.value)}
                  >
                    {Object.entries(PREF_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <button className="micro-btn" type="button" onClick={() => addIssue(f.name)}>+ Tepki</button>
                  <button className="micro-btn danger" type="button" onClick={() => deleteFood(f.name)}>Sil</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {phase && (
        <>
          <div className="section-head mt-36">
            Bu fazda öneriler
            <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Senin için</span>
          </div>
          <div className="page-grid grid-2">
            <div className="card">
              <div className="card-label">Tüket</div>
              <div className="card-inner">
                {phase.food.map((t, i) => (
                  <div key={i} className="rec-item"><span className="rec-icon">+</span>{t}</div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-label">Sınırla</div>
              <div className="card-inner">
                {(phase.foodBad || []).map((t, i) => (
                  <div key={i} className="rec-item"><span className="rec-icon" style={{ color: 'var(--jazz-red)' }}>−</span>{t}</div>
                ))}
                {groups.react.map(f => (
                  <div key={f.name} className="rec-item">
                    <span className="rec-icon" style={{ color: 'var(--jazz-orange)' }}>!</span>
                    {f.name}
                    {f.issues && f.issues.length > 0 && <span style={{ color: 'var(--ink-faint)', fontSize: '11px' }}> · {f.issues.join(', ')}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
