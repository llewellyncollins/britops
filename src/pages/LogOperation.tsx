import { useEffect } from 'react';
import { OperationForm } from '../components/operations/OperationForm';
import { trackPageView } from '../firebase/analytics';

export function LogOperation() {
  useEffect(() => {
    document.title = 'Log Operation — Theatrelog';
    trackPageView({ page_name: 'LogOperation' });
    return () => { document.title = 'Theatrelog'; };
  }, []);
  return <OperationForm />;
}
