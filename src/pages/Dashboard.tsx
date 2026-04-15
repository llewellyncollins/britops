import { useEffect } from 'react';
import { useOperations } from '../hooks/useOperations';
import { OperationList } from '../components/operations/OperationList';
import { trackPageView } from '../firebase/analytics';

export function Dashboard() {
  const { operations } = useOperations();
  useEffect(() => {
    document.title = 'Logbook — Theatrelog';
    trackPageView({ page_name: 'Dashboard' });
    return () => { document.title = 'Theatrelog'; };
  }, []);

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Logbook</h1>
        <span className="text-sm text-text">{operations.length} operations</span>
      </div>
      <OperationList operations={operations} />
    </div>
  );
}
