import { useState, useRef, useEffect } from 'react';
import { cycleInfo, PHASES, today } from '../utils/cycle';
import { aiCall, buildContext, WORKER_URL } from '../hooks/useAI';
import './Chat.css';

// Keywords that suggest a health log message (not a question)
const LOG_RE = /kilo(?:m(?:u)?)?|kg|şişkinlik|şiştim|şiş(?:im|tik)|uyku(?:m(?:u)?)?|uyudum|yattım|kalktım|ruh hal(?:im|i)?|enerjim|enerji(?:m)?|kramp|baş ağrı|vitamin|takviye|magnezyum|omega|b12|demir|çinko|probiyotik|aldım|yedim|içtim|sürdüm|sabah|öğle|akşam|kahvaltı|moralim|yorgu(?:n(?:um)?|yum)/i;

function applyLogToState(log, state, update, todayDate) {
  if (log.error) return [];
  const saved = [];
  const patch = {};

  // weight / bloat → body[]
  if (log.weight != null || log.bloat != null) {
    const existing = state.body.findIndex(b => b.date === todayDate);
    const base = existing >= 0 ? { ...state.body[existing] } : { date: todayDate };
    if (log.weight != null) { base.weight = log.weight; saved.push(`${log.weight} kg`); }
    if (log.bloat != null)  { base.bloat  = log.bloat;  saved.push(`şişkinlik ${log.bloat > 0 ? '+' : ''}${log.bloat}`); }
    patch.body = existing >= 0
      ? state.body.map((b, i) => i === existing ? base : b)
      : [...state.body, base].sort((a, b) => b.date.localeCompare(a.date));
  }

  // sleep → sleep[]
  if (log.sleep_quality != null || log.sleep_bedtime || log.sleep_waketime || log.sleep_duration_min) {
    const sl = state.sleep || [];
    const ex = sl.findIndex(s => s.date === todayDate);
    const base = ex >= 0 ? { ...sl[ex] } : { date: todayDate, bedtime: '', wakeTime: '', duration: 0, quality: 3, notes: '' };
    if (log.sleep_bedtime)     base.bedtime  = log.sleep_bedtime;
    if (log.sleep_waketime)    base.wakeTime = log.sleep_waketime;
    if (log.sleep_duration_min != null) base.duration = log.sleep_duration_min;
    if (log.sleep_quality != null)      base.quality  = log.sleep_quality;
    if (log.sleep_notes)       base.notes    = log.sleep_notes;
    patch.sleep = ex >= 0 ? sl.map((s, i) => i === ex ? base : s) : [...sl, base];
    const qn = ['', 'çok kötü', 'kötü', 'orta', 'iyi', 'harika'];
    saved.push(`uyku ${qn[log.sleep_quality] || 'kaydedildi'}`);
  }

  // mood / energy / symptoms → days{}
  const hasDay = log.mood != null || log.energy != null || (log.symptoms?.length) || (log.skincare_used?.length);
  if (hasDay) {
    const days = { ...(patch.days || state.days) };
    const day  = { ...(days[todayDate] || {}) };
    if (log.mood   != null) { day.mood   = log.mood;   saved.push(`ruh hali ${log.mood}/5`); }
    if (log.energy != null) { day.energy = log.energy; saved.push(`enerji ${log.energy}/5`); }
    if (log.symptoms?.length) {
      const syms = new Set(day.symptoms || []);
      log.symptoms.forEach(s => syms.add(s));
      day.symptoms = [...syms];
      saved.push(log.symptoms.join(', '));
    }
    if (log.skincare_used?.length) {
      const sc = new Set(day.skincareUsed || []);
      log.skincare_used.forEach(s => sc.add(s));
      day.skincareUsed = [...sc];
      saved.push('cilt bakımı');
    }
    // also sync bloat to days for dashboard stat
    if (log.bloat != null) day.bloat = log.bloat;
    days[todayDate] = day;
    patch.days = days;
  } else if (log.bloat != null) {
    // sync bloat to days even when no other day-level data
    const days = { ...(patch.days || state.days) };
    days[todayDate] = { ...(days[todayDate] || {}), bloat: log.bloat };
    patch.days = days;
  }

  // meals
  if (log.meals?.length) {
    const newMeals = [...(state.meals || [])];
    log.meals.forEach(m => {
      newMeals.push({ date: todayDate, type: m.time || 'Atıştırmalık', desc: m.desc, cal: null });
    });
    patch.meals = newMeals.sort((a, b) => b.date.localeCompare(a.date));
    saved.push(`${log.meals.length} öğün`);
  }

  // supplements
  if (log.supplements?.length) {
    const newSups = [...(state.supplements || [])];
    log.supplements.forEach(s => {
      newSups.push({ date: todayDate, name: s.name, dose: s.dose || '', time: '', notes: '' });
    });
    patch.supplements = newSups;
    saved.push(`takviye: ${log.supplements.map(s => s.name).join(', ')}`);
  }

  if (Object.keys(patch).length) update(patch);
  return saved;
}

export default function Chat({ appState }) {
  const { state, update, appendChat } = appState;
  const [input, setInput]   = useState('');
  const [typing, setTyping] = useState(false);
  const msgsRef = useRef(null);

  const info         = cycleInfo(state);
  const effectiveUrl = state.aiUrl || WORKER_URL;

  const quickActions = [
    'Bugün nasıl hissettiğimi anlat',
    'Bu fazda spor önerisi',
    'Cilt rutinim doğru mu?',
    info ? `${PHASES[info.phaseKey].name} fazında ne yemeli?` : null,
  ].filter(Boolean);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [state.chat, typing]);

  useEffect(() => {
    if (!state.chat || !state.chat.length) {
      appendChat({
        role: 'system',
        content: 'Femme aktif. Kilonu, şişkinliğini, ne yediğini, uyku durumunu doğrudan buraya yaz — otomatik kaydederim. Ya da faz, beslenme, cilt hakkında konuş.',
      });
    }
  }, []);

  async function send(text) {
    const msg = (text || input).trim();
    if (!msg || typing) return;
    setInput('');

    const historyForAI = [
      ...(state.chat || []).filter(m => m.role !== 'system').slice(-9),
      { role: 'user', content: msg },
    ];

    appendChat({ role: 'user', content: msg });
    setTyping(true);

    const todayDate   = today();
    const isLogMsg    = LOG_RE.test(msg);
    const ctx         = buildContext(state);

    // Parse runs in background — never blocks chat
    if (isLogMsg) {
      aiCall({ task: 'parse_daily_log', text: msg }, effectiveUrl)
        .then(logRes => {
          if (logRes && !logRes.error) {
            const saved = applyLogToState(logRes, state, update, todayDate);
            if (saved.length) appendChat({ role: 'saved', content: saved.join(' · ') });
          }
        })
        .catch(() => null);
    }

    try {
      const chatRes = await aiCall({ task: 'chat', context: ctx, history: historyForAI }, effectiveUrl);
      setTyping(false);

      if (chatRes?.reply) {
        appendChat({ role: 'assistant', content: chatRes.reply });

        // meal detected by chat → save with macros
        if (chatRes.meal?.calories) {
          const meal = {
            date: todayDate,
            type: chatRes.meal.type || 'Atıştırmalık',
            desc: chatRes.meal.description || msg,
            cal:     chatRes.meal.calories,
            protein: chatRes.meal.protein || null,
            carbs:   chatRes.meal.carbs   || null,
            fat:     chatRes.meal.fat     || null,
          };
          update({ meals: [...state.meals, meal].sort((a, b) => b.date.localeCompare(a.date)) });
        }
      } else {
        appendChat({ role: 'system', content: 'Yanıt alınamadı.' });
      }
    } catch (e) {
      setTyping(false);
      appendChat({ role: 'system', content: 'Hata: ' + e.message });
    }
  }

  function clearChat() {
    update({ chat: [] });
  }

  return (
    <div className="page-wrap chat-page-wrap">
      <div className="page-head">
        <div className="page-head-left">
          <div className="page-eyebrow">AI Companion</div>
          <h1 className="page-title" data-en="CHAT">Sohbet</h1>
        </div>
        <div className="session-tag">
          Backend <strong style={{ color: 'var(--crystal)' }}>aktif</strong>
        </div>
      </div>

      <div className="chat-hint">
        Kilonu, şişkinliğini, yediklerini, uykunu, takviyelerini buraya yaz — uygulama otomatik kaydeder.
      </div>

      <div className="chat-container">
        <div className="chat-msgs" ref={msgsRef}>
          {(state.chat || []).map((m, i) => (
            <div key={i} className={`chat-msg chat-msg-${m.role}`}>
              {m.role === 'assistant' && <div className="chat-from">FEMME</div>}
              {m.role === 'user'      && <div className="chat-from">Sen</div>}
              {m.role === 'saved' ? (
                <div className="chat-saved-badge">
                  <span className="chat-saved-icon">✓</span>
                  Kaydettim: {m.content}
                </div>
              ) : (
                m.content.split('\n').map((line, j) => <div key={j}>{line || ' '}</div>)
              )}
            </div>
          ))}
          {typing && <div className="chat-typing">. . . yazıyor . . .</div>}
        </div>

        <div className="chat-quick">
          {quickActions.map(a => (
            <button key={a} className="chat-quick-btn" type="button" onClick={() => send(a)}>{a}</button>
          ))}
          <button className="chat-quick-btn chat-clear" type="button" onClick={clearChat}>Temizle</button>
        </div>

        <div className="chat-input-row">
          <input
            type="text"
            className="chat-input"
            value={input}
            placeholder="ör. kilom 55, şişkinlik +2, uyku kötüydü, D vitamini aldım"
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            disabled={typing}
          />
          <button className="chat-send" type="button" onClick={() => send()} disabled={typing}>
            Gönder
          </button>
        </div>
      </div>
    </div>
  );
}
