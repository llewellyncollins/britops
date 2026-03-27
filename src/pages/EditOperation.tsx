import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexie';
import { OperationForm } from '../components/operations/OperationForm';
import { trackPageView } from '../firebase/analytics';

export function EditOperation() {
  const { id } = useParams<{ id: string }>();
  useEffect(() => { trackPageView({ page_name: 'EditOperation' }); }, []);
  const operation = useLiveQuery(() => id ? db.operations.get(id) : undefined, [id]);

  if (operation === undefined) return <div className="p-4 text-center text-text-muted">Loading...</div>;
  if (operation === null) return <Navigate to="/" replace />;

  return <OperationForm existing={operation} />;
}
