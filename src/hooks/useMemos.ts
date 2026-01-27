import { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';

import { db } from '@/src/services/firebase';

export type MemoItem = {
  id: string;
  text: string;
  groupName: string;
  userId: string;
  color?: string;
};

type UseMemosOptions = {
  userId?: string;
};

export function useMemos({ userId }: UseMemosOptions) {
  const [memos, setMemos] = useState<MemoItem[]>([]);

  useEffect(() => {
    if (!userId) {
      setMemos([]);
      return;
    }

    const memosRef = collection(db, 'memos');
    const q = query(
      memosRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const next: MemoItem[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as {
          text?: string;
          groupName?: string;
          userId?: string;
          color?: string;
        };
        return {
          id: docSnap.id,
          text: data.text ?? '',
          groupName: data.groupName ?? '',
          userId: data.userId ?? '',
          color: data.color,
        };
      });

      setMemos(next);
    });

    return unsubscribe;
  }, [userId]);

  const groupNames = useMemo(
    () =>
      Array.from(
        new Set(
          memos
            .map((m) => m.groupName.trim())
            .filter((name) => name.length > 0)
        )
      ),
    [memos]
  );

  // グループ名と色のマッピングを取得
  const groupColors = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of memos) {
      const name = m.groupName.trim();
      if (name.length > 0 && m.color && !map.has(name)) {
        map.set(name, m.color);
      }
    }
    return map;
  }, [memos]);

  const saveMemo = async (text: string, groupName: string) => {
    if (!userId) throw new Error('userId is required to save memo');
    const trimmedText = text.trim();
    const trimmedGroupName = groupName.trim();
    if (!trimmedText) return;

    const memosRef = collection(db, 'memos');
    await addDoc(memosRef, {
      text: trimmedText,
      groupName: trimmedGroupName,
      userId,
      createdAt: serverTimestamp(),
      color: '#9ca3af', // 入力画面から作るときは常にグレー
    });
  };

  return {
    memos,
    groupNames,
    groupColors,
    saveMemo,
  };
}

