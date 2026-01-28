import { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
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
  const [saving, setSaving] = useState(false);

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

      // デバッグ: メモの数をログに出力
      console.log(`[useMemos] Total memos: ${next.length}`);
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

  // 既存グループのドキュメントIDを取得
  const getGroupMemoId = (groupName: string): string | null => {
    const trimmedName = groupName.trim();
    if (!trimmedName) return null;
    const found = memos.find((m) => m.groupName.trim() === trimmedName);
    return found ? found.id : null;
  };

  // メモを保存（isNewGroup=trueの場合は新規作成、falseの場合は既存に追記）
  const saveMemo = async (text: string, groupName: string, isNewGroup: boolean = false) => {
    if (!userId) throw new Error('userId is required to save memo');
    if (saving) return; // 連打防止
    
    const trimmedText = text.trim();
    const trimmedGroupName = groupName.trim();
    if (!trimmedText) return;

    setSaving(true);
    
    try {
      // 既存グループを選択した場合（isNewGroup=false）
      if (!isNewGroup && trimmedGroupName) {
        const existingMemoId = getGroupMemoId(trimmedGroupName);
        
        if (existingMemoId) {
          // 既存のドキュメントに追記
          const memoRef = doc(db, 'memos', existingMemoId);
          const memoSnap = await getDoc(memoRef);
          
          if (memoSnap.exists()) {
            const existingData = memoSnap.data();
            const existingText = existingData.text ?? '';
            
            // 既存のテキストに改行して新しいテキストを追記
            const newText = existingText 
              ? `${existingText}\n${trimmedText}` 
              : trimmedText;
            
            console.log(`[saveMemo] Appending to existing group "${trimmedGroupName}" (id: ${existingMemoId})`);
            
            await updateDoc(memoRef, {
              text: newText,
            });
            return;
          }
        }
      }
      
      // 新規グループまたはグループなしの場合は新規作成
      console.log(`[saveMemo] Creating new memo with group "${trimmedGroupName}"`);
      const memosRef = collection(db, 'memos');
      await addDoc(memosRef, {
        text: trimmedText,
        groupName: trimmedGroupName,
        userId,
        createdAt: serverTimestamp(),
        color: '#9ca3af',
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    memos,
    groupNames,
    groupColors,
    saveMemo,
    saving,
  };
}

