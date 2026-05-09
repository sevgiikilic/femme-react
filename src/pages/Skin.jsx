import { useState, useRef } from 'react';
import { cycleInfo, PHASES, today, formatLong } from '../utils/cycle';
import { aiCall } from '../hooks/useAI';
import './Skin.css';

const SKIN_STATES = ['Parlak','Kuru','Yağlı','Karma','Sivilce','Kızarıklık','Hassas','Lekeli','Donuk','Su tutmuş','İyi durumda'];
const PROD_TYPES = ['Temizleyici','Tonik','Esans','Serum','Nemlendirici','Krem','Göz Kremi','SPF','Maske','Eksfoliant','Spot Tedavi','Yağ'];

export default function Skin({ appState }) {
  const { state, update } = appState;
  const [prodName, setProdName]         = useState('');
  const [prodType, setProdType]         = useState('Serum');
  const [prodActive, setProdActive]     = useState('');
  const [searching, setSearching]       = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const searchRef = useRef(null);

  const info  = cycleInfo(state);
  const phase = info ? PHASES[info.phaseKey] : null;
  const log   = state.days[today()] || {};
  const skinSelected = new Set(log.skinStates || []);

  function toggleSkin(s) {
    const day = state.days[today()] || {};
    const st  = new Set(day.skinStates || []);
    if (st.has(s)) st.delete(s); else st.add(s);
    update({ days: { ...state.days, [today()]: { ...day, skinStates: [...st] } } });
  }

  async function searchProduct() {
    const n = prodName.trim();
    if (!n) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await aiCall({ task: 'search_product', query: n }, state.aiUrl || undefined);
      if (res?.results?.length) {
        setSearchResults(res.results);
      } else {
        // Show at least an inferred fallback so the user can continue
        setSearchResults([{ name: n, type: 'Serum', actives: '' }]);
      }
    } catch {
      // On network failure still show the typed name as option
      setSearchResults([{ name: n, type: 'Serum', actives: '' }]);
    }
    setSearching(false);
  }

  const [pickedProduct, setPickedProduct] = useState(null);

  function pickResult(r) {
    setProdName(r.name);
    setProdType(r.type || 'Serum');
    setProdActive(r.actives || '');
    setPickedProduct(r);
    setSearchResults([]);
  }

  function addProduct() {
    const n = prodName.trim();
    if (!n) return;
    const entry = {
      name: n, type: prodType, active: prodActive,
      phases:      pickedProduct?.phases      || null,
      ingredients: pickedProduct?.ingredients || [],
    };
    update({ products: [...state.products, entry] });
    setProdName(''); setProdActive(''); setSearchResults([]); setPickedProduct(null);
  }

  function deleteProduct(i) {
    update({ products: state.products.filter((_, idx) => idx !== i) });
  }

  function buildRoutine(types) {
    const byType = {};
    state.products.forEach(p => {
      if (!byType[p.type]) byType[p.type] = [];
      byType[p.type].push(p);
    });
    return types.map(t => {
      const list = byType[t] || [];
      return (
        <div key={t} className="routine-step">
          <span className="routine-dot">·</span>
          <div>
            <div className="routine-type">{t}</div>
            {list.length > 0 ? (
              <div className="routine-prod">{list[0].name}{list[0].active ? ` · ${list[0].active}` : ''}</div>
            ) : (
              <div className="routine-empty">dolabında yok</div>
            )}
          </div>
        </div>
      );
    });
  }

  const skinHistory = Object.entries(state.days)
    .filter(([, d]) => d.skinStates && d.skinStates.length)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 30);

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="page-head-left">
          <div className="page-eyebrow">Skin Library</div>
          <h1 className="page-title" data-en="SKIN">Cilt</h1>
        </div>
        <div className="session-tag">
          Bu Faz {phase && <strong style={{ color: phase.color }}>{phase.name}</strong>}
        </div>
      </div>

      <div className="card">
        <div className="card-label">
          <span>Bugünkü Cilt Durumu</span>
          <span>Otomatik kaydedilir</span>
        </div>
        <div className="chip-group">
          {SKIN_STATES.map(s => (
            <button
              key={s}
              className={`chip${skinSelected.has(s) ? ' selected' : ''}`}
              onClick={() => toggleSkin(s)}
              type="button"
            >{s}</button>
          ))}
        </div>
      </div>

      <div className="section-head mt-36">
        Cilt bakım dolabım
        <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>{state.products.length} ürün</span>
      </div>
      <div className="card" style={{ overflow: 'visible' }}>
        <div className="form-row" style={{ overflow: 'visible' }}>
          <div className="form-group" style={{ flex: 2, position: 'relative', zIndex: 10 }} ref={searchRef}>
            <label className="form-label">Ürün Adı · AI ile aratılır</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text" className="input" value={prodName}
                style={{ flex: 1 }}
                placeholder="ör. Some By Mi AHA-BHA-PHA Toner"
                onChange={e => { setProdName(e.target.value); setSearchResults([]); }}
                onKeyDown={e => e.key === 'Enter' && searchProduct()}
              />
              <button
                className="btn"
                type="button"
                onClick={searchProduct}
                disabled={searching || !prodName.trim()}
                style={{ flexShrink: 0, minWidth: 60 }}
              >{searching ? '...' : 'Ara'}</button>
            </div>
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((r, i) => {
                  const phaseNote = phase && r.phases ? r.phases[info?.phaseKey] : null;
                  return (
                    <div key={i} className="search-result-item" onMouseDown={() => pickResult(r)}>
                      <div className="search-result-name">{r.name}</div>
                      <div className="search-result-meta">
                        {r.type}{r.actives ? ` · ${r.actives}` : ''}
                      </div>
                      {phaseNote && (
                        <div className="search-result-phase">
                          {phase.name}: {phaseNote}
                        </div>
                      )}
                      {r.ingredients?.length > 0 && (
                        <div className="search-result-ingredients">
                          {r.ingredients.map(ing => <span key={ing} className="ingredient-chip">{ing}</span>)}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="search-result-close" onMouseDown={() => setSearchResults([])}>kapat ×</div>
              </div>
            )}
            {/* Ingredient + phase preview after picking */}
            {pickedProduct && (pickedProduct.ingredients?.length > 0 || pickedProduct.phases) && (
              <div className="picked-product-info">
                {pickedProduct.phases && (
                  <div className="phase-compat-row">
                    {Object.entries(pickedProduct.phases).map(([ph, note]) => (
                      <div key={ph} className={`phase-compat-cell ${note?.includes('kaçın') || note?.includes('dikkatli') ? 'compat-warn' : 'compat-ok'}`}>
                        <span className="phase-compat-ph">{ph}</span>
                        <span className="phase-compat-note">{note}</span>
                      </div>
                    ))}
                  </div>
                )}
                {pickedProduct.ingredients?.length > 0 && (
                  <div className="ingredient-row">
                    <span className="ingredient-row-label">Bileşenler:</span>
                    {pickedProduct.ingredients.map(ing => <span key={ing} className="ingredient-chip">{ing}</span>)}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="form-group" style={{ maxWidth: 160 }}>
            <label className="form-label">Tip</label>
            <select className="select" value={prodType} onChange={e => setProdType(e.target.value)}>
              {PROD_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Anahtar İçerik</label>
            <input type="text" className="input" value={prodActive} placeholder="otomatik dolacak" onChange={e => setProdActive(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="button" onClick={addProduct}>Ekle</button>
        </div>
        <div className="ai-note">[ INCIDecoder &amp; AI ile ürün otomatik bulunur. ]</div>
      </div>

      {state.products.length > 0 && (
        <div className="card mt-16 table-card">
          <table className="data-table">
            <thead><tr><th>Ürün</th><th>Tip</th><th>İçerik</th><th></th></tr></thead>
            <tbody>
              {state.products.map((p, i) => (
                <tr key={i}>
                  <td className="num-cell">
                    {p.name}
                    {p.ingredients?.length > 0 && (
                      <div className="ingredient-row-mini">
                        {p.ingredients.map(ing => <span key={ing} className="ingredient-chip-mini">{ing}</span>)}
                      </div>
                    )}
                  </td>
                  <td>{p.type}</td>
                  <td>{p.active || '—'}</td>
                  <td><button className="micro-btn danger" type="button" onClick={() => deleteProduct(i)}>Sil</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {phase && (
        <>
          <div className="section-head mt-36">
            Faza özel rutin önerisi
            <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Senin ürünlerinden</span>
          </div>
          <div className="page-grid grid-2">
            <div className="card">
              <div className="card-label">Sabah</div>
              <div className="card-inner">
                {phase.skinNote && (
                  <div className="skin-note">{phase.skinNote}</div>
                )}
                {buildRoutine(phase.skinFocus?.am || ['Temizleyici','Nemlendirici','SPF'])}
              </div>
            </div>
            <div className="card">
              <div className="card-label">Akşam</div>
              <div className="card-inner">
                {buildRoutine(phase.skinFocus?.pm || ['Temizleyici','Nemlendirici'])}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="section-head mt-36">
        Cilt günlüğü
        <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Geçmiş</span>
      </div>
      <div className="card table-card">
        <table className="data-table">
          <thead><tr><th>Tarih</th><th>Faz</th><th>Durum</th></tr></thead>
          <tbody>
            {skinHistory.length === 0 ? (
              <tr><td colSpan="3" className="empty-cell">Henüz kayıt yok.</td></tr>
            ) : skinHistory.map(([d, dayLog]) => {
              const ci = cycleInfo(state, d);
              return (
                <tr key={d}>
                  <td className="num-cell">{formatLong(d)}</td>
                  <td>{ci ? PHASES[ci.phaseKey].name : '—'}</td>
                  <td>{dayLog.skinStates.join(', ')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
