import { useState, useRef, useEffect } from 'react';
import { cycleInfo, PHASES, today } from '../utils/cycle';
import { aiCall, buildContext } from '../hooks/useAI';
import './Chat.css';

export default function Chat({ appState }) {
  const { state, update } = appState;
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const msgsRef = useRef(null);

  const info = cycleInfo(state);

  const quickActions = [
    'Bugün ne yemeliyim?',
    'Bu fazda spor önerisi',
    'Cilt rutinim doğru mu?',
    info ? `${PHASES[info.phaseKey].name} fazı nasıl geçer?` : null,
  ].filter(Boolean);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [state.chat, typing]);

  useEffect(() => {
    if (!state.chat.length) {
      const welcome = state.aiUrl
        ? 'Femme aktif. Yemek tarif et kalori tahmin edeyim, faz hakkında soru sor, ya da bugün nasıl hissettiğini paylaş.'
        : 'AI henüz aktif değil. Ayarlar > AI Backend URL kısmına Cloudflare Worker URL\'ini gir.';
      update({ chat: [{ role: 'system', content: welcome }] });
    }
  }, []);

  async function send(text) {
    const msg = (text || input).trim();
    if (!msg) return;
    if (!state.aiUrl) {
      addMsg('system', 'AI aktif değil. Ayarlar bölümünden URL ekle.');
      return;
    }
    setInput('');
    addMsg('user', msg);
    setTyping(true);

    try {
      const ctx = buildContext(state);
      const history = state.chat.filter(m => m.role !== 'system').slice(-10);
      const res = await aiCall({ task: 'chat', context: ctx, history, message: msg }, state.aiUrl);
      setTyping(false);
      if (res?.reply) {
        addMsg('assistant', res.reply);
        if (res.meal && typeof res.meal.calories === 'number') {
          const meal = { date: today(), type: res.meal.type || 'Atıştırmalık', desc: res.meal.description || msg, cal: res.meal.calories };
          update({ meals: [...state.meals, meal].sort((a, b) => b.date.localeCompare(a.date)) });
        }
      } else {
        addMsg('system', 'Yanıt alınamadı.');
      }
    } catch (e) {
      setTyping(false);
      addMsg('system', 'Hata: ' + e.message);
    }
  }

  function addMsg(role, content) {
    const chat = [...state.chat, { role, content }].slice(-40);
    update({ chat });
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
          Backend <strong style={{ color: state.aiUrl ? 'var(--crystal)' : 'var(--ink-faint)' }}>
            {state.aiUrl ? 'aktif' : 'pasif'}
          </strong>
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-msgs" ref={msgsRef}>
          {state.chat.map((m, i) => (
            <div key={i} className={`chat-msg chat-msg-${m.role}`}>
              {m.role === 'assistant' && <div className="chat-from">FEMME</div>}
              {m.role === 'user'      && <div className="chat-from">Sen</div>}
              {m.content.split('\n').map((line, j) => <div key={j}>{line}</div>)}
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
            placeholder="Yaz... (örn: bugün mercimek çorbası içtim)"
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
