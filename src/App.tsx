import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { LogOperation } from './pages/LogOperation';
import { EditOperation } from './pages/EditOperation';
import { Portfolio } from './pages/Portfolio';
import { SettingsPage } from './pages/SettingsPage';
import { SupportPage } from './pages/SupportPage';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { Login } from './pages/Login';
import { RouteAnnouncer } from './components/common/RouteAnnouncer';
import { useAuth } from './hooks/useAuth';
import { useSync } from './hooks/useSync';
import { SyncProvider } from './context/SyncContext';
import { useSettingsStore } from './stores/useSettingsStore';
import { setAnalyticsUserProperties } from './firebase/analytics';

export default function App() {
  const { user } = useAuth();
  const { syncing } = useSync(user);
  const theme = useSettingsStore((s) => s.theme);
  const specialty = useSettingsStore((s) => s.specialty);
  const grade = useSettingsStore((s) => s.grade);

  useEffect(() => {
    if (user) {
      setAnalyticsUserProperties({
        specialty: specialty ?? 'not_set',
        grade: grade ?? 'not_set',
      });
    }
  }, [user, specialty, grade]);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
      return;
    }
    if (theme === 'light') {
      html.classList.remove('dark');
      return;
    }
    // 'system' — follow OS preference
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => html.classList.toggle('dark', mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  return (
    <SyncProvider syncing={syncing}>
      <BrowserRouter>
        <RouteAnnouncer />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route element={<AppShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/log" element={<LogOperation />} />
            <Route path="/edit/:id" element={<EditOperation />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/support" element={<SupportPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SyncProvider>
  );
}
