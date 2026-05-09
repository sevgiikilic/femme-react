import { useState } from 'react';
import { cycleInfo, PHASES } from '../utils/cycle';
import './Food.css';

const CATS = ['İçecek','Süt Ürünü','Tahıl','Sebze','Meyve','Protein','Yağ & Tohum','Atıştırmalık','Diğer'];
const PREFS = ['love','skip','neutral'];
const PREF_LABELS = { love: 'Severim', skip: 'Sevmiyorum', neutral: 'Nötr' };
const PREF_ORDER  = ['love','skip','neutral'];

const CAT_MAP = {
  'Süt Ürünü': ['süt','peynir','yoğurt','kefir','tereyağ','krema','ayran','lor','labne','kaşar','mozzarella','parmesan'],
  'Tahıl':     ['ekmek','makarna','pirinç','bulgur','yulaf','müsli','granola','bisküvi','kraker','tortilla','un'],
  'Sebze':     ['brokoli','ıspanak','domates','salatalık','biber','soğan','sarımsak','havuç','patlıcan','kabak','bezelye','mısır','lahana','marul','roka','mantar','pancar','bamya'],
  'Meyve':     ['elma','muz','portakal','çilek','üzüm','armut','kiraz','mandalina','kivi','kavun','karpuz','şeftali','mango','ananas','erik','incir','nar','böğürtlen','ahududu'],
  'Protein':   ['tavuk','et','balık','somon','ton','yumurta','mercimek','nohut','fasulye','tofu','tempeh','soya','dana','kuzu','hindi','karides'],
  'Yağ & Tohum': ['zeytinyağı','ceviz','badem','fındık','kaju','chia','keten','avokado','fıstık','susam','tahini'],
  'İçecek':    ['çay','kahve','su','meyve suyu','smoothie','bitki','yeşil çay','kombucha','limonata'],
  'Atıştırmalık': ['çikolata','dondurma','kek','kurabiye','pasta','tatlı','cips','gofret','şeker','lokum','baklava'],
};

function detectCategory(name) {
  const n = name.toLowerCase();
  for (const [cat, keys] of Object.entries(CAT_MAP)) {
    if (keys.some(k => n.includes(k))) return cat;
  }
  return 'Diğer';
}

export default function Food({ appState }) {
  const { state, update } = appState;
  const [name, setName]           = useState('');
  const [pref, setPref]           = useState('neutral');
  const [cat, setCat]             = useState('Diğer');
  const [catAuto, setCatAuto]     = useState(true);
  const [hasReact, setHasReact]   = useState(false);
  const [reactNote, setReactNote] = useState('');

  const info  = cycleInfo(state);
  const phase = info ? PHASES[info.phaseKey] : null;

  // group: 'react' legacy → treated as 'skip' visually
  const groups = { love: [], skip: [], neutral: [] };
  state.foods.forEach(f => {
    const g = (f.pref === 'react') ? 'skip' : (f.pref || 'neutral');
    if (groups[g]) groups[g].push(f);
  });

  function handleNameChange(val) {
    setName(val);
    if (catAuto) setCat(detectCategory(val) || 'Diğer');
  }

  function addFood() {
    const n = name.trim();
    if (!n) return;
    if (state.foods.find(f => f.name.toLowerCase() === n.toLowerCase())) return;
    const issues = (hasReact && reactNote.trim()) ? [reactNote.trim()] : [];
    update({ foods: [...state.foods, { name: n, pref, cat, issues }] });
    setName(''); setHasReact(false); setReactNote('');
    if (catAuto) setCat('Diğer');
  }

  function setFoodPref(foodName, newPref) {
    update({ foods: state.foods.map(f => f.name === foodName ? { ...f, pref: newPref } : f) });
  }

  function toggleReact(foodName) {
    const food = state.foods.find(f => f.name === foodName);
    if (!food) return;
    if (food.issues?.length) {
      update({ foods: state.foods.map(f => f.name === foodName ? { ...f, issues: [] } : f) });
    } else {
      const note = prompt('Tepki/semptom nedir? (ör. baş ağrısı, şişkinlik)');
      if (!note) return;
      update({ foods: state.foods.map(f => f.name === foodName ? { ...f, issues: [note.trim()] } : f) });
    }
  }

  function addIssue(foodName) {
    const issue = prompt('Tepki/semptom ekle:');
    if (!issue) return;
    update({
      foods: state.foods.map(f =>
        f.name === foodName ? { ...f, issues: [...(f.issues || []), issue.trim()] } : f
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

  const groupLabels = { love: 'Severim', skip: 'Sevmiyorum', neutral: 'Nötr' };

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
        <div style={{ padding: '16px 20px 20px' }}>
          <div className="form-row" style={{ alignItems: 'flex-start' }}>
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Ad</label>
              <input
                type="text" className="input" value={name}
                placeholder="ör. somon, koyu çikolata, papatya çayı"
                onChange={e => handleNameChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addFood()}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Kategori {catAuto && <span style={{ color: 'var(--crystal)', fontSize: '8px' }}>OTO</span>}</label>
              <select className="select" value={cat} onChange={e => { setCat(e.target.value); setCatAuto(false); }}>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="pref-row">
            <span className="pref-row-label">Tercih:</span>
            {PREFS.map(p => (
              <button
                key={p}
                type="button"
                className={`pref-btn pref-btn-${p}${pref === p ? ' active' : ''}`}
                onClick={() => setPref(p)}
              >
                {PREF_LABELS[p]}
              </button>
            ))}
            <label className="react-check">
              <input type="checkbox" checked={hasReact} onChange={e => setHasReact(e.target.checked)} />
              <span>Tepki var</span>
            </label>
          </div>

          {hasReact && (
            <input
              type="text" className="input mt-8"
              value={reactNote}
              placeholder="ör. baş ağrısı, şişkinlik, kaşıntı..."
              onChange={e => setReactNote(e.target.value)}
            />
          )}

          <button className="btn btn-primary mt-12" type="button" onClick={addFood}>Ekle</button>
        </div>
      </div>

      {PREF_ORDER.map(key => (
        <div key={key}>
          <div className="section-head mt-28">
            <span className={`pref-dot pref-dot-${key}`} />
            {groupLabels[key]}
            <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>{groups[key].length}</span>
          </div>
          <div className="card food-list-card">
            {groups[key].length === 0 ? (
              <div className="empty-msg">Henüz yok.</div>
            ) : groups[key].map(f => (
              <div key={f.name} className="food-item">
                <div className={`food-pref food-pref-${(f.pref === 'react' ? 'skip' : f.pref) || 'neutral'}`}>
                  {f.pref === 'love' ? '♡' : f.pref === 'skip' || f.pref === 'react' ? '×' : '○'}
                </div>
                <div className="food-info">
                  <div className="food-name">
                    {f.name}
                    {f.issues?.length > 0 && (
                      <span className="react-badge" title={f.issues.join(', ')}>! tepki</span>
                    )}
                  </div>
                  <div className="food-meta">
                    {f.cat}
                    {f.issues?.length > 0 && (
                      <> · {f.issues.map((iss, i) => (
                        <span key={i} className="issue-tag" onClick={() => removeIssue(f.name, i)} title="kaldırmak için tıkla">
                          {iss}
                        </span>
                      ))}</>
                    )}
                  </div>
                </div>
                <div className="food-actions">
                  <div className="pref-mini-row">
                    {PREFS.map(p => (
                      <button
                        key={p}
                        type="button"
                        className={`pref-mini pref-mini-${p}${(f.pref === p || (f.pref === 'react' && p === 'skip')) ? ' active' : ''}`}
                        onClick={() => setFoodPref(f.name, p)}
                        title={PREF_LABELS[p]}
                      >
                        {p === 'love' ? '♡' : p === 'skip' ? '×' : '○'}
                      </button>
                    ))}
                  </div>
                  <button className="micro-btn" type="button" onClick={() => addIssue(f.name)} title="Tepki ekle">+!</button>
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
                {state.foods.filter(f => f.issues?.length).map(f => (
                  <div key={f.name} className="rec-item">
                    <span className="rec-icon" style={{ color: 'var(--jazz-orange)' }}>!</span>
                    {f.name}
                    <span style={{ color: 'var(--ink-faint)', fontSize: '11px' }}> · {f.issues.join(', ')}</span>
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
