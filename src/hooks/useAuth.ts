import { useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';

import { auth } from '@/src/services/firebase';

type AuthState = {
  user: User | null;
  initializing: boolean;
};

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    // onAuthStateChanged で認証状態を監視
    // Firebase が永続化されたセッションを復元するのを待つ
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[useAuth] Auth state changed:', firebaseUser?.uid ?? 'null');
      
      if (firebaseUser) {
        // 既存ユーザーがいる場合はそのまま使用
        console.log('[useAuth] Using existing user:', firebaseUser.uid);
        setUser(firebaseUser);
        setInitializing(false);
      } else if (!hasCheckedAuth.current) {
        // 初回のみ: ユーザーがいない場合は匿名ログイン
        hasCheckedAuth.current = true;
        console.log('[useAuth] No user found, signing in anonymously...');
        try {
          const result = await signInAnonymously(auth);
          console.log('[useAuth] Anonymous sign-in successful:', result.user.uid);
          // onAuthStateChanged が再度呼ばれるので、ここでは setUser しない
        } catch (error) {
          console.error('[useAuth] Anonymous sign-in failed:', error);
          setInitializing(false);
        }
      } else {
        // 2回目以降でユーザーがnullの場合
        setUser(null);
        setInitializing(false);
      }
    });

    return unsubscribe;
  }, []);

  return { user, initializing };
}

