import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { format, addDays } from 'date-fns';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Sunrise, Sun, Moon, CheckCircle2, Loader2, Ban } from 'lucide-react';

const dict = {
  en: {
    title: "Tomorrow's Meal Plan",
    subtitle: "Please finalize your meal slots. Your input guides the manager's bazaar planning.",
    dateLabel: "Meal Date",
    morning: "Morning",
    lunch: "Lunch",
    dinner: "Dinner",
    mealLabel: "Meal",
    mealOff: "Meal Off",
    mealOffDesc: "I won't be eating any meals tomorrow",
    confirmBtn: "Confirm & Save",
    savingBtn: "Saving...",
    success: "Plan Saved Successfully!",
    summary: "Total Tomorrow's Meal count:"
  },
  bn: {
    title: "আগামীকালের খাবারের তালিকা",
    subtitle: "বাজারের প্রস্তুতির সুবিধার্থে আগামীকালের জন্য আপনার খাবারের প্ল্যান সেট করুন।",
    dateLabel: "খাবারের তারিখ",
    morning: "সকাল",
    lunch: "দুপুর",
    dinner: "রাত",
    mealLabel: "মিল",
    mealOff: "আজ খাবার বন্ধ",
    mealOffDesc: "আগামীকাল মেসের কোন মিল খাবো না",
    confirmBtn: "নিশ্চিত করে সংরক্ষণ করুন",
    savingBtn: "সংরক্ষণ করা হচ্ছে...",
    success: "সফলভাবে সংরক্ষিত হয়েছে!",
    summary: "আগামীকালের মোট মিল সংখ্যা:"
  }
};

export function TomorrowMealPopup() {
  const { currentMess, userProfile } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();

  const [show, setShow] = useState(false);
  const [morning, setMorning] = useState(false);
  const [lunch, setLunch] = useState(false);
  const [dinner, setDinner] = useState(false);
  const [mealOff, setMealOff] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const text = language === 'bn' ? dict.bn : dict.en;

  useEffect(() => {
    // Only trigger on the Dashboard page
    if (location.pathname !== '/') return;
    
    // Only trigger for Active members
    if (!currentMess || !userProfile || userProfile.status !== 'Active') return;

    let timer: NodeJS.Timeout;

    const checkTomorrowMeal = async () => {
      try {
        const tomorrow = addDays(new Date(), 1);
        const dateStr = format(tomorrow, 'yyyy-MM-dd');
        
        const q = query(
          collection(db, 'meals'), 
          where('messId', '==', currentMess.id),
          where('memberId', '==', userProfile.id),
          where('date', '==', dateStr)
        );
        const snap = await getDocs(q);
        
        // If no tomorrow meal document is found, pre-fill from latest record and pop up after 1 second
        if (snap.empty) {
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
              const prevData = sorted[0];
              const isOff = prevData.mealCount === 0;
              setMorning(isOff ? false : !!prevData.morning);
              setLunch(isOff ? false : !!prevData.lunch);
              setDinner(isOff ? false : !!prevData.dinner);
              setMealOff(isOff);
            }
          }

          timer = setTimeout(() => {
            setShow(true);
          }, 1000);
        }
      } catch (e) {
        console.error("Error querying tomorrow meal popup state:", e);
      }
    };

    checkTomorrowMeal();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [location.pathname, currentMess, userProfile]);

  const handleMealOffChange = () => {
    setMealOff(true);
    setMorning(false);
    setLunch(false);
    setDinner(false);
  };

  const handleSegmentChange = (segment: 'morning' | 'lunch' | 'dinner') => {
    setMealOff(false);
    if (segment === 'morning') setMorning(!morning);
    if (segment === 'lunch') setLunch(!lunch);
    if (segment === 'dinner') setDinner(!dinner);
  };

  const handleSave = async () => {
    if (!currentMess || !userProfile) return;
    setSaving(true);
    try {
      const tomorrow = addDays(new Date(), 1);
      const dateStr = format(tomorrow, 'yyyy-MM-dd');
      
      let mealCount = 0;
      if (!mealOff) {
        if (morning) mealCount += 0.5;
        if (lunch) mealCount += 1;
        if (dinner) mealCount += 1;
      }

      let displayValue = "";
      if (mealOff || (!morning && !lunch && !dinner)) {
        displayValue = "0";
      } else if (morning && lunch && dinner) {
        displayValue = "2.5";
      } else if (!morning && lunch && dinner) {
        displayValue = "2";
      } else if (morning && !lunch && !dinner) {
        displayValue = "0.5";
      } else if (!morning && lunch && !dinner) {
        displayValue = "1D";
      } else if (!morning && !lunch && dinner) {
        displayValue = "1N";
      } else if (morning && lunch && !dinner) {
        displayValue = "1.5D";
      } else if (morning && !lunch && dinner) {
        displayValue = "1.5N";
      }

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
        morning: mealOff ? false : morning,
        lunch: mealOff ? false : lunch,
        dinner: mealOff ? false : dinner,
        updatedAt: new Date()
      }, { merge: true });

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        setShow(false);
      }, 1500);
    } catch (e) {
      console.error("Error saving Tomorrow's Meal:", e);
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  const tomorrowDate = addDays(new Date(), 1);
  const formattedTomorrow = format(tomorrowDate, 'dd MMMM, yyyy');

  // Calculate dynamic count
  let calculatedCount = 0;
  if (!mealOff) {
    if (morning) calculatedCount += 0.5;
    if (lunch) calculatedCount += 1;
    if (dinner) calculatedCount += 1;
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 transform scale-100 transition-all duration-300">
        
        {/* Banner header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-6 px-6 text-white text-center relative">
          <h3 className="text-xl font-bold tracking-tight">{text.title}</h3>
          <p className="text-white/80 text-xs mt-1 font-mono tracking-wide">
            📅 {text.dateLabel}: {formattedTomorrow}
          </p>
        </div>

        <div className="p-6">
          {savedSuccess ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce mb-3" />
              <h4 className="text-lg font-bold text-slate-800">{text.success}</h4>
            </div>
          ) : (
            <>
              <p className="text-slate-500 text-xs text-center leading-relaxed mb-6">
                {text.subtitle}
              </p>

              {/* Meal Grid Options */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => handleSegmentChange('morning')}
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 transition-all cursor-pointer ${
                    morning 
                      ? 'border-amber-400 bg-amber-50 text-amber-800 shadow-sm' 
                      : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-500 hover:border-slate-200'
                  }`}
                >
                  <Sunrise className={`w-6 h-6 mb-1.5 ${morning ? 'text-amber-500' : 'text-slate-400'}`} />
                  <span className="font-bold text-xs">{text.morning}</span>
                  <span className="text-[10px] opacity-70 mt-0.5">0.5 {text.mealLabel}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSegmentChange('lunch')}
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 transition-all cursor-pointer ${
                    lunch 
                      ? 'border-orange-400 bg-orange-50 text-orange-800 shadow-sm' 
                      : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-500 hover:border-slate-200'
                  }`}
                >
                  <Sun className={`w-6 h-6 mb-1.5 ${lunch ? 'text-orange-500' : 'text-slate-400'}`} />
                  <span className="font-bold text-xs">{text.lunch}</span>
                  <span className="text-[10px] opacity-70 mt-0.5">1.0 {text.mealLabel}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSegmentChange('dinner')}
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 transition-all cursor-pointer ${
                    dinner 
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-800 shadow-sm' 
                      : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-500 hover:border-slate-200'
                  }`}
                >
                  <Moon className={`w-6 h-6 mb-1.5 ${dinner ? 'text-indigo-500' : 'text-slate-400'}`} />
                  <span className="font-bold text-xs">{text.dinner}</span>
                  <span className="text-[10px] opacity-70 mt-0.5">1.0 {text.mealLabel}</span>
                </button>
              </div>

              {/* Meal Off Option */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={handleMealOffChange}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    mealOff 
                      ? 'border-rose-400 bg-rose-50 text-rose-800 shadow-sm' 
                      : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-500 hover:border-slate-200'
                  }`}
                >
                  <Ban className={`w-5 h-5 flex-shrink-0 ${mealOff ? 'text-rose-500' : 'text-slate-400'}`} />
                  <div className="flex-1">
                    <p className="text-xs font-bold">{text.mealOff}</p>
                    <p className="text-[10px] opacity-80 mt-0.5">{text.mealOffDesc}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${mealOff ? 'border-rose-500 bg-rose-500' : 'border-slate-300'}`}>
                    {mealOff && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                </button>
              </div>

              {/* Current Count Summary */}
              <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-xs font-medium text-slate-700 mb-6 border border-slate-100">
                <span>{text.summary}</span>
                <span className={`font-mono text-sm font-bold ${calculatedCount > 0 ? 'text-blue-600' : 'text-rose-500'}`}>
                  {calculatedCount} {text.mealLabel}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || (!morning && !lunch && !dinner && !mealOff)}
                  className={`w-full font-semibold py-3 rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                    saving || (!morning && !lunch && !dinner && !mealOff)
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {text.savingBtn}
                    </>
                  ) : (
                    text.confirmBtn
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
