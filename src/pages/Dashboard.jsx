import { useState } from 'react';
import { cycleInfo, PHASES, today, formatLong, formatShort, addDays } from '../utils/cycle';
import './Dashboard.css';

// ── Cycle Ring SVG ────────────────────────────────────
function CycleRing({ day, total, phase }) {
  const R = 86;
  const circumference = 2 * Math.PI * R;
  const progress = total > 0 ? circumference * (day / total) : 0;
  const offset = circumference - progress;
  const phaseData = PHASES[phase] || PHASES.follicular;

  const ticks = [0, 90, 180, 270].map(angle => {
    const rad = (angle - 90) * (Math.PI / 180);
    const x1 = 100 + 92 * Math.cos(rad), y1 = 100 + 92 * Math.sin(rad);
    const x2 = 100 + 98 * Math.cos(rad), y2 = 100 + 98 * Math.sin(rad);
    return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1.5" opacity="0.4" />;
  });

  return (
    <div className="ring-wrap">
      <svg viewBox="0 0 200 200" className="ring-svg">
        {ticks}
        <circle cx="100" cy="100" r={R} fill="none" stroke="currentColor" strokeWidth="1" opacity="0.15" />
        <circle cx="100" cy="100" r={R} fill="none" stroke={phaseData.color} strokeWidth="3"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 100 100)" strokeLinecap="square" />
        {[[-94,0],[94,0],[0,-94],[0,94]].map(([dx,dy], i) => (
          <circle key={i} cx={100+dx} cy={100+dy} r="2" fill={phaseData.color} opacity="0.6" />
        ))}
      </svg>
      <div className="ring-center">
        <div className="ring-day-num">{day}</div>
        <div className="ring-day-label">CYCLE DAY</div>
      </div>
    </div>
  );
}

// ── Onboarding Modal ──────────────────────────────────
function OnboardModal({ onComplete }) {
  const [last, setLast]     = useState(today());
  const [cycle, setCycle]   = useState('28');
  const [period, setPeriod] = useState('5');

  function handleSubmit(e) {
    e.preventDefault();
    if (!last) return;
    onComplete({ last, cycle: parseInt(cycle) || 28, period: parseInt(period) || 5 });
  }

  return (
    <div className="onboard-overlay">
      <div className="onboard-modal">
        <div className="onboard-head">
          <span>Femme — İlk Kurulum</span>
          <span>★</span>
        </div>
        <div className="onboard-body">
          <div className="onboard-title">Merhaba,</div>
          <p style={{ fontFamily: 'var(--f-body)', fontSize: '14px', color: 'var(--ink-soft)', marginBottom: '24px', lineHeight: '1.6' }}>
            Döngünü takip etmek için birkaç bilgiye ihtiyacım var.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Son Adet Başlangıç Tarihi</label>
              <input type="date" className="input" value={last} onChange={e => setLast(e.target.value)} required />
            </div>
            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label">Ortalama Döngü (gün)</label>
                <input type="number" className="input" min="20" max="45" value={cycle} onChange={e => setCycle(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Ortalama Adet Süresi (gün)</label>
                <input type="number" className="input" min="1" max="10" value={period} onChange={e => setPeriod(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>Başla →</button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Split Banner ──────────────────────────────────────
const BANNERS = {
  menstrual:  { left: { tag: '01 — ağır', text: 'Bedenine izin ver · dinlen · geç' }, right: { tag: 'half moon', text: 'Bugün güçsün — sadece fark farklı' } },
  follicular: { left: { tag: '02 — yükseliş', text: 'Yeni döngü · taze enerji · başla' }, right: { tag: 'waxing', text: 'Ay yenileniyor — sen de yenileniyorsun' } },
  ovulation:  { left: { tag: '03 — zirve', text: 'Zirve noktanda · parlıyorsun · şimdi' }, right: { tag: 'full moon', text: 'Işığın en parlak — tüm dünya seninle' } },
  luteal:     { left: { tag: '04 — içe dön', text: 'Yavaşlamak da güç · dinle · hisset' }, right: { tag: 'waning', text: 'Karanlık, yıldızları görmek için var' } },
};

// ── TODAY STATE computation ───────────────────────────
const STATE_ICONS = { sleep: '○', mood: '♡', energy: '↯', bloat: '◉', symptom: '△', cycle: '◎' };

function computeTodayState(state, info, todayDate) {
  const todayLog  = state.days[todayDate] || {};
  const lastBody  = state.body.find(b => b.date === todayDate);
  const lastSleep = (state.sleep || []).find(s => s.date === todayDate || s.date === addDays(todayDate, -1));
  const bloat     = lastBody?.bloat ?? todayLog.bloat;
  const badSyms   = ['Kramp', 'Baş ağrısı', 'Bulantı', 'Yorgunluk', 'Sinirlilik'];
  const todayBad  = (todayLog.symptoms || []).filter(s => badSyms.includes(s));

  const hasData = todayLog.mood || todayLog.energy || bloat != null || lastSleep || todayBad.length;
  if (!hasData) return null;

  const factors = [];

  if (lastSleep?.quality <= 2)
    factors.push({ type: 'sleep', label: `Yetersiz uyku — ${lastSleep.quality}/5`, neg: true });
  else if (lastSleep?.quality >= 4)
    factors.push({ type: 'sleep', label: `İyi uyku — ${lastSleep.quality}/5`, neg: false });

  if (todayLog.mood != null) {
    if (todayLog.mood <= 2) factors.push({ type: 'mood', label: 'Düşük ruh hali', neg: true });
    else if (todayLog.mood >= 4) factors.push({ type: 'mood', label: 'Yüksek ruh hali', neg: false });
  }
  if (todayLog.energy != null) {
    if (todayLog.energy <= 2) factors.push({ type: 'energy', label: 'Düşük enerji', neg: true });
    else if (todayLog.energy >= 4) factors.push({ type: 'energy', label: 'Yüksek enerji', neg: false });
  }
  if (bloat >= 2) factors.push({ type: 'bloat', label: 'Şişkinlik', neg: true });
  if (todayBad.length) factors.push({ type: 'symptom', label: todayBad[0], neg: true });
  if (info) factors.push({ type: 'cycle', label: `${PHASES[info.phaseKey].name} · gün ${info.dayInCycle}`, neg: null });

  const negs = factors.filter(f => f.neg === true).length;
  const pos  = factors.filter(f => f.neg === false).length;

  let label, level;
  if      (negs >= 3)               { label = 'Zor Bir Gün';  level = 'low'; }
  else if (negs >= 2)               { label = 'Düşük Enerji'; level = 'low'; }
  else if (negs === 1 && pos === 0) { label = 'Sakin Mod';    level = 'mid'; }
  else if (pos >= 2)                { label = 'Enerjik';      level = 'high'; }
  else if (pos >= 1)                { label = 'Dengeli';      level = 'high'; }
  else                              { label = 'Nötr';         level = 'mid'; }

  return { label, level, factors: factors.slice(0, 5) };
}

// ── Dashboard ─────────────────────────────────────────
export default function Dashboard({ appState }) {
  const { state, update } = appState;

  function handleOnboard({ last, cycle, period }) {
    update({ setup: true, avgCycle: cycle, avgPeriod: period, periods: [{ start: last, length: period, flow: 'orta' }] });
  }

  const info      = cycleInfo(state);
  const phase     = info ? PHASES[info.phaseKey] : null;
  const todayDate = today();
  const todayDay  = state.days[todayDate] || {};
  const lastBody  = [...state.body].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
  const weekWorkouts = state.workouts.filter(w => Math.round((new Date() - new Date(w.date)) / 86400000) < 7);
  const todayState   = computeTodayState(state, info, todayDate);

  // Quick log helpers
  function updateToday(patch) {
    update({ days: { ...state.days, [todayDate]: { ...todayDay, ...patch } } });
  }
  function addSymptomToday(sym) {
    const syms = new Set(todayDay.symptoms || []);
    syms.add(sym);
    updateToday({ symptoms: [...syms] });
  }
  function logQuickSleep(quality, duration) {
    const existing = (state.sleep || []).findIndex(s => s.date === todayDate);
    const entry = { date: todayDate, bedtime: '', wakeTime: '', duration, quality, notes: 'hızlı giriş' };
    const newSleep = existing >= 0
      ? (state.sleep || []).map((s, i) => i === existing ? entry : s)
      : [...(state.sleep || []), entry];
    update({ sleep: newSleep });
  }

  const QUICK_LOG = [
    { label: 'İyi uyudum',     tap: () => logQuickSleep(4, 480) },
    { label: 'Kötü uyudum',    tap: () => logQuickSleep(2, 330) },
    { label: 'Enerjik',        tap: () => updateToday({ energy: 4 }) },
    { label: 'Yorgunum',       tap: () => updateToday({ energy: 2 }) },
    { label: 'Mutluyum',       tap: () => updateToday({ mood: 4 }) },
    { label: 'Moralim bozuk',  tap: () => updateToday({ mood: 2 }) },
    { label: 'Şişkinlik var',  tap: () => updateToday({ bloat: 2 }) },
    { label: 'Baş ağrısı',    tap: () => addSymptomToday('Baş ağrısı') },
    { label: 'Kramp var',      tap: () => addSymptomToday('Kramp') },
  ];

  return (
    <>
      {!state.setup && <OnboardModal onComplete={handleOnboard} />}

      <div className="page-wrap">
        <div className="page-head">
          <div className="page-head-left">
            <div className="page-eyebrow">
              {info ? `Cycle Day ${info.dayInCycle} / ${info.avgC}` : 'Session I'}
            </div>
            <h1 className="page-title" data-en="TODAY">Bugün</h1>
          </div>
          <div className="session-tag">{formatLong(todayDate)}</div>
        </div>

        {/* TODAY STATE CARD */}
        {todayState ? (
          <div className={`today-state-card today-state-${todayState.level}`}>
            <div className="today-state-left">
              <div className="today-state-eyebrow">Bugünkü halin</div>
              <div className="today-state-label">{todayState.label}</div>
            </div>
            <div className="today-state-right">
              {todayState.factors.map((f, i) => (
                <div key={i} className={`today-state-factor${f.neg === true ? ' factor-neg' : f.neg === false ? ' factor-pos' : ' factor-neutral'}`}>
                  <span className="factor-icon">{STATE_ICONS[f.type]}</span>
                  {f.label}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="today-state-empty">
            <div className="today-state-empty-label">Bugün henüz veri yok</div>
            <div className="today-state-empty-sub">Aşağıdan hızlı kayıt yap veya semptomlar sayfasını kullan</div>
          </div>
        )}

        {/* Quick Event Log */}
        <div className="quick-log">
          <div className="quick-log-label">Hızlı Kayıt</div>
          <div className="quick-log-chips">
            {QUICK_LOG.map(e => (
              <button key={e.label} className="quick-chip" type="button" onClick={e.tap}>{e.label}</button>
            ))}
          </div>
        </div>

        {/* Cycle card */}
        {info && phase ? (
          <div className="dash-cycle-card mt-24">
            <CycleRing day={info.dayInCycle} total={info.avgC} phase={info.phaseKey} />
            <div className="dash-phase-info">
              <div className="dash-phase-eyebrow">Day {info.dayInCycle} of {info.avgC}</div>
              <div className="dash-phase-name" style={{ color: phase.color }}>
                <span className="dash-phase-dot" style={{ background: phase.color }} />
                {phase.name}
              </div>
              <p className="dash-phase-desc">{phase.desc}</p>
              <div className="dash-phase-stats">
                <div>
                  <div className="dash-phase-stat-label">Bir Sonraki Adet</div>
                  <div className="dash-phase-stat-val">{formatShort(info.nextPeriod)}</div>
                </div>
                <div>
                  <div className="dash-phase-stat-label">Ovulasyon</div>
                  <div className="dash-phase-stat-val">{formatShort(info.ovulation)}</div>
                </div>
                <div>
                  <div className="dash-phase-stat-label">Doğurganlık</div>
                  <div className="dash-phase-stat-val">{formatShort(info.fertileStart)}–{formatShort(info.fertileEnd)}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="page-coming mt-24">Döngü verisini görmek için kurulumu tamamla.</div>
        )}

        {/* 4 stat cards */}
        <div className="page-grid grid-4 mt-24">
          <div className="stat-card">
            <div className="stat-label">Kilo</div>
            <div className="stat-value">{lastBody?.weight ?? '—'}<span style={{ fontSize: '24px' }}>kg</span></div>
            <div className="stat-sub">{lastBody ? lastBody.date : 'Kayıt yok'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Şişkinlik</div>
            <div className="stat-value">{todayDay.bloat != null ? todayDay.bloat : '—'}</div>
            <div className="stat-sub">{todayDay.bloat != null ? (todayDay.bloat >= 2 ? 'Yüksek' : todayDay.bloat <= 0 ? 'Rahat' : 'Hafif') : 'Bugün kaydedilmedi'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Ruh Hali</div>
            <div className="stat-value">{todayDay.mood ?? '—'}</div>
            <div className="stat-sub">{todayDay.mood ? `${todayDay.mood}/5` : 'Bugün kaydedilmedi'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Spor (Hafta)</div>
            <div className="stat-value">{weekWorkouts.length}<span style={{ fontSize: '24px' }}>x</span></div>
            <div className="stat-sub">{weekWorkouts.reduce((s, w) => s + (w.duration || 0), 0)} dk toplam</div>
          </div>
        </div>

        {/* Split banner */}
        {phase && (() => {
          const b = BANNERS[info.phaseKey] || BANNERS.follicular;
          return (
            <div className="split-banner mt-24">
              <div className="split-banner-left">
                <div className="split-banner-tag">{b.left.tag}</div>
                <div className="split-banner-text">{b.left.text}</div>
              </div>
              <div className="split-banner-right">
                <div className="split-banner-tag">{b.right.tag}</div>
                <div className="split-banner-text">{b.right.text}</div>
              </div>
            </div>
          );
        })()}

        {/* Phase recommendations */}
        {phase && (
          <>
            <div className="section-head mt-36">
              Bu fazda öneriler
              <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Senin için</span>
            </div>
            <div className="page-grid grid-3">
              <div className="card tilt-l">
                <div className="card-label">Beslenme</div>
                <div className="card-inner">
                  <ul className="rec-list">
                    {phase.food.map((item, i) => <li key={i} className="rec-item">{item}</li>)}
                  </ul>
                </div>
              </div>
              <div className="card">
                <div className="card-label">Spor</div>
                <div className="card-inner">
                  <ul className="rec-list">
                    {phase.fitness.map((item, i) => <li key={i} className="rec-item">{item}</li>)}
                  </ul>
                </div>
              </div>
              <div className="card tilt-r">
                <div className="card-label">Cilt</div>
                <div className="card-inner">
                  <ul className="rec-list">
                    {phase.skin.map((item, i) => <li key={i} className="rec-item">{item}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
