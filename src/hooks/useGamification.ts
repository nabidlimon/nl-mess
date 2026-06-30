import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useMonth } from '../contexts/MonthContext';

export function useGamification() {
  const { currentMess } = useAuth();
  const { selectedMonth } = useMonth();
  const [badges, setBadges] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!currentMess) return;

    // Fetch deposits and meals for the month
    const currentMonthPrefix = selectedMonth;

    const qDeposits = query(collection(db, 'deposits'), where('messId', '==', currentMess.id));
    const unsubscribeDeposits = onSnapshot(qDeposits, (snap) => {
       const deps = snap.docs.map(d => d.data());
       
       // Calculate sums
       const userSums: Record<string, number> = {};
       const userCounts: Record<string, number> = {};
       deps.filter(d => d.date?.startsWith(currentMonthPrefix)).forEach(d => {
          userSums[d.memberId] = (userSums[d.memberId] || 0) + d.amount;
          userCounts[d.memberId] = (userCounts[d.memberId] || 0) + 1;
       });

       let highestDepositer = '';
       let maxAmount = 0;
       
       for (const userId in userSums) {
          if (userSums[userId] > maxAmount) {
             highestDepositer = userId;
             maxAmount = userSums[userId];
          }
       }
       
       setBadges(prev => {
          const next = { ...prev };
          // clear previous rich kids
          for (const key in next) {
             next[key] = next[key].filter(b => b !== '💰 Rich Kid' && b !== '🌟 Early Saver');
          }
          if (highestDepositer) {
             next[highestDepositer] = [...(next[highestDepositer] || []), '💰 Rich Kid'];
          }
          for (const userId in userCounts) {
             if (userId !== highestDepositer && userCounts[userId] > 0) {
                next[userId] = [...(next[userId] || []), '🌟 Early Saver'];
             }
          }
          return next;
       });
    }, (error) => {
       console.warn("unsubscribeDeposits onSnapshot error:", error);
    });

    return () => unsubscribeDeposits();
  }, [currentMess, selectedMonth]);

  return { badges };
}
