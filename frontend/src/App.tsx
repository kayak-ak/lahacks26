import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { VoicePage } from './pages/VoicePage';

function App() {
  const pathname = window.location.pathname;

  if (pathname === '/dashboard' || pathname === '/') {
    return <DashboardPage />;
  }

  if (pathname === '/voice') {
    return <VoicePage />;
  }

  if (pathname === '/inventory') {
    return <InventoryPage />;
  }

  return <DashboardPage />;
}

export default App;
