import { useState } from 'react';
import { today } from '../utils/cycle';
import { aiCall, WORKER_URL } from '../hooks/useAI';
import './Settings.css';

const KEY = 'femme_v3';

export default function Settings({ appState, onLogout }) {
  const { state, update, save } = appState;
  const [aiUrl, setAiUrl] = useState(state.aiUrl || '');
  const [aiStatus, setAiStatus] = useState('');
  const [avgCycle, setAvgCycle] = useState(String(state.avgCycle || 28));
  const [avgPeriod, setAvgPeriod] = useState(String(state.avgPeriod || 5));

  function saveAiUrl() {
    update({ aiUrl: aiUrl.trim() });
    setAiStatus('');
  }

  async function testAi() {
    const url = aiUrl.trim() || WORKER_URL;
    setAiStatus('[ test ediliyor... ]');
    try {
      const res = await aiCall({ task: 'ping' }, url);
      setAiStatus(res?.ok ? '[ bağlandı ]' : '[ yanıt yok ]');
    } catch (e) {
      setAiStatus(`[ × ${e.message} ]`);
    }
  }

  function saveDefaults() {
    update({ avgCycle: parseInt(avgCycle) || 28, avgPeriod: parseInt(avgPeriod) || 5 });
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `femme-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(e) {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!window.confirm('Mevcut veriler üzerine yazılacak. Devam edilsin mi?')) return;
        save(data);
      } catch (err) {
        alert('Geçersiz dosya: ' + err.message);
      }
    };
    reader.readAsText(f);
  }

  function resetData() {
    if (!window.confirm('Tüm veriler silinecek. Emin misin?')) return;
    if (!window.confirm('Bu işlem geri alınamaz. Onaylıyor musun?')) return;
    localStorage.removeItem(KEY);
    window.location.reload();
  }

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="page-head-left">
          <div className="page-eyebrow">System</div>
          <h1 className="page-title" data-en="SETTINGS">Ayarlar</h1>
        </div>
        <div className="session-tag">v.iii</div>
      </div>

      <div className="section-head">
        Yapay zeka
        <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Optional</span>
      </div>
      <div className="card">
        <div className="settings-row">
          <div>
            <div className="settings-title">AI Backend URL</div>
            <div className="settings-desc">Boş bırakırsan varsayılan worker kullanılır. Özel worker kullanmak istersen URL'ini gir.</div>
          </div>
          <span className="ai-status" style={{ color: 'var(--crystal)' }}>aktif</span>
        </div>
        <input
          type="text" className="input mt-16" value={aiUrl}
          placeholder="https://femme-ai.swq-bms.workers.dev"
          onChange={e => setAiUrl(e.target.value)}
          onBlur={saveAiUrl}
        />
        <div className="settings-actions mt-12">
          <button className="btn btn-sm" type="button" onClick={testAi}>Bağlantıyı Test Et</button>
          {aiStatus && <span className="ai-status">{aiStatus}</span>}
        </div>
      </div>

      <div className="section-head mt-28">
        Döngü Varsayılanları
        <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Manuel ayar</span>
      </div>
      <div className="card">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Ortalama Döngü (gün)</label>
            <input type="number" min="20" max="45" className="input" value={avgCycle} onChange={e => setAvgCycle(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Ortalama Adet Süresi (gün)</label>
            <input type="number" min="1" max="10" className="input" value={avgPeriod} onChange={e => setAvgPeriod(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="button" onClick={saveDefaults}>Kaydet</button>
        </div>
      </div>

      <div className="section-head mt-28">
        Verilerim
        <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>Yedekle / Aktar</span>
      </div>
      <div className="card">
        <div className="settings-row">
          <div>
            <div className="settings-title">Dışa aktar</div>
            <div className="settings-desc">Tüm verilerini JSON olarak indir.</div>
          </div>
          <button className="btn btn-sm" type="button" onClick={exportData}>İndir</button>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-title">İçe aktar</div>
            <div className="settings-desc">Daha önce indirdiğin yedeği yükle.</div>
          </div>
          <label className="btn btn-sm" style={{ cursor: 'pointer' }}>
            Yükle
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={importData} />
          </label>
        </div>
        <div className="settings-row settings-danger-row">
          <div>
            <div className="settings-title danger-title">Sıfırla</div>
            <div className="settings-desc">Tüm verileri sil. Geri alınamaz.</div>
          </div>
          <button className="btn btn-sm btn-danger" type="button" onClick={resetData}>Sıfırla</button>
        </div>
      </div>

      {onLogout && (
        <div className="section-head mt-28">Hesap</div>
      )}
      {onLogout && (
        <div className="card">
          <div className="settings-row">
            <div>
              <div className="settings-title">Çıkış Yap</div>
              <div className="settings-desc">Oturumu kapat.</div>
            </div>
            <button className="btn btn-sm" type="button" onClick={onLogout}>Çıkış →</button>
          </div>
        </div>
      )}
    </div>
  );
}
