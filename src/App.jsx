import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useAppState } from './hooks/useAppState';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import './styles/global.css';
import './App.css';

const THEMES = ['space', 'moon', 'vinyl'];

function PlaceholderPage({ title, titleEn, eyebrow }) {
  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="page-head-left">
          <div className="page-eyebrow">{eyebrow}</div>
          <h1 className="page-title" data-en={titleEn}>{title}</h1>
        </div>
        <div className="session-tag">{eyebrow}</div>
      </div>
      <div className="page-coming">
        Bu sayfa henüz taşınıyor — bir sonraki oturumda doldurulacak.
      </div>
    </div>
  );
}

export default function App() {
  const auth     = useAuth();
  const appState = useAppState();
  const [page, setPage]   = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('femme_theme') || 'space');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('femme_theme', theme);
  }, [theme]);

  const PAGES = {
    dashboard: <Dashboard appState={appState} />,
    symptoms:  <PlaceholderPage title="Semptomlar"     titleEn="SYMPTOMS" eyebrow="Session II"   />,
    body:      <PlaceholderPage title="Beden"          titleEn="BODY"     eyebrow="Session III"  />,
    meals:     <PlaceholderPage title="Yemek Günlüğü"  titleEn="MEALS"    eyebrow="Session IV"   />,
    cycle:     <PlaceholderPage title="Döngü"          titleEn="CYCLE"    eyebrow="Session V"    />,
    food:      <PlaceholderPage title="Beslenme"       titleEn="FOOD"     eyebrow="Session VI"   />,
    skin:      <PlaceholderPage title="Cilt"           titleEn="SKIN"     eyebrow="Session VII"  />,
    fitness:   <PlaceholderPage title="Spor"           titleEn="FITNESS"  eyebrow="Session VIII" />,
    insights:  <PlaceholderPage title="Öngörüler"      titleEn="INSIGHTS" eyebrow="Session IX"   />,
    chat:      <PlaceholderPage title="Sohbet"         titleEn="CHAT"     eyebrow="Session X"    />,
    settings:  <PlaceholderPage title="Ayarlar"        titleEn="SETTINGS" eyebrow="Session XI"   />,
  };

  if (!auth.isLoggedIn) {
    return (
      <>
        <div className="halftone" />
        <div className="stars" />
        <Login auth={auth} />
      </>
    );
  }

  return (
    <>
      <div className="halftone" />
      <div className="stars" />
      <div className="app">
        <Sidebar
          page={page}
          onNavigate={setPage}
          user={auth.user}
          onLogout={auth.logout}
          theme={theme}
          onThemeChange={setTheme}
        />
        <main className="main" key={page}>
          {PAGES[page] ?? PAGES.dashboard}
        </main>
      </div>
    </>
  );
}
