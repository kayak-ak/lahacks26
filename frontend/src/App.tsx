import { useState, useEffect } from 'react';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { VoicePage } from './pages/VoicePage';
import { TetrisPage } from './pages/TetrisPage';
import { LogsPage } from './pages/LogsPage';
import { HandoffPage } from './pages/HandoffPage';

function App() {
  const pathname = window.location.pathname;
  const [showTetris, setShowTetris] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.code === 'KeyP') {
        e.preventDefault();
        setShowTetris(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (showTetris) {
    return <TetrisPage />;
  }

  if (pathname === '/dashboard' || pathname === '/') {
    return <DashboardPage />;
  }

  if (pathname === '/voice') {
    return <VoicePage />;
  }

  if (pathname === '/inventory') {
    return <InventoryPage />;
  }

  if (pathname === '/logs') {
    return <LogsPage />;
  }

  if (pathname === '/handoff') {
    return <HandoffPage />;
  }

  return <DashboardPage />;
}

export default App;
