import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import './styles/global.css';
import './App.css';

const THEMES = ['space', 'moon', 'vinyl'];

const PAGES = {
  dashboard: () => <PlaceholderPage title="Bugün"          titleEn="TODAY"    eyebrow="Session I"    />,
  symptoms:  () => <PlaceholderPage title="Semptomlar"     titleEn="SYMPTOMS" eyebrow="Session II"   />,
  body:      () => <PlaceholderPage title="Beden"          titleEn="BODY"     eyebrow="Session III"  />,
  meals:     () => <PlaceholderPage title="Yemek Günlüğü"  titleEn="MEALS"    eyebrow="Session IV"   />,
  cycle:     () => <PlaceholderPage title="Döngü"          titleEn="CYCLE"    eyebrow="Session V"    />,
  food:      () => <PlaceholderPage title="Beslenme"       titleEn="FOOD"     eyebrow="Session VI"   />,
  skin:      () => <PlaceholderPage title="Cilt"           titleEn="SKIN"     eyebrow="Session VII"  />,
  fitness:   () => <PlaceholderPage title="Spor"           titleEn="FITNESS"  eyebrow="Session VIII" />,
  insights:  () => <PlaceholderPage title="Öngörüler"      titleEn="INSIGHTS" eyebrow="Session IX"   />,
  chat:      () => <PlaceholderPage title="Sohbet"         titleEn="CHAT"     eyebrow="Session X"    />,
  settings:  () => <PlaceholderPage title="Ayarlar"        titleEn="SETTINGS" eyebrow="Session XI"   />,
};

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
  const auth = useAuth();
  const [page, setPage]   = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('femme_theme') || 'space');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('femme_theme', theme);
  }, [theme]);

  const PageComponent = PAGES[page] || PAGES.dashboard;

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
          <PageComponent />
        </main>
      </div>
    </>
  );
}
