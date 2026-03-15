import { useState, useEffect } from 'react';
import { type User } from 'firebase/auth';
import { onAuthChange } from '../firebase/auth';
import { isConfigured } from '../firebase/config';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isConfigured);

  useEffect(() => {
    const unsubscribe = onAuthChange(u => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, loading, isConfigured };
}
