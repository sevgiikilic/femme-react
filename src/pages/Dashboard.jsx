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

  // tick marks at compass points
  const ticks = [0, 90, 180, 270].map(angle => {
    const rad = (angle - 90) * (Math.PI / 180);
    const x1 = 100 + 92 * Math.cos(rad);
    const y1 = 100 + 92 * Math.sin(rad);
    const x2 = 100 + 98 * Math.cos(rad);
    const y2 = 100 + 98 * Math.sin(rad);
    return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1.5" opacity="0.4" />;
  });

  return (
    <div className="ring-wrap">
      <svg viewBox="0 0 200 200" className="ring-svg">
        {ticks}
        <circle cx="100" cy="100" r={R} fill="none" stroke="currentColor" strokeWidth="1" opacity="0.15" />
        <circle
          cx="100" cy="100" r={R}
          fill="none"
          stroke={phaseData.color}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 100 100)"
          strokeLinecap="square"
        />
        {/* compass dots */}
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
            Döngünü takip etmek için birkaç bilgiye ihtiyacım var. Bunları istediğin zaman ayarlardan güncelleyebilirsin.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Son Adet Başlangıç Tarihi</label>
              <input type="date" className="input" value={last} onChange={e => setLast(e.target.value)} required />
            </div>
            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label">Ortalama Döngü Süresi (gün)</label>
                <input type="number" className="input" min="20" max="45" value={cycle} onChange={e => setCycle(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Ortalama Adet Süresi (gün)</label>
                <input type="number" className="input" min="1" max="10" value={period} onChange={e => setPeriod(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
              Başla →
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────
export default function Dashboard({ appState, onUpdate }) {
  const { state, update } = appState;

  function handleOnboard({ last, cycle, period }) {
    update({
      setup: true,
      avgCycle: cycle,
      avgPeriod: period,
      periods: [{ start: last, length: period, flow: 'orta' }],
    });
  }

  const info = cycleInfo(state);
  const phase = info ? PHASES[info.phaseKey] : null;
  const todayDate = today();

  // Last body measurement for stat cards
  const lastBody = [...state.body].sort((a, b) => b.date?.localeCompare(a.date || ''))[0];
  // Last symptoms for today
  const todayDay = state.days[todayDate] || {};
  const weekWorkouts = state.workouts.filter(w => {
    const diff = Math.round((new Date() - new Date(w.date)) / 86400000);
    return diff >= 0 && diff < 7;
  });

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
          <div className="session-tag">
            {formatLong(todayDate)}
          </div>
        </div>

        {/* Cycle card + phase info */}
        {info && phase ? (
          <div className="dash-cycle-card">
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
          <div className="page-coming" style={{ marginTop: 0 }}>
            Döngü verisini görmek için kurulumu tamamla.
          </div>
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

        {/* Phase recommendations */}
        {phase && (
          <>
            <div className="section-head mt-36">
              Bu fazda öneriler
              <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Senin için</span>
            </div>
            <div className="page-grid grid-3">
              <div className="card">
                <div className="card-label">Beslenme</div>
                <div className="card-inner">
                  <ul className="rec-list">
                    {phase.food.map((item, i) => (
                      <li key={i} className="rec-item">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="card">
                <div className="card-label">Spor</div>
                <div className="card-inner">
                  <ul className="rec-list">
                    {phase.fitness.map((item, i) => (
                      <li key={i} className="rec-item">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="card">
                <div className="card-label">Cilt</div>
                <div className="card-inner">
                  <ul className="rec-list">
                    {phase.skin.map((item, i) => (
                      <li key={i} className="rec-item">{item}</li>
                    ))}
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
