import { useCallback, useEffect, useState } from 'react';
import { AppTopBar } from './components/AppTopBar';
import { CameraPage } from './pages/CameraPage';
import { DashboardPage } from './pages/DashboardPage';
import { LayoutPage } from './pages/LayoutPage';
import './App.css';

type AppPath = '/' | '/layout' | '/camera';
type AppRoute = {
  path: AppPath;
  roomNumber?: string;
};

function normalizePath(pathname: string): AppPath {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  if (cleanPath === '/layout') {
    return '/layout';
  }

  if (cleanPath === '/camera') {
    return '/camera';
  }

  return '/';
}

function readRoute(location: Location): AppRoute {
  const path = normalizePath(location.pathname);
  const roomNumber = path === '/camera' ? new URLSearchParams(location.search).get('room') ?? undefined : undefined;
  return { path, roomNumber };
}

function buildUrl(path: AppPath, roomNumber?: string): string {
  if (path !== '/camera' || !roomNumber) {
    return path;
  }

  return `${path}?room=${encodeURIComponent(roomNumber)}`;
}

function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => readRoute(window.location));

  useEffect(() => {
    const normalizedRoute = readRoute(window.location);
    const normalizedUrl = buildUrl(normalizedRoute.path, normalizedRoute.roomNumber);
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (normalizedUrl !== currentUrl) {
      window.history.replaceState({}, '', normalizedUrl);
    }

    const handlePopState = () => setCurrentRoute(readRoute(window.location));
    window.addEventListener('popstate', handlePopState);

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = useCallback((nextPath: AppPath, options?: { roomNumber?: string }) => {
    const nextUrl = buildUrl(nextPath, options?.roomNumber);
    const currentUrl = buildUrl(currentRoute.path, currentRoute.roomNumber);

    if (nextUrl === currentUrl) {
      return;
    }

    window.history.pushState({}, '', nextUrl);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    setCurrentRoute({ path: nextPath, roomNumber: options?.roomNumber });
  }, [currentRoute.path, currentRoute.roomNumber]);

  return (
    <div className="app-shell">
      <div className="app-frame">
        <AppTopBar currentPath={currentRoute.path} onNavigate={handleNavigate} />
        {currentRoute.path === '/layout' ? (
          <LayoutPage onOpenCamera={(roomNumber) => handleNavigate('/camera', { roomNumber })} />
        ) : currentRoute.path === '/camera' ? (
          <CameraPage
            selectedRoomNumber={currentRoute.roomNumber}
            onSelectRoom={(roomNumber) => handleNavigate('/camera', { roomNumber })}
          />
        ) : (
          <DashboardPage />
        )}
      </div>
    </div>
  );
}

export default App;
