import { useOperations } from '../hooks/useOperations';
import { OperationList } from '../components/operations/OperationList';

export function Dashboard() {
  const { operations } = useOperations();

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Logbook</h2>
        <span className="text-sm text-text-muted">{operations.length} operations</span>
      </div>
      <OperationList operations={operations} />
    </div>
  );
}
