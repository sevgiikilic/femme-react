import { useState } from 'react';
import { today, formatLong } from '../utils/cycle';
import { aiCall } from '../hooks/useAI';
import './Meals.css';

const TYPES = ['Kahvaltı','Öğle','Akşam','Atıştırmalık'];

export default function Meals({ appState }) {
  const { state, update } = appState;
  const [desc, setDesc]   = useState('');
  const [type, setType]   = useState('Kahvaltı');
  const [cal, setCal]     = useState('');
  const [loading, setLoading] = useState(false);

  const todayMeals = state.meals.filter(m => m.date === today());
  const todayCal   = todayMeals.reduce((s, m) => s + (m.cal || 0), 0);

  async function addMeal() {
    const d = desc.trim();
    if (!d) return;
    let calories = cal ? parseInt(cal) : 0;
    let macros = {};
    if (!calories) {
      setLoading(true);
      try {
        const res = await aiCall({ task: 'estimate_calories', description: d }, state.aiUrl || undefined);
        if (res?.calories) {
          calories = res.calories;
          macros = { protein: res.protein, carbs: res.carbs, fat: res.fat, fiber: res.fiber };
        }
      } catch { /* silently fail */ }
      setLoading(false);
    }
    const meal = { date: today(), type, desc: d, cal: calories, ...macros };
    const newMeals = [...state.meals, meal].sort((a, b) => b.date.localeCompare(a.date));
    update({ meals: newMeals });
    setDesc(''); setCal('');
  }

  function deleteMeal(idx) {
    update({ meals: state.meals.filter((_, i) => i !== idx) });
  }

  const byDate = {};
  state.meals.forEach(m => {
    if (!byDate[m.date]) byDate[m.date] = [];
    byDate[m.date].push(m);
  });
  const dates = Object.keys(byDate).sort().reverse().slice(0, 14);

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="page-head-left">
          <div className="page-eyebrow">Daily Intake</div>
          <h1 className="page-title" data-en="MEALS">Yemek Günlüğü</h1>
        </div>
        <div className="session-tag">
          Bugün <strong>{todayCal} kcal</strong>
        </div>
      </div>

      <div className="card">
        <div className="card-label">
          <span>Ne yedin?</span>
          <span>AI kalori tahmin eder</span>
        </div>
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">Yemek Açıklaması</label>
            <input
              type="text"
              className="input"
              value={desc}
              placeholder="ör. 1 kase mercimek çorbası taze ekmekle"
              onChange={e => setDesc(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addMeal()}
            />
          </div>
          <div className="form-group" style={{ maxWidth: 140 }}>
            <label className="form-label">Öğün</label>
            <select className="select" value={type} onChange={e => setType(e.target.value)}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ maxWidth: 100 }}>
            <label className="form-label">Kalori</label>
            <input
              type="number"
              className="input"
              value={cal}
              placeholder="auto"
              onChange={e => setCal(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" type="button" onClick={addMeal} disabled={loading}>
            {loading ? '...' : 'Ekle'}
          </button>
        </div>
      </div>

      <div className="section-head mt-36">
        Son günler
        <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Geriye doğru</span>
      </div>

      {dates.length === 0 ? (
        <div className="card"><div className="empty-msg">Henüz yemek kaydı yok.</div></div>
      ) : dates.map(d => {
        const meals = byDate[d];
        const dayCal = meals.reduce((s, m) => s + (m.cal || 0), 0);
        return (
          <div key={d} className="meal-day">
            <div className="meal-day-head">
              <div className="meal-day-date">{formatLong(d)}</div>
              <div className="meal-day-cal">{dayCal} KCAL</div>
            </div>
            {meals.map((m, i) => {
              const realIdx = state.meals.indexOf(m);
              return (
                <div key={i} className="meal-item">
                  <span className="meal-type">{m.type}</span>
                  <div className="meal-desc">{m.desc}</div>
                  <div className="meal-cal">{m.cal || 0} kcal</div>
                  {(m.protein || m.carbs || m.fat) && (
                    <div className="meal-macros">
                      {m.protein != null && <span className="macro-p">P {m.protein}g</span>}
                      {m.carbs   != null && <span className="macro-c">K {m.carbs}g</span>}
                      {m.fat     != null && <span className="macro-f">Y {m.fat}g</span>}
                    </div>
                  )}
                  <button className="micro-btn danger" type="button" onClick={() => deleteMeal(realIdx)}>Sil</button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
