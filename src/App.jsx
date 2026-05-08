import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './hooks/useAuth';
import { useAppState } from './hooks/useAppState';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Symptoms from './pages/Symptoms';
import Body from './pages/Body';
import Meals from './pages/Meals';
import Cycle from './pages/Cycle';
import Food from './pages/Food';
import Skin from './pages/Skin';
import Fitness from './pages/Fitness';
import Insights from './pages/Insights';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Sleep from './pages/Sleep';
import Supplements from './pages/Supplements';
import Sidebar from './components/Sidebar';
import './styles/global.css';
import './App.css';

export default function App() {
  const auth     = useAuth();
  const appState = useAppState();
  const [page, setPage]       = useState('dashboard');
  const [theme, setTheme]     = useState(() => localStorage.getItem('femme_theme') || 'space');
  const [navOpen, setNavOpen] = useState(false);

  const navigate = useCallback((p) => { setPage(p); setNavOpen(false); }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('femme_theme', theme);
  }, [theme]);

  const PAGES = {
    dashboard: <Dashboard appState={appState} />,
    symptoms:  <Symptoms  appState={appState} />,
    sleep:     <Sleep     appState={appState} />,
    body:      <Body      appState={appState} />,
    meals:       <Meals       appState={appState} />,
    supplements: <Supplements appState={appState} />,
    cycle:     <Cycle     appState={appState} />,
    food:      <Food      appState={appState} />,
    skin:      <Skin      appState={appState} />,
    fitness:   <Fitness   appState={appState} />,
    insights:  <Insights  appState={appState} />,
    chat:      <Chat      appState={appState} />,
    settings:  <Settings  appState={appState} onLogout={auth.logout} auth={auth} />,
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
        <button
          className="nav-toggle"
          type="button"
          aria-label={navOpen ? 'Menüyü kapat' : 'Menüyü aç'}
          onClick={() => setNavOpen(o => !o)}
        >
          {navOpen ? '✕' : '☰'}
        </button>
        {navOpen && <div className="nav-backdrop" onClick={() => setNavOpen(false)} />}
        <Sidebar
          page={page}
          onNavigate={navigate}
          user={auth.user}
          onLogout={auth.logout}
          theme={theme}
          onThemeChange={setTheme}
          isOpen={navOpen}
        />
        <main className="main" key={page}>
          {PAGES[page] ?? PAGES.dashboard}
        </main>
      </div>
    </>
  );
}
