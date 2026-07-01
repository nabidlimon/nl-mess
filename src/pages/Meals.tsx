import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, writeBatch, doc, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Member, Meal } from '../types';
import { Save, ChevronLeft, ChevronRight, Check, X, Clock, AlertCircle, Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth, getDaysInMonth, addMonths, subMonths, parse } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useMonth } from '../contexts/MonthContext';

export default function Meals() {
  const { currentMess, userProfile, isSupreme } = useAuth();
  const { t, language } = useLanguage();
  const { selectedMonth, setSelectedMonth } = useMonth();
  const isAdmin = userProfile?.role === 'Manager' || userProfile?.role === 'MealManager' || isSupreme;
  const [members, setMembers] = useState<Member[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Local state for edits
  const [editedMeals, setEditedMeals] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Meal[]>([]);

  // Fetch pending guest meal requests
  useEffect(() => {
    if (!currentMess || !isAdmin) return;

    const q = query(
      collection(db, 'meals'),
      where('messId', '==', currentMess.id)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const allMeals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Meal));
      const pending = allMeals.filter(m => 
        (m.pendingGuestMorning && m.pendingGuestMorning > 0) ||
        (m.pendingGuestLunch && m.pendingGuestLunch > 0) ||
        (m.pendingGuestDinner && m.pendingGuestDinner > 0)
      );
      pending.sort((a, b) => a.date.localeCompare(b.date));
      setPendingRequests(pending);
    }, (error) => {
      console.warn("pendingRequests onSnapshot error:", error);
    });

    return () => unsub();
  }, [currentMess, isAdmin]);

  const handleApproveGuest = async (meal: Meal) => {
    try {
      const pm = meal.pendingGuestMorning || 0;
      const pl = meal.pendingGuestLunch || 0;
      const pd = meal.pendingGuestDinner || 0;

      const newGuestMorning = (meal.guestMorning || 0) + pm;
      const newGuestLunch = (meal.guestLunch || 0) + pl;
      const newGuestDinner = (meal.guestDinner || 0) + pd;

      let ownMealCount = 0;
      if (meal.morning !== undefined) {
        if (meal.morning) ownMealCount += 0.5;
        if (meal.lunch) ownMealCount += 1;
        if (meal.dinner) ownMealCount += 1;
      } else {
        ownMealCount = (meal.mealCount || 0) - ((meal.guestMorning || 0) * 0.5 + (meal.guestLunch || 0) + (meal.guestDinner || 0));
        if (ownMealCount < 0) ownMealCount = 0;
      }

      const newMealCount = ownMealCount + (newGuestMorning * 0.5) + newGuestLunch + newGuestDinner;
      const newDisplayValue = String(newMealCount);

      const batch = writeBatch(db);
      batch.update(doc(db, 'meals', meal.id), {
        guestMorning: newGuestMorning,
        guestLunch: newGuestLunch,
        guestDinner: newGuestDinner,
        pendingGuestMorning: 0,
        pendingGuestLunch: 0,
        pendingGuestDinner: 0,
        mealCount: newMealCount,
        displayValue: newDisplayValue,
        updatedAt: serverTimestamp()
      });

      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        id: notifRef.id,
        userId: meal.memberId,
        messId: currentMess?.id,
        title: language === 'bn' ? 'গেস্ট মিল অনুমোদিত' : 'Guest Meal Approved',
        message: language === 'bn'
          ? `আপনার ${meal.date} তারিখের গেস্ট মিলের অনুরোধটি অনুমোদিত হয়েছে। (সকাল: ${pm}, দুপুর: ${pl}, রাত: ${pd})`
          : `Your guest meal request for ${meal.date} has been approved. (Morning: ${pm}, Lunch: ${pl}, Dinner: ${pd})`,
        type: 'MealUpdate',
        read: false,
        createdAt: serverTimestamp()
      });

      await batch.commit();
    } catch (error) {
      console.error("Error approving guest meal:", error);
    }
  };

  const handleDeclineGuest = async (meal: Meal) => {
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'meals', meal.id), {
        pendingGuestMorning: 0,
        pendingGuestLunch: 0,
        pendingGuestDinner: 0,
        updatedAt: serverTimestamp()
      });

      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        id: notifRef.id,
        userId: meal.memberId,
        messId: currentMess?.id,
        title: language === 'bn' ? 'গেস্ট মিল প্রত্যাখ্যান' : 'Guest Meal Declined',
        message: language === 'bn'
          ? `আপনার ${meal.date} তারিখের গেস্ট মিলের অনুরোধটি প্রত্যাখ্যান করা হয়েছে।`
          : `Your guest meal request for ${meal.date} has been declined.`,
        type: 'MealUpdate',
        read: false,
        createdAt: serverTimestamp()
      });

      await batch.commit();
    } catch (error) {
      console.error("Error declining guest meal:", error);
    }
  };

  // Fetch data
  useEffect(() => {
    if (!currentMess) {
      setLoading(false);
      return;
    }
    const unsubMembers = onSnapshot(query(
      collection(db, 'users'), 
      where('messId', '==', currentMess.id), 
      where('role', 'in', ['Manager', 'Border', 'MealManager'])
    ), (snapshot) => {
      let fetchedMembers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
      fetchedMembers.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });
      setMembers(fetchedMembers);
    }, (error) => {
      console.warn("unsubMembers onSnapshot error:", error);
    });

    const unsubMeals = onSnapshot(query(
      collection(db, 'meals'), 
      where('messId', '==', currentMess.id)
    ), (snapshot) => {
      let fetchedMeals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Meal));
      fetchedMeals.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });
      setMeals(fetchedMeals);
      setLoading(false);
    }, (error) => {
      console.warn("unsubMeals onSnapshot error:", error);
      setLoading(false);
    });

    return () => { unsubMembers(); unsubMeals(); };
  }, [currentMess]);

  const currentMonthDate = parse(selectedMonth, 'yyyy-MM', new Date());
  const daysInMonth = getDaysInMonth(currentMonthDate);
  const monthStr = selectedMonth;

  const navigateMonth = (amount: number) => {
    const newDate = addMonths(currentMonthDate, amount);
    setSelectedMonth(format(newDate, 'yyyy-MM'));
  };

  // Create a map to quickly look up meals: `${memberId}_${dateString}` -> Meal object
  const mealMap = meals.reduce((acc, m) => {
    if (m.date.startsWith(monthStr)) {
      acc[`${m.memberId}_${m.date}`] = m;
    }
    return acc;
  }, {} as Record<string, Meal>);

  const handleMealChange = (memberId: string, day: number, value: string) => {
    const valUpper = value.toUpperCase().trim();
    const validPattern = /^(\d+(\.\d*)?[ND]??|)$/;
    
    if (validPattern.test(valUpper)) {
      const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`;
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      
      if (!isAdmin) {
        if (memberId !== userProfile?.id) return;
        if (dateStr <= todayStr) return;
      }

      const key = `${memberId}_${dateStr}`;
      setEditedMeals(prev => ({ ...prev, [key]: valUpper }));
    }
  };

  const parseMealFlags = (val: string) => {
    const valUpper = val.toUpperCase().trim();
    let morning = false;
    let lunch = false;
    let dinner = false;

    if (valUpper === '2.5') {
      morning = true;
      lunch = true;
      dinner = true;
    } else if (valUpper === '2') {
      morning = false;
      lunch = true;
      dinner = true;
    } else if (valUpper === '1.5' || valUpper === '1.5D') {
      morning = true;
      lunch = true;
      dinner = false;
    } else if (valUpper === '1.5N') {
      morning = true;
      lunch = false;
      dinner = true;
    } else if (valUpper === '1' || valUpper === '1D') {
      morning = false;
      lunch = true;
      dinner = false;
    } else if (valUpper === '1N') {
      morning = false;
      lunch = false;
      dinner = true;
    } else if (valUpper === '0.5') {
      morning = true;
      lunch = false;
      dinner = false;
    } else {
      const num = parseFloat(valUpper) || 0;
      if (num >= 2.5) {
        morning = true;
        lunch = true;
        dinner = true;
      } else if (num >= 2) {
        lunch = true;
        dinner = true;
      } else if (num >= 1.5) {
        morning = true;
        lunch = true;
      } else if (num >= 1) {
        lunch = true;
      } else if (num >= 0.5) {
        morning = true;
      }
    }
    return { morning, lunch, dinner };
  };

  const parseMealCount = (val: string) => {
    if (val === '') return 0;
    if (val.includes('N') || val.includes('D')) return parseFloat(val.replace(/[ND]/g, '')) || 0;
    return parseFloat(val) || 0;
  };
  
  const parseDisplayValue = (val: string) => {
    if (val === '0' || val === '') return '';
    if (val.endsWith('.')) return val.slice(0, -1);
    return val;
  };

  const saveChanges = async () => {
    if (Object.keys(editedMeals).length === 0) return;
    setSaving(true);
    
    try {
      const batch = writeBatch(db);
      const modifiedMembers = new Set<string>();
      
      Object.entries(editedMeals).forEach(([key, val]: [string, string]) => {
        const [memberId, date] = key.split('_');
        const existingMeal = mealMap[key];
        
        if (memberId !== userProfile?.id) {
          modifiedMembers.add(memberId);
        }
        
        const count = parseMealCount(val);
        const display = parseDisplayValue(val);
        const { morning, lunch, dinner } = parseMealFlags(val);
        
        if (existingMeal) {
          // Update
          batch.update(doc(db, 'meals', existingMeal.id), { 
            mealCount: count, 
            displayValue: display,
            morning,
            lunch,
            dinner
          });
        } else {
          // Create
          const newDocRef = doc(collection(db, 'meals'));
          batch.set(newDocRef, {
            memberId,
            messId: currentMess?.id,
            date,
            mealCount: count,
            displayValue: display,
            morning,
            lunch,
            dinner,
            createdAt: new Date().toISOString()
          });
        }
      });

      // Send personalized alerting notifications to any modified members
      modifiedMembers.forEach(memId => {
        const notifRef = doc(collection(db, 'notifications'));
        batch.set(notifRef, {
          id: notifRef.id,
          userId: memId,
          messId: currentMess?.id,
          title: language === 'bn' ? 'মিল তথ্য আপডেট করা হয়েছে' : 'Meal Status Updated',
          message: language === 'bn'
            ? 'ম্যানেজার কর্তৃক আপনার মিলের বৈচিত্র্য বা সংখ্যা সংশোধন করা হয়েছে। অনুগ্রহ করে চেক করুন।'
            : 'Your meal logs have been modified by the meal/mess manager. Please check.',
          type: 'MealUpdate',
          read: false,
          createdAt: serverTimestamp()
        });
      });

      await batch.commit();
      setEditedMeals({});
    } catch (error) {
      console.error('Error saving meals', error);
    } finally {
      setSaving(false);
    }
  };

  // Calculations
  const getMealValue = (memberId: string, day: number) => {
    const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`;
    const key = `${memberId}_${dateStr}`;
    
    if (editedMeals[key] !== undefined) return editedMeals[key];
    if (mealMap[key]) return mealMap[key].displayValue || (mealMap[key].mealCount > 0 ? String(mealMap[key].mealCount) : '');
    return '';
  };

  const parseComputedTotal = (valueStr: string | number) => {
    const str = String(valueStr);
    if (str === '') return 0;
    if (str.includes('N') || str.includes('D')) return parseFloat(str.replace(/[ND]/g, '')) || 0;
    return parseFloat(str) || 0;
  };

  const getMemberTotal = (memberId: string) => {
    let total = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      total += parseComputedTotal(getMealValue(memberId, day));
    }
    return total;
  };

  const getDailyTotal = (day: number) => {
    let total = 0;
    members.forEach(m => {
      total += parseComputedTotal(getMealValue(m.id, day));
    });
    return total;
  };

  const getDailyMealSegments = (day: number) => {
    let morningCount = 0;
    let noonCount = 0;
    let nightCount = 0;

    members.forEach(m => {
      const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`;
      const key = `${m.id}_${dateStr}`;
      const mDoc = mealMap[key];

      if (mDoc) {
        // Count own meals using booleans if defined
        if (mDoc.morning !== undefined) {
          if (mDoc.morning) morningCount += 1;
          if (mDoc.lunch) noonCount += 1;
          if (mDoc.dinner) nightCount += 1;
        } else {
          // Fallback to displayValue parsing for own meals
          const val = String(mDoc.displayValue || mDoc.mealCount || '').toUpperCase().trim();
          if (val.includes('0.5') || val.includes('1.5') || val.includes('2.5')) morningCount += 1;
          if (val.includes('D') || val === '1' || val === '2' || val === '1.5' || val === '2.5') noonCount += 1;
          if (val.includes('N') || val === '2' || val === '2.5') nightCount += 1;
        }

        // Add approved guest meals
        morningCount += mDoc.guestMorning || 0;
        noonCount += mDoc.guestLunch || 0;
        nightCount += mDoc.guestDinner || 0;
      } else {
        // Fallback if there is no document but edited meals local state exists
        const val = String(getMealValue(m.id, day)).toUpperCase().trim();
        if (val === '') return;
        if (val.includes('0.5') || val.includes('1.5') || val.includes('2.5')) morningCount += 1;
        if (val.includes('D') || val === '1' || val === '2' || val === '1.5' || val === '2.5') noonCount += 1;
        if (val.includes('N') || val === '2' || val === '2.5') nightCount += 1;
      }
    });

    return { morning: morningCount, noon: noonCount, night: nightCount };
  };

  const getMonthlySegmentTotal = (segment: 'morning' | 'noon' | 'night') => {
    let total = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      total += getDailyMealSegments(day)[segment];
    }
    return total;
  };

  const monthTotal = members.reduce((sum, m) => sum + getMemberTotal(m.id), 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 pb-6">
        <div className="w-full md:w-auto">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 font-display">{t('meals.title')}</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">{t('meals.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full md:w-auto items-stretch sm:items-center gap-3">
          <div className="flex flex-1 sm:flex-none justify-between items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <button onClick={() => navigateMonth(-1)} className="p-3 hover:bg-slate-50 border-r border-slate-200 cursor-pointer flex-none transition-colors active:bg-slate-100">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="px-5 py-2 font-bold min-w-[130px] text-center flex-1 text-sm text-slate-800">
              {format(currentMonthDate, 'MMMM yyyy')}
            </div>
            <button onClick={() => navigateMonth(1)} className="p-3 hover:bg-slate-50 border-l border-slate-200 cursor-pointer flex-none transition-colors active:bg-slate-100">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          <button 
            onClick={saveChanges}
            disabled={saving || Object.keys(editedMeals).length === 0}
            className={`px-5 py-3 sm:py-2 rounded-xl flex items-center justify-center gap-2 transition-all sm:h-full shadow-sm text-sm font-semibold flex-1 sm:flex-none cursor-pointer ${
              Object.keys(editedMeals).length > 0 
              ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]' 
              : 'bg-slate-100 text-slate-400 border border-slate-200/60 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" /> {saving ? t('common.saving') : t('meals.save_btn')}
            {Object.keys(editedMeals).length > 0 && <span className="ml-2 bg-white text-blue-600 text-xs font-black px-2 py-0.5 rounded-full shadow-sm">{Object.keys(editedMeals).length}</span>}
          </button>
        </div>
      </div>

      {/* ── Pending Guest Meals Approval Panel ── */}
      {isAdmin && pendingRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
            <Users className="w-5 h-5 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-800">
              {language === 'bn' ? 'গেস্ট মিল অনুমোদনের অনুরোধ' : 'Pending Guest Meals Approval'}
            </h2>
            <span className="bg-indigo-50 text-indigo-600 text-xs font-black px-2 py-0.5 rounded-full shadow-sm">
              {pendingRequests.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {pendingRequests.map((meal) => {
              const border = members.find(m => m.id === meal.memberId);
              const pm = meal.pendingGuestMorning || 0;
              const pl = meal.pendingGuestLunch || 0;
              const pd = meal.pendingGuestDinner || 0;

              return (
                <div key={meal.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-between gap-3 transition-all hover:shadow-sm">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-800 text-xs truncate">{border?.name || 'Border'}</p>
                      <span className="text-[9px] font-mono font-bold bg-white text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 shadow-sm shrink-0">
                        {meal.date}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {pm > 0 && (
                        <span className="text-[9px] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100">
                          🌅 Morn: {pm}
                        </span>
                      )}
                      {pl > 0 && (
                        <span className="text-[9px] font-bold bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded border border-orange-100">
                          ☀️ Lunch: {pl}
                        </span>
                      )}
                      {pd > 0 && (
                        <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">
                          🌙 Din: {pd}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1.5 border-t border-slate-200/50">
                    <button
                      onClick={() => handleDeclineGuest(meal)}
                      className="flex-1 py-1.5 text-[11px] font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition-colors active:scale-95 flex items-center justify-center gap-1"
                    >
                      <X className="w-3 h-3 text-red-500" /> {language === 'bn' ? 'বাতিল' : 'Decline'}
                    </button>
                    <button
                      onClick={() => handleApproveGuest(meal)}
                      className="flex-1 py-1.5 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer transition-colors active:scale-95 flex items-center justify-center gap-1 shadow-sm shadow-indigo-600/20"
                    >
                      <Check className="w-3 h-3" /> {language === 'bn' ? 'অনুমোদন' : 'Approve'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto excel-table-container">
          <table className="min-w-full divide-y divide-slate-200 border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="sticky left-0 z-20 bg-slate-50 px-2 md:px-4 py-3 text-left text-[10px] uppercase font-bold text-slate-500 tracking-wider border-r border-slate-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]">{t('meals.member')}</th>
                {Array.from({ length: daysInMonth }).map((_, i) => (
                  <th key={i} className="px-1 md:px-2 py-3 text-center text-[10px] font-bold text-slate-500 border-r border-slate-200 min-w-[44px] md:min-w-[48px]">{i + 1}</th>
                ))}
                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-50 md:sticky right-auto md:right-0 z-20 md:shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.05)]">{t('meals.total')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {members.map(member => (
                <tr key={member.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="sticky left-0 z-10 bg-white px-2 md:px-4 py-2 text-sm font-medium text-slate-900 border-r border-slate-100 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)] whitespace-nowrap max-w-[100px] md:max-w-none overflow-hidden text-ellipsis">
                    {member.name}
                  </td>
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const val = getMealValue(member.id, day);
                    const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`;
                    const isEdited = editedMeals[`${member.id}_${dateStr}`] !== undefined;
                    
                    const todayStr = format(new Date(), 'yyyy-MM-dd');
                    const isReadOnly = !isAdmin && (member.id !== userProfile?.id || dateStr <= todayStr);

                    const key = `${member.id}_${dateStr}`;
                    const mDoc = mealMap[key];
                    const approvedGuestTotal = mDoc ? ((mDoc.guestMorning || 0) + (mDoc.guestLunch || 0) + (mDoc.guestDinner || 0)) : 0;
                    const pendingGuestTotal = mDoc ? ((mDoc.pendingGuestMorning || 0) + (mDoc.pendingGuestLunch || 0) + (mDoc.pendingGuestDinner || 0)) : 0;

                    return (
                      <td key={i} className={`p-0 border-r border-slate-100 relative ${isEdited ? 'bg-yellow-50/50' : ''}`}>
                        <input
                          type="text"
                          value={val}
                          readOnly={isReadOnly}
                          onChange={(e) => handleMealChange(member.id, day, e.target.value)}
                          className={`w-full h-full min-h-[44px] text-center text-sm font-mono border-none bg-transparent focus:ring-2 focus:ring-inset focus:ring-blue-600 outline-none ${isReadOnly ? 'cursor-default text-slate-500' : 'cursor-text hover:bg-slate-50 font-medium text-slate-900'}`}
                        />
                        
                        {/* Guest meal badges */}
                        {approvedGuestTotal > 0 && (
                          <span className="absolute top-0.5 right-0.5 text-[8px] font-black text-emerald-600 leading-none pointer-events-none select-none bg-emerald-50 px-0.5 py-0.5 rounded shadow-sm border border-emerald-100/60">
                            +{approvedGuestTotal}G
                          </span>
                        )}
                        {pendingGuestTotal > 0 && (
                          <span className="absolute top-0.5 right-0.5 text-[8px] font-black text-amber-600 leading-none pointer-events-none select-none bg-amber-50 px-0.5 py-0.5 rounded shadow-sm border border-amber-100/60 animate-pulse">
                            +{pendingGuestTotal}G?
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2 text-center font-mono text-sm font-bold text-slate-900 bg-slate-50 md:sticky right-auto md:right-0 z-10 md:shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                    {getMemberTotal(member.id)}
                  </td>
                </tr>
              ))}
              
              {/* Daily Totals Row */}
              <tr className="bg-slate-50 border-t border-slate-200">
                <td className="sticky left-0 z-10 bg-slate-50 px-2 md:px-4 py-3 text-[10px] md:text-xs uppercase tracking-wider font-bold text-slate-600 border-r border-slate-200 text-right shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                  {t('meals.daily_total')}
                </td>
                {Array.from({ length: daysInMonth }).map((_, i) => (
                  <td key={i} className="px-1 md:px-2 py-3 text-center font-mono text-sm font-bold text-slate-600 border-r border-slate-200">
                    {getDailyTotal(i + 1)}
                  </td>
                ))}
                <td className="px-4 py-3 text-center font-mono text-base font-black text-blue-700 bg-blue-100 md:sticky right-auto md:right-0 z-10 md:shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                  {monthTotal}
                </td>
              </tr>

              {/* Morning Segment Row */}
              <tr className="bg-amber-50/30 text-amber-900 border-t border-slate-100">
                <td className="sticky left-0 z-10 bg-amber-50 px-2 md:px-4 py-2 text-[10px] md:text-xs tracking-wider font-bold border-r border-slate-200 text-right shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                  🌅 {t('meals.segment_morning') || 'Morning (0.5)'}
                </td>
                {Array.from({ length: daysInMonth }).map((_, i) => (
                  <td key={i} className="px-1 md:px-2 py-2 text-center font-mono text-xs font-semibold text-amber-800 border-r border-slate-200">
                    {getDailyMealSegments(i + 1).morning}
                  </td>
                ))}
                <td className="px-4 py-2 text-center font-mono text-sm font-bold bg-amber-100/80 text-amber-900 md:sticky right-auto md:right-0 z-10 md:shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                  {getMonthlySegmentTotal('morning')}
                </td>
              </tr>

              {/* Noon Segment Row */}
              <tr className="bg-orange-50/30 text-orange-900 border-t border-slate-100">
                <td className="sticky left-0 z-10 bg-orange-50 px-2 md:px-4 py-2 text-[10px] md:text-xs tracking-wider font-bold border-r border-slate-200 text-right shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                  ☀️ {t('meals.segment_lunch') || 'Lunch (1.0)'}
                </td>
                {Array.from({ length: daysInMonth }).map((_, i) => (
                  <td key={i} className="px-1 md:px-2 py-2 text-center font-mono text-xs font-semibold text-orange-800 border-r border-slate-200">
                    {getDailyMealSegments(i + 1).noon}
                  </td>
                ))}
                <td className="px-4 py-2 text-center font-mono text-sm font-bold bg-orange-100/80 text-orange-900 md:sticky right-auto md:right-0 z-10 md:shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                  {getMonthlySegmentTotal('noon')}
                </td>
              </tr>

              {/* Night Segment Row */}
              <tr className="bg-indigo-50/30 text-indigo-900 border-t border-slate-100">
                <td className="sticky left-0 z-10 bg-indigo-50 px-2 md:px-4 py-2 text-[10px] md:text-xs tracking-wider font-bold border-r border-slate-200 text-right shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                  🌙 {t('meals.segment_dinner') || 'Dinner (1.0)'}
                </td>
                {Array.from({ length: daysInMonth }).map((_, i) => (
                  <td key={i} className="px-1 md:px-2 py-2 text-center font-mono text-xs font-semibold text-indigo-800 border-r border-slate-200">
                    {getDailyMealSegments(i + 1).night}
                  </td>
                ))}
                <td className="px-4 py-2 text-center font-mono text-sm font-bold bg-indigo-100/80 text-indigo-900 md:sticky right-auto md:right-0 z-10 md:shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                  {getMonthlySegmentTotal('night')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
