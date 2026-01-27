import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';

import { auth } from '@/src/services/firebase';

type AuthState = {
  user: User | null;
  initializing: boolean;
};

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setInitializing(false);
    });

    if (!auth.currentUser) {
      signInAnonymously(auth).catch((error) => {
        console.error('Anonymous sign-in failed', error);
      });
    }

    return unsubscribe;
  }, []);

  return { user, initializing };
}

