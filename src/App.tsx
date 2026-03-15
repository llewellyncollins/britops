import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { LogOperation } from './pages/LogOperation';
import { EditOperation } from './pages/EditOperation';
import { Portfolio } from './pages/Portfolio';
import { SettingsPage } from './pages/SettingsPage';
import { Login } from './pages/Login';
import { useAuth } from './hooks/useAuth';
import { useSync } from './hooks/useSync';
import { SyncProvider } from './context/SyncContext';

export default function App() {
  const { user } = useAuth();
  const { syncing } = useSync(user);

  return (
    <SyncProvider syncing={syncing}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AppShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/log" element={<LogOperation />} />
            <Route path="/edit/:id" element={<EditOperation />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SyncProvider>
  );
}
