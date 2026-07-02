import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { format, addDays } from 'date-fns';
import { Check, Sunrise, Sun, Moon, Plus, Minus, Users } from 'lucide-react';

export default function TomorrowMeal() {
  const { currentMess, userProfile, isSupreme } = useAuth();
  const { t, language } = useLanguage();
  const [morning, setMorning] = useState(false);
  const [lunch, setLunch] = useState(false);
  const [dinner, setDinner] = useState(false);

  const isMessManager = (currentMess?.managerIds || []).includes(userProfile?.id || '');
  const isMealManager = userProfile?.role === 'MealManager';
  const isAdmin = isMessManager || isMealManager || isSupreme;

  const now = new Date();
  const isPastDeadline = !isAdmin && now.getHours() >= 22;

  // Guest meals state
  const [pendingGuestMorning, setPendingGuestMorning] = useState(0);
  const [pendingGuestLunch, setPendingGuestLunch] = useState(0);
  const [pendingGuestDinner, setPendingGuestDinner] = useState(0);

  const [guestMorning, setGuestMorning] = useState(0);
  const [guestLunch, setGuestLunch] = useState(0);
  const [guestDinner, setGuestDinner] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchTomorrowMeal = async () => {
      if (!currentMess || !userProfile) return;
      const tomorrow = addDays(new Date(), 1);
      const dateStr = format(tomorrow, 'yyyy-MM-dd');
      
      const q = query(
        collection(db, 'meals'), 
        where('messId', '==', currentMess.id),
        where('memberId', '==', userProfile.id),
        where('date', '==', dateStr)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        if (data.morning !== undefined) {
          setMorning(!!data.morning);
          setLunch(!!data.lunch);
          setDinner(!!data.dinner);
        } else {
          // fallback parser
          const val = data.displayValue || String(data.mealCount || 0);
          setMorning(val.includes('0.5') || val.includes('1.5') || val.includes('2.5'));
          setLunch(val.includes('D') || Number(val) > 0.5); // very rough fallback
          setDinner(val.includes('N') || Number(val) > 1.5);
        }

        // Set guest meals state
        setPendingGuestMorning(data.pendingGuestMorning || 0);
        setPendingGuestLunch(data.pendingGuestLunch || 0);
        setPendingGuestDinner(data.pendingGuestDinner || 0);
        setGuestMorning(data.guestMorning || 0);
        setGuestLunch(data.guestLunch || 0);
        setGuestDinner(data.guestDinner || 0);
      } else {
        // Fallback: Find the latest meal record for this member before tomorrow to inherit
        const qPrev = query(
          collection(db, 'meals'),
          where('messId', '==', currentMess.id),
          where('memberId', '==', userProfile.id)
        );
        const snapPrev = await getDocs(qPrev);
        if (!snapPrev.empty) {
          const sorted = snapPrev.docs
            .map(d => ({ id: d.id, ...d.data() } as any))
            .filter(d => d.date < dateStr)
            .sort((a, b) => b.date.localeCompare(a.date));
          
          if (sorted.length > 0) {
            const data = sorted[0];
            if (data.morning !== undefined) {
              setMorning(!!data.morning);
              setLunch(!!data.lunch);
              setDinner(!!data.dinner);
            } else {
              const val = data.displayValue || String(data.mealCount || 0);
              setMorning(val.includes('0.5') || val.includes('1.5') || val.includes('2.5'));
              setLunch(val.includes('D') || Number(val) > 0.5);
              setDinner(val.includes('N') || Number(val) > 1.5);
            }
            // Reset guests to 0 for the default inherit state
            setPendingGuestMorning(0);
            setPendingGuestLunch(0);
            setPendingGuestDinner(0);
            setGuestMorning(0);
            setGuestLunch(0);
            setGuestDinner(0);
          }
        }
      }
    };
    fetchTomorrowMeal();
  }, [currentMess, userProfile]);

  const handleUpdate = async () => {
    if (!currentMess || !userProfile) return;
    setLoading(true);
    try {
      const tomorrow = addDays(new Date(), 1);
      const dateStr = format(tomorrow, 'yyyy-MM-dd');
      
      let mealCount = 0;
      if (morning) mealCount += 0.5;
      if (lunch) mealCount += 1;
      if (dinner) mealCount += 1;

      // Add approved guest meals to total count
      mealCount += (guestMorning || 0) * 0.5;
      mealCount += (guestLunch || 0) * 1;
      mealCount += (guestDinner || 0) * 1;

      let displayValue = "";
      if (morning && lunch && dinner) displayValue = "2.5";
      else if (!morning && lunch && dinner) displayValue = "2";
      else if (morning && !lunch && !dinner) displayValue = "0.5";
      else if (!morning && lunch && !dinner) displayValue = "1D";
      else if (!morning && !lunch && dinner) displayValue = "1N";
      else if (morning && lunch && !dinner) displayValue = "1.5D";
      else if (morning && !lunch && dinner) displayValue = "1.5N";
      else displayValue = "0";

      const q = query(
        collection(db, 'meals'), 
        where('messId', '==', currentMess.id),
        where('memberId', '==', userProfile.id),
        where('date', '==', dateStr)
      );
      const snap = await getDocs(q);
      let docRef;
      if (!snap.empty) {
        docRef = snap.docs[0].ref;
      } else {
        docRef = doc(collection(db, 'meals'));
      }

      await setDoc(docRef, {
        memberId: userProfile.id,
        messId: currentMess.id,
        date: dateStr,
        mealCount,
        displayValue,
        morning,
        lunch,
        dinner,
        pendingGuestMorning,
        pendingGuestLunch,
        pendingGuestDinner,
        guestMorning,
        guestLunch,
        guestDinner,
        updatedAt: new Date()
      }, { merge: true });

      // Create notification for managers if new guest meals requested
      if (pendingGuestMorning > 0 || pendingGuestLunch > 0 || pendingGuestDinner > 0) {
        const notifRef = doc(collection(db, 'notifications'));
        await setDoc(notifRef, {
          id: notifRef.id,
          messId: currentMess.id,
          title: language === 'bn' ? 'গেস্ট মিলের অনুরোধ' : 'Guest Meal Request',
          message: language === 'bn'
            ? `${userProfile.name} আগামীকালের জন্য গেস্ট মিলের অনুরোধ পাঠিয়েছেন।`
            : `${userProfile.name} has submitted a guest meal request for tomorrow.`,
          type: 'notice',
          recipientRoles: ['Manager', 'MealManager'],
          status: 'Unread',
          readBy: [],
          createdAt: new Date()
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving meal:", error);
    } finally {
      setLoading(false);
    }
  };

  const CounterWidget = ({ 
    label, 
    pendingVal, 
    approvedVal, 
    onIncrement, 
    onDecrement, 
    icon: Icon,
    colorClass
  }: { 
    label: string, 
    pendingVal: number, 
    approvedVal: number, 
    onIncrement: () => void, 
    onDecrement: () => void, 
    icon: any,
    colorClass: string
  }) => {
    return (
      <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-950">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 ${colorClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{label}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {approvedVal > 0 && (
                <span className="text-[10px] font-bold bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded border border-green-100 dark:border-green-900/30">
                  {language === 'bn' ? 'অনুমোদিত: ' : 'Approved: '} {approvedVal}
                </span>
              )}
              {pendingVal > 0 && (
                <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-900/30 animate-pulse">
                  {language === 'bn' ? 'অপেক্ষমান: ' : 'Pending: '} {pendingVal}
                </span>
              )}
              {approvedVal === 0 && pendingVal === 0 && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                  {language === 'bn' ? 'কোনো অতিথি নেই' : 'No guest meals'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onDecrement}
            disabled={pendingVal <= 0 && approvedVal <= 0}
            className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center border transition-all ${
              pendingVal > 0 || approvedVal > 0 
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-sm active:scale-90' 
                : 'bg-slate-100/50 dark:bg-slate-950/30 border-transparent text-slate-300 dark:text-slate-705 cursor-not-allowed'
            }`}
          >
            <Minus className="w-4.5 h-4.5" />
          </button>
          <span className="w-5 text-center font-mono font-bold text-slate-800 dark:text-white text-base">{approvedVal + pendingVal}</span>
          <button
            type="button"
            onClick={onIncrement}
            disabled={approvedVal + pendingVal >= 2}
            className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center border transition-all ${
              approvedVal + pendingVal < 2
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-sm active:scale-90' 
                : 'bg-slate-100/50 dark:bg-slate-955/30 border-transparent text-slate-300 dark:text-slate-705 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2 text-center font-display">{t('tomorrow_meals.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center font-semibold">{t('tomorrow_meals.subtitle')}</p>

        {isPastDeadline && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-center">
            <p className="text-sm font-bold text-red-600 dark:text-red-400">
              {language === 'bn' ? 'রাত ১০টার পর আগামীকালের মিল পরিবর্তন করা যাবে না।' : 'You cannot change tomorrow\'s meal after 10:00 PM.'}
            </p>
          </div>
        )}

        {/* Section 1: Member's Own Meal */}
        <div className="mb-6">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 border-b border-slate-100 dark:border-slate-800 pb-1.5">
            {language === 'bn' ? 'আমার নিজের খাবার' : 'My Own Meal'}
          </p>
          <div className="grid grid-cols-3 gap-3">
            <button
              disabled={isPastDeadline}
              onClick={() => setMorning(!morning)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${isPastDeadline ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-amber-200'} ${
                morning 
                  ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400' 
                  : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-400 dark:text-slate-500'
              }`}
            >
              <Sunrise className={`w-8 h-8 mb-2 ${morning ? 'text-amber-500' : 'text-slate-300'}`} />
              <span className="font-semibold text-sm">Morning</span>
              <span className="text-[10px] opacity-70">0.5 Meal</span>
            </button>
            <button
              disabled={isPastDeadline}
              onClick={() => setLunch(!lunch)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${isPastDeadline ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-orange-200'} ${
                lunch 
                  ? 'border-orange-400 bg-orange-50/50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400' 
                  : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-400 dark:text-slate-500'
              }`}
            >
              <Sun className={`w-8 h-8 mb-2 ${lunch ? 'text-orange-500' : 'text-slate-300'}`} />
              <span className="font-semibold text-sm">Lunch</span>
              <span className="text-[10px] opacity-70">1.0 Meal</span>
            </button>
            <button
              disabled={isPastDeadline}
              onClick={() => setDinner(!dinner)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${isPastDeadline ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-indigo-200'} ${
                dinner 
                  ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400' 
                  : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-400 dark:text-slate-500'
              }`}
            >
              <Moon className={`w-8 h-8 mb-2 ${dinner ? 'text-indigo-500' : 'text-slate-300'}`} />
              <span className="font-semibold text-sm">Dinner</span>
              <span className="text-[10px] opacity-70">1.0 Meal</span>
            </button>
          </div>
        </div>

        {/* Section 2: Guest Meals */}
        <div className="mb-8">
          <div className="flex items-center gap-2 border-b border-slate-105 dark:border-slate-800 pb-1.5 mb-3">
            <Users className="w-4 h-4 text-indigo-500" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {language === 'bn' ? 'অতিথি খাবার (Guest Meals)' : 'Guest Meals'}
            </p>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 bg-slate-50 dark:bg-slate-950/30 p-2.5 rounded-xl border border-slate-100/50 dark:border-slate-850">
            ℹ️ {language === 'bn' 
              ? 'গেস্ট মিল বুকিং করার পর মিল ম্যানেজারের অনুমোদন প্রয়োজন হবে। প্রতিটি বেলাতে সর্বোচ্চ ২টি গেস্ট মিল বুকিং করা যাবে।' 
              : 'Guest meals require manual approval. At most 2 guest meals can be requested per time period.'}
          </p>
          
          <div className="space-y-2">
            <CounterWidget
              label={language === 'bn' ? 'সকালের অতিথি' : 'Morning Guest'}
              pendingVal={pendingGuestMorning}
              approvedVal={guestMorning}
              onIncrement={() => { if (guestMorning + pendingGuestMorning < 2) setPendingGuestMorning(v => v + 1); }}
              onDecrement={() => { if (pendingGuestMorning > 0) setPendingGuestMorning(v => v - 1); else if (guestMorning > 0) setGuestMorning(v => v - 1); }}
              icon={Sunrise}
              colorClass="text-amber-500"
            />
            <CounterWidget
              label={language === 'bn' ? 'দুপুরের অতিথি' : 'Lunch Guest'}
              pendingVal={pendingGuestLunch}
              approvedVal={guestLunch}
              onIncrement={() => { if (guestLunch + pendingGuestLunch < 2) setPendingGuestLunch(v => v + 1); }}
              onDecrement={() => { if (pendingGuestLunch > 0) setPendingGuestLunch(v => v - 1); else if (guestLunch > 0) setGuestLunch(v => v - 1); }}
              icon={Sun}
              colorClass="text-orange-500"
            />
            <CounterWidget
              label={language === 'bn' ? 'রাতের অতিথি' : 'Dinner Guest'}
              pendingVal={pendingGuestDinner}
              approvedVal={guestDinner}
              onIncrement={() => { if (guestDinner + pendingGuestDinner < 2) setPendingGuestDinner(v => v + 1); }}
              onDecrement={() => { if (pendingGuestDinner > 0) setPendingGuestDinner(v => v - 1); else if (guestDinner > 0) setGuestDinner(v => v - 1); }}
              icon={Moon}
              colorClass="text-indigo-500"
            />
          </div>
        </div>

        <button
          onClick={handleUpdate}
          disabled={loading || isPastDeadline}
          className={`w-full font-medium py-3 rounded-xl transition flex items-center justify-center gap-2 ${isPastDeadline ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white cursor-pointer'}`}
        >
          {loading ? t('common.saving') : t('tomorrow_meals.update_btn')}
        </button>

        {success && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded-lg flex items-center justify-center gap-2 text-sm font-medium border border-transparent dark:border-green-900/30">
            <Check className="w-4 h-4" />
            {t('tomorrow_meals.success')}
          </div>
        )}
      </div>
    </div>
  );
}
