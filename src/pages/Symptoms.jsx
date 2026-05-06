import { useState, useRef } from 'react';
import { cycleInfo, PHASES, today, formatLong } from '../utils/cycle';
import './Symptoms.css';

const SYMPTOM_TIPS = {
  'Kramp':            'Kramplar için sıcak kompres, magnezyum veya nane çayı dene.',
  'Baş ağrısı':       'Bol su, karanlık ortam ve biraz dinlenme baş ağrısını hafifletebilir.',
  'Şişkinlik':        'Zencefil çayı, az tuz ve hafif yürüyüş şişkinliği azaltır.',
  'Yorgunluk':        'Bu yorgunluk döngüsel — bedenin enerji biriktiriyor.',
  'Duygusallık':      'Bu duygu gerçek ama geçici — döngünün bir dalgası, sen değil.',
  'Sinirlilik':       'Luteal fazda sinirlilik hormonal — kendini yargılama.',
  'Akne / Sivilce':   'Hormonal sivilce için çinko ve niyasinamid etkili olabilir.',
  'Ağrılı göğüs':     'Kafein azaltmak ve doğru beden bu şikayeti hafifletebilir.',
  'Bel ağrısı':       'Hafif yürüyüş veya yoga bel ağrısına iyi gelir.',
  'Ruh hali değişimi':'Bu değişimler döngüseldir — bedeninin doğal ritmi.',
  'İştah artışı':     'Luteal fazda iştah artışı normal — kendinle nazik ol.',
  'Bulantı':          'Zencefil çayı veya tuzlu bir şeyler bulantıya yardımcı olabilir.',
  'Uyku bozukluğu':   'Progesteronun uyku üzerindeki etkisi gerçek — erken yatmayı dene.',
};

// Symptoms that are inherently negative — always respond with support, never phase hype
const NEGATIVE_SYMPTOMS = new Set([
  'Kramp', 'Baş ağrısı', 'Şişkinlik', 'Yorgunluk', 'Duygusallık', 'Sinirlilik',
  'Akne / Sivilce', 'Ağrılı göğüs', 'Bel ağrısı', 'Ruh hali değişimi', 'İştah artışı',
  'Bulantı', 'Uyku bozukluğu', 'Konsantrasyon güçlüğü', 'Su tutma', 'Gerginlik', 'Kaygı',
]);

const SUPPORT_MSGS = [
  'Böyle hissetmen çok normal, özellikle bu dönemde.',
  'Bugün biraz zor geçiyor olabilir — kendine nazik ol.',
  'Bu duygu geçici, yalnız değilsin.',
  'Bedenin sana bir şey anlatıyor — onu dinlemek önemli.',
  'Bu deneyim döngünün bir parçası ve geçecek.',
  'Kendine iyi bak bugün — bunu hak ediyorsun.',
];

const POSITIVE_MSGS = [
  'Enerjin çok güzel görünüyor bugün.',
  'Bunu hissettiğin günleri fark etmek çok değerli.',
  'Bu hissin tadını çıkar — bedenin iyi hissediyor.',
  'Harika bir gün gibi görünüyor.',
  'Bu enerjiyi kendin için kullan.',
];

function getMoodInsight(state, phaseKey, currentMood) {
  const phaseMoods = Object.entries(state.days)
    .map(([date, d]) => {
      if (d.mood == null) return null;
      const ci = cycleInfo(state, date);
      return ci && ci.phaseKey === phaseKey ? Number(d.mood) : null;
    }).filter(m => m !== null);

  if (phaseMoods.length < 3) return null;

  const lowPct  = Math.round(phaseMoods.filter(m => m <= 2).length / phaseMoods.length * 100);
  const highPct = Math.round(phaseMoods.filter(m => m >= 4).length / phaseMoods.length * 100);

  if (currentMood <= 2 && lowPct >= 40)
    return { type: 'support', msg: `Önceki ${PHASES[phaseKey].name} dönemlerinin %${lowPct}'inde de düşük ruh hali kaydettin — bu döngü kökenli ve geçici.` };
  if (currentMood >= 4 && highPct >= 40)
    return { type: 'cheer', msg: `${PHASES[phaseKey].name} fazında genellikle iyi hissediyorsun — kayıtlarının %${highPct}'i de böyle. Bu enerji sana özgü!` };
  return null;
}

export default function Symptoms({ appState }) {
  const { state, update } = appState;
  const [customInput, setCustomInput] = useState('');
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const info  = cycleInfo(state);
  const phase = info ? PHASES[info.phaseKey] : null;
  const log   = state.days[today()] || {};
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

  function showToast(msg, type = 'info') {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }

  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function toggleSymptom(s) {
    const day = state.days[today()] || {};
    const syms = new Set(day.symptoms || []);
    const adding = !syms.has(s);
    if (adding) syms.add(s); else syms.delete(s);
    update({ days: { ...state.days, [today()]: { ...day, symptoms: [...syms] } } });
    if (!adding) return;
    const tip = SYMPTOM_TIPS[s];
    if (tip) {
      // SYMPTOM_TIPS are already empathetic — always show them
      showToast(tip, NEGATIVE_SYMPTOMS.has(s) ? 'support' : 'info');
    } else if (NEGATIVE_SYMPTOMS.has(s)) {
      // Never show positive/phase-hype for a negative symptom
      showToast(rand(SUPPORT_MSGS), 'support');
    }
    // For unknown/neutral symptoms, show nothing — silence is better than wrong tone
  }

  function handleMood(v) {
    updateDay({ mood: v });
    if (info) {
      const insight = getMoodInsight(state, info.phaseKey, v);
      if (insight) { showToast(insight.msg, insight.type); return; }
    }
    if (v <= 2) showToast(rand(SUPPORT_MSGS), 'support');
    else if (v >= 4) showToast(rand(POSITIVE_MSGS));
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
                onClick={() => handleMood(v)}
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

      {toast && (
        <div className="toast-stack">
          <div className={`toast${toast.type === 'support' ? ' support' : ''}`}>
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}
