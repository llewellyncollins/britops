import { useEffect } from 'react';
import { OperationForm } from '../components/operations/OperationForm';
import { trackPageView } from '../firebase/analytics';

export function LogOperation() {
  useEffect(() => { trackPageView({ page_name: 'LogOperation' }); }, []);
  return <OperationForm />;
}
