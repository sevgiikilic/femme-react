import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import './styles/global.css';
import './App.css';

const THEMES = ['space', 'moon', 'vinyl'];

const PAGES = {
  dashboard: () => <PlaceholderPage title="Bugun"          eyebrow="Session I"    />,
  symptoms:  () => <PlaceholderPage title="Semptomlar"     eyebrow="Session II"   />,
  body:      () => <PlaceholderPage title="Beden"          eyebrow="Session III"  />,
  meals:     () => <PlaceholderPage title="Yemek Gunlugu"  eyebrow="Session IV"   />,
  cycle:     () => <PlaceholderPage title="Dongu"          eyebrow="Session V"    />,
  food:      () => <PlaceholderPage title="Beslenme"       eyebrow="Session VI"   />,
  skin:      () => <PlaceholderPage title="Cilt"           eyebrow="Session VII"  />,
  fitness:   () => <PlaceholderPage title="Spor"           eyebrow="Session VIII" />,
  insights:  () => <PlaceholderPage title="Ongorüler"      eyebrow="Session IX"   />,
  chat:      () => <PlaceholderPage title="Sohbet"         eyebrow="Session X"    />,
  settings:  () => <PlaceholderPage title="Ayarlar"        eyebrow="Session XI"   />,
};

function PlaceholderPage({ title, eyebrow }) {
  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="page-head-left">
          <div className="page-eyebrow">{eyebrow}</div>
          <h1 className="page-title">{title}</h1>
        </div>
        <div className="session-tag">{eyebrow}</div>
      </div>
      <div className="page-coming">
        Bu sayfa henuz tasiniyor — bir sonraki oturumda doldurulacak.
      </div>
    </div>
  );
}

export default function App() {
  const auth = useAuth();
  const [page, setPage]   = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('femme_theme') || 'space');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('femme_theme', theme);
  }, [theme]);

  const cycleTheme = () => setTheme(t => {
    const idx = THEMES.indexOf(t);
    return THEMES[(idx + 1) % THEMES.length];
  });

  const PageComponent = PAGES[page] || PAGES.dashboard;

  const nebulas = (
    <>
      <div className="nebula nebula-1" />
      <div className="nebula nebula-2" />
      <div className="nebula nebula-3" />
      <div className="nebula nebula-4" />
    </>
  );

  if (!auth.isLoggedIn) {
    return <>{nebulas}<Login auth={auth} /></>;
  }

  return (
    <>
      {nebulas}
      <div className="app">
        <Sidebar
          page={page}
          onNavigate={setPage}
          user={auth.user}
          onLogout={auth.logout}
          theme={theme}
          onCycleTheme={cycleTheme}
        />
        <main className="main" key={page}>
          <PageComponent />
        </main>
      </div>
    </>
  );
}
