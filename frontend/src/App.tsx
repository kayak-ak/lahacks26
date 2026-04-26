import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConversationProvider } from '@elevenlabs/react';

import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { TetrisPage } from './pages/TetrisPage';
import { VoiceBubble } from './components/VoiceBubble';
import { LogsPage } from './pages/LogsPage';
import { HandoffPage } from './pages/HandoffPage';
import { AppLayout } from './components/AppLayout';

function App() {
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

  return (
    <ConversationProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/handoff" element={<HandoffPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <VoiceBubble />
    </ConversationProvider>
  );
}

export default App;
