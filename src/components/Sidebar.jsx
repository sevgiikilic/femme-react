import './Sidebar.css';

const NAV = [
  { group: 'Gunluk', items: [
    { id: 'dashboard', label: 'Bugün',         num: 'I'    },
    { id: 'symptoms',  label: 'Semptomlar',    num: 'II'   },
    { id: 'body',      label: 'Beden',         num: 'III'  },
    { id: 'meals',     label: 'Yemek Gunlugu', num: 'IV'   },
  ]},
  { group: 'Kutuphane', items: [
    { id: 'cycle',    label: 'Dongu',          num: 'V'    },
    { id: 'food',     label: 'Beslenme',       num: 'VI'   },
    { id: 'skin',     label: 'Cilt',           num: 'VII'  },
    { id: 'fitness',  label: 'Spor',           num: 'VIII' },
  ]},
  { group: 'Icgorüler', items: [
    { id: 'insights', label: 'Ongorüler',      num: 'IX'   },
    { id: 'chat',     label: 'Sohbet',         num: 'X'    },
    { id: 'settings', label: 'Ayarlar',        num: 'XI'   },
  ]},
];

const THEME_LABELS = { space: 'uzay', moon: 'ay', vinyl: 'vinil' };

export default function Sidebar({ page, onNavigate, user, onLogout, theme, onCycleTheme }) {
  return (
    <aside className="sidebar">
      {/* brand */}
      <div className="brand">
        <div className="brand-mark">
          <svg viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="14" cy="14" r="5" fill="currentColor" opacity="0.4"/>
            <path d="M14 1v4M14 23v4M1 14h4M23 14h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span className="brand-logo">FEMME</span>
        </div>
        <div className="brand-tag">cycle · mood · body · skin</div>
        {user && <div className="brand-subtag">{user.name || user.email}</div>}
      </div>

      {/* theme cycler */}
      <button className="theme-cycler" onClick={onCycleTheme} type="button">
        <div className="theme-dot" />
        tema: {THEME_LABELS[theme] || theme}
      </button>

      {/* nav */}
      <nav className="nav">
        {NAV.map(group => (
          <div className="nav-group" key={group.group}>
            <div className="nav-label">{group.group}</div>
            {group.items.map(item => (
              <button
                key={item.id}
                className={`nav-item${page === item.id ? ' active' : ''}`}
                onClick={() => onNavigate(item.id)}
                type="button"
              >
                <span className="nav-num">{item.num}</span>
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* footer */}
      <div className="sidebar-foot">
        <div className="sidebar-foot-info">
          <span>femme v3</span>
          {user && <span>{user.email}</span>}
        </div>
        <button className="logout-btn" onClick={onLogout} type="button">
          Cikis Yap →
        </button>
      </div>
    </aside>
  );
}
