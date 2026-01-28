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

  const saveMemo = async (text: string, groupName: string) => {
    if (!userId) throw new Error('userId is required to save memo');
    if (saving) return; // 連打防止
    
    const trimmedText = text.trim();
    const trimmedGroupName = groupName.trim();
    if (!trimmedText) return;

    setSaving(true);
    
    try {
      // 同じグループ名を持つ既存のメモを検索
      const existingMemo = memos.find(
        (m) => m.groupName.trim() === trimmedGroupName && trimmedGroupName.length > 0
      );

      if (existingMemo) {
        // 既存のメモが存在する場合は、そのドキュメントを取得して追記
        const memoRef = doc(db, 'memos', existingMemo.id);
        const memoSnap = await getDoc(memoRef);
        
        if (memoSnap.exists()) {
          const existingData = memoSnap.data();
          const existingText = existingData.text ?? '';
          const existingColor = existingData.color ?? '#9ca3af';
          
          // 既存のテキストに改行して新しいテキストを追記（1行改行）
          const newText = existingText 
            ? `${existingText}\n${trimmedText}` 
            : trimmedText;
          
          console.log(`[saveMemo] Appending to existing memo in group "${trimmedGroupName}"`);
          console.log(`[saveMemo] Old text length: ${existingText.length}, New text length: ${newText.length}`);
          
          await updateDoc(memoRef, {
            text: newText,
            // 色とグループ名は既存のものを保持
            color: existingColor,
          });
        } else {
          // ドキュメントが存在しない場合は新規作成
          const memosRef = collection(db, 'memos');
          await addDoc(memosRef, {
            text: trimmedText,
            groupName: trimmedGroupName,
            userId,
            createdAt: serverTimestamp(),
            color: '#9ca3af',
          });
        }
      } else {
        // 新しいグループまたはグループ名なしの場合は新規作成
        console.log(`[saveMemo] Creating new memo with group "${trimmedGroupName}"`);
        const memosRef = collection(db, 'memos');
        await addDoc(memosRef, {
          text: trimmedText,
          groupName: trimmedGroupName,
          userId,
          createdAt: serverTimestamp(),
          color: '#9ca3af',
        });
      }
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

