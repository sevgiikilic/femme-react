import './Sidebar.css';

const NAV = [
  { group: 'Günlük', items: [
    { id: 'dashboard', label: 'Bugün',         num: '01' },
    { id: 'symptoms',  label: 'Semptomlar',    num: '02' },
    { id: 'sleep',       label: 'Uyku',          num: '03' },
    { id: 'body',        label: 'Beden',         num: '04' },
    { id: 'meals',       label: 'Yemek Günlüğü', num: '05' },
    { id: 'supplements', label: 'Takviyeler',    num: '06' },
  ]},
  { group: 'Kütüphane', items: [
    { id: 'cycle',    label: 'Döngü',           num: '07' },
    { id: 'food',     label: 'Beslenme',        num: '08' },
    { id: 'skin',     label: 'Cilt',            num: '09' },
    { id: 'fitness',  label: 'Spor',            num: '10' },
  ]},
  { group: 'İçgörüler', items: [
    { id: 'insights', label: 'Öngörüler',       num: '11' },
    { id: 'chat',     label: 'Sohbet',          num: '12' },
    { id: 'settings', label: 'Ayarlar',         num: '13' },
  ]},
];

export default function Sidebar({ page, onNavigate, user, onLogout, theme, onThemeChange, isOpen }) {
  return (
    <aside className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
      {/* brand */}
      <div className="brand">
        <div className="brand-stamp">FEMME</div>
        <div className="brand-meta">
          <span>cycle · mood · body · skin</span>
          <strong>★ v3</strong>
        </div>
        <div className="brand-tag-row">
          <span className="brand-tag">SESSION LOG</span>
          <div className="brand-moon">
            <svg viewBox="0 0 18 18" fill="none">
              <path d="M9 1a8 8 0 1 0 7 11.5A6 6 0 0 1 9 1z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* theme row */}
      <div className="theme-row">
        <button
          className={`theme-btn${theme === 'space' ? ' active' : ''}`}
          onClick={() => onThemeChange('space')}
          type="button"
        >
          uzay
        </button>
        <button
          className={`theme-btn${theme === 'moon' ? ' active' : ''}`}
          onClick={() => onThemeChange('moon')}
          type="button"
        >
          ay
        </button>
        <button
          className={`theme-btn${theme === 'vinyl' ? ' active' : ''}`}
          onClick={() => onThemeChange('vinyl')}
          type="button"
        >
          vinil
        </button>
      </div>

      {/* nav groups */}
      {NAV.map(group => (
        <div key={group.group}>
          <div className="nav-label"><span>{group.group}</span></div>
          <nav className="nav">
            {group.items.map(item => (
              <button
                key={item.id}
                className={`nav-item${page === item.id ? ' active' : ''}`}
                onClick={() => onNavigate(item.id)}
                type="button"
              >
                <span className="nav-num">{item.num}</span>
                {item.label}
                <span className="nav-glyph">→</span>
              </button>
            ))}
          </nav>
        </div>
      ))}

      {/* footer */}
      <div className="sidebar-foot">
        <span className="pulse" />
        femme session log
        {user && <> · <span>{user.email || user.name}</span></>}
        <br />
        <button
          style={{ background:'none', border:'none', color:'inherit', cursor:'pointer', fontFamily:'inherit', fontSize:'inherit', letterSpacing:'inherit', textTransform:'inherit', marginTop:'6px', padding:0 }}
          onClick={onLogout}
          type="button"
        >
          çıkış →
        </button>
      </div>
    </aside>
  );
}
