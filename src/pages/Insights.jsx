import { cycleInfo, PHASES, addDays } from '../utils/cycle';
import './Insights.css';

function getAvgCycleLen(state) {
  const ps = [...state.periods].sort((a, b) => a.start.localeCompare(b.start));
  if (ps.length < 2) return state.avgCycle;
  const diffs = [];
  for (let i = 1; i < ps.length; i++) {
    const d = Math.round((new Date(ps[i].start) - new Date(ps[i-1].start)) / 86400000);
    diffs.push(d);
  }
  return Math.round(diffs.reduce((s, d) => s + d, 0) / diffs.length);
}

const STOPWORDS = new Set(['ile', 've', 'bir', 'bu', 'da', 'de', 'ki', 'kez', 'tane', 'gram', 'ml', 'porsiyon', 'adet', 'kadar', 'için', 'ama', 'gibi', 'dolu', 'taze', 'tam']);

function extractWords(desc) {
  return desc.toLowerCase()
    .split(/[\s,.()/\-+]+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
}

export default function Insights({ appState }) {
  const { state } = appState;

  const avgC = getAvgCycleLen(state);
  const isHealthy = avgC >= 21 && avgC <= 35;

  // ── Symptom counts ──
  const symCounts = {};
  Object.values(state.days).forEach(d => (d.symptoms || []).forEach(s => {
    symCounts[s] = (symCounts[s] || 0) + 1;
  }));
  const topSym = Object.entries(symCounts).sort((a, b) => b[1] - a[1]);

  // ── Bloat by phase ──
  const phaseBloats = { menstrual: [], follicular: [], ovulation: [], luteal: [] };
  state.body.forEach(b => {
    if (b.bloat === null || b.bloat === undefined) return;
    const ci = cycleInfo(state, b.date);
    if (ci) phaseBloats[ci.phaseKey].push(b.bloat);
  });

  function bloatColor(avg) {
    if (avg >= 1.5) return 'var(--jazz-red)';
    if (avg >= 0.5) return 'var(--gold)';
    return 'var(--crystal)';
  }

  // ── Mood by phase ──
  const phaseMoods = { menstrual: [], follicular: [], ovulation: [], luteal: [] };
  Object.entries(state.days).forEach(([date, d]) => {
    if (d.mood == null) return;
    const ci = cycleInfo(state, date);
    if (ci && phaseMoods[ci.phaseKey]) phaseMoods[ci.phaseKey].push(Number(d.mood));
  });

  function moodStats(moods) {
    if (!moods.length) return null;
    const avg = (moods.reduce((s, m) => s + m, 0) / moods.length).toFixed(1);
    const lowPct  = Math.round(moods.filter(m => m <= 2).length / moods.length * 100);
    const highPct = Math.round(moods.filter(m => m >= 4).length / moods.length * 100);
    return { avg, lowPct, highPct, n: moods.length };
  }

  const moodMessages = [];
  Object.entries(phaseMoods).forEach(([k, moods]) => {
    const s = moodStats(moods);
    if (!s || s.n < 2) return;
    if (k === 'luteal' && s.lowPct >= 50)
      moodMessages.push({ icon: '♡', text: `Luteal fazının %${s.lowPct}'inde düşük ruh hali kaydettin. Bu döngü kökenli ve geçici — bedenin yenileniyor.` });
    if (k === 'menstrual' && s.lowPct >= 50)
      moodMessages.push({ icon: '♡', text: `Adet döneminin %${s.lowPct}'inde düşük ruh hali girdin. Bu çok normal — kendine izin ver.` });
    if (k === 'ovulation' && s.highPct >= 50)
      moodMessages.push({ icon: '★', text: `Ovulasyon fazında %${s.highPct} oranında yüksek ruh hali kaydediyorsun. Bu enerji dönemin — büyük planlar için ideal!` });
    if (k === 'follicular' && s.highPct >= 40)
      moodMessages.push({ icon: '★', text: `Foliküler fazda ruh halin yükseliyor (ort. ${s.avg}/5). Yeni başlangıçlar için harika zaman.` });
  });

  const moodEntries = Object.values(state.days).filter(d => d.mood);
  const avgMood = moodEntries.length
    ? (moodEntries.reduce((s, d) => s + d.mood, 0) / moodEntries.length).toFixed(1)
    : null;

  // ── Food-bloat correlation ──
  const highBloatDates = new Set(
    state.body.filter(b => b.bloat != null && b.bloat >= 2).map(b => b.date)
  );

  // React-tagged foods cross-referenced with meals
  const reactFoods = state.foods.filter(f => f.pref === 'react' || (f.issues && f.issues.length));
  const foodBloatCorr = reactFoods.map(food => {
    const name = food.name.toLowerCase();
    const mealsWithFood = state.meals.filter(m => m.desc.toLowerCase().includes(name));
    if (!mealsWithFood.length) return null;
    const bloatCount = mealsWithFood.filter(m =>
      highBloatDates.has(m.date) || highBloatDates.has(addDays(m.date, 1))
    ).length;
    if (!bloatCount) return null;
    return { name: food.name, total: mealsWithFood.length, bloatCount, pct: Math.round((bloatCount / mealsWithFood.length) * 100) };
  }).filter(Boolean).sort((a, b) => b.pct - a.pct);

  // General: most common words in high-bloat day meals
  const topBloatWords = (() => {
    if (highBloatDates.size < 2) return [];
    const wordCount = {};
    state.meals.forEach(m => {
      const nextDay = addDays(m.date, 1);
      if (highBloatDates.has(m.date) || highBloatDates.has(nextDay)) {
        extractWords(m.desc).forEach(w => { wordCount[w] = (wordCount[w] || 0) + 1; });
      }
    });
    return Object.entries(wordCount).sort((a, b) => b[1] - a[1]).slice(0, 6);
  })();

  const triggers = state.foods.filter(f => (f.issues && f.issues.length > 0) || f.pref === 'react');

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="page-head-left">
          <div className="page-eyebrow">Pattern Recognition</div>
          <h1 className="page-title" data-en="INSIGHTS">Öngörüler</h1>
        </div>
        <div className="session-tag">{state.periods.length} döngü</div>
      </div>

      <div className="page-grid grid-3">
        <div className="stat-card">
          <div className="stat-label">Ortalama Döngü</div>
          <div className="stat-value">{avgC}<span>g</span></div>
          <div className="stat-sub">{isHealthy ? 'Sağlıklı aralıkta' : 'Düzensiz olabilir'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">En Sık Semptom</div>
          <div className="stat-value" style={{ fontSize: '28px' }}>{topSym[0]?.[0] || '—'}</div>
          <div className="stat-sub">{topSym[0] ? `${topSym[0][1]} kez` : 'henüz veri yok'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ort. Ruh Hali</div>
          <div className="stat-value">{avgMood || '—'}<span>/5</span></div>
          <div className="stat-sub">{moodEntries.length} kayıt</div>
        </div>
      </div>

      {/* Mood by phase */}
      <div className="section-head mt-36">
        Faza göre ruh hali
        <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Döngü analizi</span>
      </div>
      <div className="page-grid grid-4">
        {Object.entries(phaseMoods).map(([k, moods]) => {
          const s = moodStats(moods);
          return (
            <div key={k} className="stat-card">
              <div className="stat-label">{PHASES[k].name}</div>
              {s ? (
                <>
                  <div className="stat-value">{s.avg}<span>/5</span></div>
                  <div className="stat-sub">{s.n} kayıt</div>
                  {s.lowPct >= 40 && <div className="mood-tag mood-low">%{s.lowPct} düşük</div>}
                  {s.highPct >= 50 && <div className="mood-tag mood-high">%{s.highPct} yüksek</div>}
                </>
              ) : (
                <>
                  <div className="stat-value">—</div>
                  <div className="stat-sub">Veri yok</div>
                </>
              )}
            </div>
          );
        })}
      </div>
      {moodMessages.length > 0 && (
        <div className="card mt-16">
          {moodMessages.map((msg, i) => (
            <div key={i} className="insight-msg">
              <span className="insight-msg-icon">{msg.icon}</span>
              <div className="insight-msg-text">{msg.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* Bloat by phase */}
      <div className="section-head mt-36">
        Faza göre şişkinlik
        <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Korelasyon</span>
      </div>
      <div className="card">
        <div className="bars ins-bars">
          {Object.entries(phaseBloats).map(([k, arr]) => {
            const avg = arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null;
            if (avg === null) {
              return (
                <div key={k} className="ins-bar ins-bar-empty">
                  <div className="ins-bar-label">{PHASES[k].name.slice(0, 4)}</div>
                </div>
              );
            }
            const h = Math.max(8, ((avg + 1) / 4) * 100);
            return (
              <div key={k} className="ins-bar" style={{ height: `${h}%`, background: bloatColor(avg) }}>
                <div className="ins-bar-val">{avg.toFixed(1)}</div>
                <div className="ins-bar-label">{PHASES[k].name.slice(0, 4)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Food-bloat correlation */}
      {(foodBloatCorr.length > 0 || topBloatWords.length > 0) && (
        <>
          <div className="section-head mt-36">
            Şişkinlik tetikleyicileri
            <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Yemek analizi</span>
          </div>
          <div className="card">
            {foodBloatCorr.map(({ name, total, bloatCount, pct }) => (
              <div key={name} className="trigger-item">
                <span className="trigger-icon">!</span>
                <div style={{ flex: 1 }}>
                  <div className="trigger-name">{name}</div>
                  <div className="trigger-issues">
                    {total} öğünde tüketildi — {bloatCount} kez şişkinlik izledi
                  </div>
                </div>
                <div className="trigger-pct">%{pct}</div>
              </div>
            ))}
            {topBloatWords.length > 0 && (
              <div className={foodBloatCorr.length > 0 ? 'mt-16 bloat-words-section' : 'bloat-words-section'}>
                {foodBloatCorr.length > 0 && <div style={{ borderTop: '1px dashed var(--line)', marginBottom: '12px' }} />}
                <div className="card-label">Yüksek şişkinlik günlerinde sık tüketilen</div>
                <div className="bloat-words">
                  {topBloatWords.map(([w, c]) => (
                    <span key={w} className="bloat-word">{w} <small>{c}×</small></span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Top symptoms */}
      <div className="section-head mt-36">
        En sık semptomlar
        <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Frekans</span>
      </div>
      <div className="card">
        {topSym.length === 0 ? (
          <div className="empty-msg">Semptom kaydı yok.</div>
        ) : topSym.slice(0, 10).map(([sym, count]) => (
          <div key={sym} className="sym-row">
            <div className="sym-name">{sym}</div>
            <div className="sym-bar-wrap">
              <div className="sym-bar-fill" style={{ width: `${(count / topSym[0][1]) * 100}%` }} />
            </div>
            <div className="sym-count">{count}×</div>
          </div>
        ))}
      </div>

      {/* Trigger foods */}
      <div className="section-head mt-36">
        Yiyecek tetikleyiciler
        <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Senin için</span>
      </div>
      <div className="card">
        {triggers.length === 0 ? (
          <div className="empty-msg">Henüz tetikleyici yiyecek tespit edilmedi.</div>
        ) : triggers.map(f => (
          <div key={f.name} className="trigger-item">
            <span className="trigger-icon">!</span>
            <div>
              <div className="trigger-name">{f.name}</div>
              <div className="trigger-issues">
                {f.issues && f.issues.length ? f.issues.join(', ') : 'tepki olarak işaretli'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
