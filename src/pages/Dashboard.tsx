import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, doc, updateDoc, arrayUnion, arrayRemove, setDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Member, Meal, Deposit, BazarCost } from '../types';
import { format, startOfMonth, getDaysInMonth, differenceInHours, differenceInMinutes, endOfDay, addDays } from 'date-fns';
import { Users, Utensils, Wallet, ShoppingCart, TrendingUp, AlertCircle, CheckCircle, Megaphone, ChevronRight, X, Bell, Info, Sun, Sunrise, Moon, Ban, Timer, CheckCircle2, Loader2, ThumbsUp, Heart, Smile } from 'lucide-react';
import { cn } from '../lib/utils';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useMonth } from '../contexts/MonthContext';
import { MealPollsWidget } from '../components/MealPollsWidget';

export default function Dashboard() {
  const { currentMess, userProfile } = useAuth();
  const { t, language } = useLanguage();
  const { selectedMonth } = useMonth();
  const [members, setMembers] = useState<Member[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [costs, setCosts] = useState<BazarCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState<any[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<any | null>(null);

  // Time-aware greeting
  const [greeting, setGreeting] = useState('');
  const [themeStyle, setThemeStyle] = useState('');
  const [GreetingIcon, setGreetingIcon] = useState<any>(Sun);
  
  // Tomorrow's meal state
  const [tomorrowMeal, setTomorrowMeal] = useState<{morning: boolean, lunch: boolean, dinner: boolean, mealOff: boolean} | null>(null);
  const [timeLeftStr, setTimeLeftStr] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting(language === 'bn' ? 'শুভ সকাল' : 'Good Morning');
      setThemeStyle('bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-900');
      setGreetingIcon(Sunrise);
    } else if (hour >= 12 && hour < 17) {
      setGreeting(language === 'bn' ? 'শুভ অপরাহ্ন' : 'Good Afternoon');
      setThemeStyle('bg-gradient-to-r from-sky-50 to-blue-50 border-sky-200 text-sky-900');
      setGreetingIcon(Sun);
    } else {
      setGreeting(language === 'bn' ? 'শুভ সন্ধ্যা' : 'Good Evening');
      setThemeStyle('bg-gradient-to-r from-indigo-50 to-slate-100 border-indigo-200 text-indigo-900');
      setGreetingIcon(Moon);
    }

    const timer = setInterval(() => {
      const now = new Date();
      const endOfToday = endOfDay(now);
      const hoursLeft = differenceInHours(endOfToday, now);
      const minsLeft = differenceInMinutes(endOfToday, now) % 60;
      setTimeLeftStr(`${hoursLeft}h ${minsLeft}m`);
    }, 60000);
    
    // Trigger immediately
    const now = new Date();
    const endOfToday = endOfDay(now);
    setTimeLeftStr(`${differenceInHours(endOfToday, now)}h ${differenceInMinutes(endOfToday, now) % 60}m`);

    // Request Notification Permission
    setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, 2000);

    return () => clearInterval(timer);
  }, [language]);

  useEffect(() => {
    if (!currentMess) {
      setLoading(false);
      return;
    }
    const unsubMembers = onSnapshot(query(collection(db, 'users'), where('messId', '==', currentMess.id), where('role', 'in', ['Manager', 'Border', 'MealManager'])) , (snap) => setMembers(snap.docs.map(d => ({id:d.id, ...d.data()} as Member))), (error) => {
      console.warn("unsubMembers onSnapshot error:", error);
    });
    const unsubMeals = onSnapshot(query(collection(db, 'meals'), where('messId', '==', currentMess.id)), (snap) => setMeals(snap.docs.map(d => ({id:d.id, ...d.data()} as Meal))), (error) => {
      console.warn("unsubMeals onSnapshot error:", error);
    });
    const unsubDeposits = onSnapshot(query(collection(db, 'deposits'), where('messId', '==', currentMess.id)), (snap) => setDeposits(snap.docs.map(d => ({id:d.id, ...d.data()} as Deposit))), (error) => {
      console.warn("unsubDeposits onSnapshot error:", error);
    });
    const unsubCosts = onSnapshot(query(collection(db, 'bazarCosts'), where('messId', '==', currentMess.id)), (snap) => {
      setCosts(snap.docs.map(d => ({id:d.id, ...d.data()} as BazarCost)));
      setLoading(false);
    }, (error) => {
      console.warn("unsubCosts onSnapshot error:", error);
      setLoading(false);
    });

    const unsubNotices = onSnapshot(query(collection(db, 'notices'), where('messId', '==', currentMess.id)), (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });
      setNotices(data);
    }, (error) => {
      console.warn("unsubNotices onSnapshot error:", error);
    });

    return () => { unsubMembers(); unsubMeals(); unsubDeposits(); unsubCosts(); unsubNotices(); };
  }, [currentMess]);

  // Read tomorrow's meal continuously
  useEffect(() => {
    if (!currentMess || !userProfile) return;
    const tomorrow = addDays(new Date(), 1);
    const dateStr = format(tomorrow, 'yyyy-MM-dd');
    const unsubTomorrow = onSnapshot(query(collection(db, 'meals'), where('messId', '==', currentMess.id), where('memberId', '==', userProfile.id), where('date', '==', dateStr)), (snap) => {
      if (!snap.empty) {
        const data = snap.docs[0].data();
        const isOff = data.mealCount === 0;
        setTomorrowMeal({
          morning: data.morning || false,
          lunch: data.lunch || false,
          dinner: data.dinner || false,
          mealOff: isOff
        });
      } else {
        setTomorrowMeal(null); // not placed yet
      }
    }, (error) => {
      console.warn("unsubTomorrow onSnapshot error:", error);
    });
    return () => unsubTomorrow();
  }, [currentMess, userProfile]);

  const handleToggleTomorrowMeal = async (segment: 'morning' | 'lunch' | 'dinner' | 'off') => {
    if (!currentMess || !userProfile) return;
    const tomorrow = addDays(new Date(), 1);
    const dateStr = format(tomorrow, 'yyyy-MM-dd');

    let current = tomorrowMeal || { morning: false, lunch: false, dinner: false, mealOff: false };
    let updateStr = { ...current };

    if (segment === 'off') {
       updateStr = { morning: false, lunch: false, dinner: false, mealOff: true };
    } else {
       updateStr.mealOff = false;
       updateStr[segment] = !updateStr[segment];
    }

    let mealCount = 0;
    if (!updateStr.mealOff) {
      if (updateStr.morning) mealCount += 0.5;
      if (updateStr.lunch) mealCount += 1;
      if (updateStr.dinner) mealCount += 1;
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
      displayValue: mealCount.toString(),
      morning: updateStr.morning,
      lunch: updateStr.lunch,
      dinner: updateStr.dinner,
      updatedAt: new Date()
    }, { merge: true });
  };


  const currentMonthPrefix = selectedMonth; // format: 'yyyy-MM'
  
  const activeMembers = members.filter(m => m.status === 'Active');
  
  const currentMonthMeals = meals.filter(m => m.date.startsWith(currentMonthPrefix));
  const totalMeals = currentMonthMeals.reduce((sum, m) => sum + m.mealCount, 0);
  
  const currentMonthDeposits = deposits.filter(d => d.date.startsWith(currentMonthPrefix));
  const totalDeposits = currentMonthDeposits.reduce((sum, d) => sum + d.amount, 0);
  
  const currentMonthCosts = costs.filter(c => c.date.startsWith(currentMonthPrefix));
  const totalBazarCost = currentMonthCosts.reduce((sum, c) => sum + c.totalPrice, 0);
  
  const mealRate = totalMeals > 0 ? totalBazarCost / totalMeals : 0;

  // My Passbook stats
  const myDeposits = currentMonthDeposits.filter(d => d.memberId === userProfile?.id).reduce((sum, d) => sum + d.amount, 0);
  const myMeals = currentMonthMeals.filter(m => m.memberId === userProfile?.id).reduce((sum, m) => sum + m.mealCount, 0);
  const myCost = myMeals * mealRate;
  const myBalance = myDeposits - myCost;

  // Chart data
  const [year, month] = selectedMonth.split('-');
  const daysInMonth = getDaysInMonth(new Date(parseInt(year), parseInt(month) - 1));
  
  let tempCumulativeMeals = 0;
  let tempCumulativeExpenses = 0;
  
  const dailyData = Array.from({ length: daysInMonth }).map((_, i) => {
    const day = String(i + 1).padStart(2, '0');
    const dateStr = `${currentMonthPrefix}-${day}`;
    
    const dayMeals = currentMonthMeals.filter(m => m.date === dateStr).reduce((sum, m) => sum + m.mealCount, 0);
    const dayExpenses = currentMonthCosts.filter(c => c.date === dateStr).reduce((sum, c) => sum + c.totalPrice, 0);
    
    tempCumulativeMeals += dayMeals;
    tempCumulativeExpenses += dayExpenses;
    
    const runningRate = tempCumulativeMeals > 0 ? parseFloat((tempCumulativeExpenses / tempCumulativeMeals).toFixed(2)) : 0;
    
    return {
      day: day,
      meals: dayMeals,
      rate: runningRate,
      expenses: dayExpenses
    };
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Time-Aware Greeting */}
      <div className={cn("p-6 sm:p-8 rounded-3xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4", themeStyle)}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
             <GreetingIcon className="w-8 h-8 opacity-80" />
             <h1 className="text-3xl font-black tracking-tight font-display">{greeting}, {userProfile?.name?.split(' ')[0]}</h1>
          </div>
          <p className="text-sm font-medium opacity-80">
             {language === 'bn' ? 'আপনার মেসের আজকের আপডেট এবং ব্যক্তিগত হিসাব নিচে দেওয়া হলো।' : 'Here is your personalized mess update and passbook summary.'}
          </p>
        </div>
      </div>

      {/* Notice Board Section */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-5 gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl text-blue-600 dark:text-blue-400 animate-pulse">
               <Megaphone className="w-5 h-5" />
            </span>
            <div>
               <h3 className="text-base font-black text-slate-900 dark:text-white">{language === 'bn' ? 'মেস নোটিশ বোর্ড' : 'Mess Notice Board'}</h3>
               <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{language === 'bn' ? 'ম্যানেজার কর্তৃক প্রচারিত সর্বশেষ নোটিশ ও ঘোষণাসমূহ' : 'Latest announcements and pinned notices from management'}</p>
            </div>
          </div>
          {notices.length > 0 && (
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full shadow-xs">
              {notices.length} {language === 'bn' ? 'টি নোটিশ' : 'notices'}
            </span>
          )}
        </div>

        {notices.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
             <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2.5" />
             <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{language === 'bn' ? 'কোন সক্রিয় নোটিশ নেই' : 'No active notices found'}</p>
             <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{language === 'bn' ? 'মেসের নতুন যেকোনো আপডেট এখানে দেখতে পাবেন।' : 'Unified notice board posts will display here.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {notices.slice(0, 4).map((notice, idx) => {
                const isLatest = idx === 0;
                return (
                  <div key={notice.id} className={cn(
                     "p-5 rounded-2xl border transition-all duration-200 hover:shadow-sm group relative overflow-hidden bg-white dark:bg-slate-900/40 flex flex-col justify-between",
                     isLatest ? "border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/5 dark:bg-indigo-950/5 shadow-xs ring-1 ring-indigo-100/50 dark:ring-indigo-900/30" : "border-slate-200 dark:border-slate-800"
                  )}>
                     <div>
                       {isLatest && (
                          <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[8px] font-black uppercase px-2.5 py-1 rounded-bl-xl tracking-widest">
                             {language === 'bn' ? 'সর্বশেষ' : 'LATEST'}
                          </div>
                       )}
                       <div className="flex items-start gap-3">
                          <div className={cn(
                             "p-2 w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs font-mono",
                             isLatest ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400" : "bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400"
                          )}>
                             {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                             <h4 className="text-sm font-black text-slate-800 dark:text-white truncate mb-1 pr-12">{notice.title}</h4>
                             <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold mb-3">
                                <span>{notice.author}</span>
                                <span>•</span>
                                <span>{notice.createdAt?.toDate ? format(notice.createdAt.toDate(), 'PP p') : 'Just now'}</span>
                             </div>
                             <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 whitespace-pre-wrap">{notice.content}</p>
                          </div>
                       </div>
                     </div>
                     <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-850">
                        <div className="flex items-center gap-2">
                           <button onClick={async () => {
                              const ref = doc(db, 'notices', notice.id);
                              if (notice.likes?.includes(userProfile?.id)) {
                                 await updateDoc(ref, { likes: arrayRemove(userProfile?.id) });
                              } else {
                                 await updateDoc(ref, { likes: arrayUnion(userProfile?.id) });
                              }
                           }} className={cn("p-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer", notice.likes?.includes(userProfile?.id) ? "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400" : "hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-400 dark:text-slate-555")}>
                              <Heart className={cn("w-3.5 h-3.5", notice.likes?.includes(userProfile?.id) ? "fill-rose-600" : "")} />
                              <span className="text-[10px] font-bold">{notice.likes?.length || 0}</span>
                           </button>
                           <button onClick={async () => {
                              const ref = doc(db, 'notices', notice.id);
                              if (notice.thumbs?.includes(userProfile?.id)) {
                                 await updateDoc(ref, { thumbs: arrayRemove(userProfile?.id) });
                              } else {
                                 await updateDoc(ref, { thumbs: arrayUnion(userProfile?.id) });
                              }
                           }} className={cn("p-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer", notice.thumbs?.includes(userProfile?.id) ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400" : "hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-400 dark:text-slate-555")}>
                              <ThumbsUp className={cn("w-3.5 h-3.5", notice.thumbs?.includes(userProfile?.id) ? "fill-amber-600" : "")} />
                              <span className="text-[10px] font-bold">{notice.thumbs?.length || 0}</span>
                           </button>
                        </div>
                        <button 
                           onClick={() => setSelectedNotice(notice)}
                           className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 uppercase tracking-wider cursor-pointer bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/30 py-1.5 px-3 rounded-lg transition-colors"
                        >
                           {language === 'bn' ? 'পড়ুন' : 'Read'}
                        </button>
                     </div>
                  </div>
                );
             })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Passbook Widget */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden ring-4 ring-slate-900/5">
          <div className="absolute -right-6 -top-6">
             <Wallet className="w-32 h-32 text-slate-800" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <span className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                <Wallet className="w-5 h-5" />
              </span>
              <h2 className="text-sm font-black tracking-widest text-slate-300 uppercase">{language === 'bn' ? 'আমার হিসাব (পাসবুক)' : 'My Passbook'}</h2>
            </div>
            
            <div className="mb-8">
               <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">{myBalance >= 0 ? (language === 'bn' ? 'ব্যালেন্স (পাওনা)' : 'Current Balance (Surplus)') : (language === 'bn' ? 'বকেয়া (দেনা)' : 'Current Due')}</p>
               <h3 className={cn("text-4xl md:text-5xl font-black font-display tracking-tight", myBalance >= 0 ? "text-emerald-400" : "text-rose-400")}>
                  {myBalance >= 0 ? '+' : ''}{myBalance.toFixed(0)} <span className="text-lg font-sans text-slate-500">{t('common.currency')}</span>
               </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl">
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{language === 'bn' ? 'আমার মোট খরচ' : 'My Total Cost'}</p>
                 <p className="text-xl font-bold font-display">{myCost.toFixed(0)} <span className="text-xs text-slate-500">{t('common.currency')}</span></p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl">
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{language === 'bn' ? 'আমার মোট মিল' : 'My Total Meals'}</p>
                 <p className="text-xl font-bold font-display">{myMeals} <span className="text-xs text-slate-500">{language === 'bn' ? 'টি' : 'Meals'}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Tomorrow's Meal Smart Widget */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 transform translate-x-2 -translate-y-2 pointer-events-none transition-transform group-hover:scale-110">
            <Utensils className="w-32 h-32 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                  <Utensils className="w-5 h-5" />
                </span>
                <h2 className="text-sm font-black tracking-widest text-slate-800 uppercase">{language === 'bn' ? 'আগামীকালের মিল' : "Tomorrow's Meal"}</h2>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold animate-pulse">
                <Timer className="w-4 h-4" />
                <span>{timeLeftStr}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-6 font-medium">
               {language === 'bn' ? 'সময় শেষ হওয়ার আগে আগামীকালের মিল নির্ধারণ করুন।' : 'Lock in your meals for tomorrow before the deadline.'}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4 relative z-10">
             <button
                onClick={() => handleToggleTomorrowMeal('morning')}
                className={cn("flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer", tomorrowMeal?.morning ? "border-amber-400 bg-amber-50 text-amber-800" : "border-slate-100 bg-slate-50 text-slate-500")}
             >
                <Sunrise className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold">{language === 'bn' ? 'সকাল' : 'Morning'}</span>
             </button>
             <button
                onClick={() => handleToggleTomorrowMeal('lunch')}
                className={cn("flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer", tomorrowMeal?.lunch ? "border-orange-400 bg-orange-50 text-orange-800" : "border-slate-100 bg-slate-50 text-slate-500")}
             >
                <Sun className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold">{language === 'bn' ? 'দুপুর' : 'Lunch'}</span>
             </button>
             <button
                onClick={() => handleToggleTomorrowMeal('dinner')}
                className={cn("flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer", tomorrowMeal?.dinner ? "border-indigo-400 bg-indigo-50 text-indigo-800" : "border-slate-100 bg-slate-50 text-slate-500")}
             >
                <Moon className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold">{language === 'bn' ? 'রাত' : 'Dinner'}</span>
             </button>
             <button
                onClick={() => handleToggleTomorrowMeal('off')}
                className={cn("flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer", tomorrowMeal?.mealOff ? "border-rose-400 bg-rose-50 text-rose-800" : "border-slate-100 bg-slate-50 text-slate-500")}
             >
                <Ban className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold">{language === 'bn' ? 'বন্ধ' : 'Off'}</span>
             </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
             <Info className="w-4 h-4 text-blue-500 shrink-0" />
             <p>{language === 'bn' ? 'ক্লিক করে মিল চালু বা বন্ধ করুন। স্বয়ংক্রিয়ভাবে সেভ হবে।' : 'Click to toggle your meals. Auto-saves instantly.'}</p>
          </div>
        </div>
      </div>
      
      <MealPollsWidget />

      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight mb-4">{language === 'bn' ? 'মেস ওভারভিউ' : 'Mess Overview'}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white p-5 rounded-2xl border-l-[5px] border-l-sky-500 border-y border-r border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('members.tab_active')}</p>
            <div className="flex items-baseline justify-between mt-2">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">{activeMembers.length}</h3>
              <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-lg">{t('members.tab_active')}</span>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border-l-[5px] border-l-amber-500 border-y border-r border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('dashboard.total_meals')}</p>
            <div className="flex items-baseline justify-between mt-2">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">{totalMeals}</h3>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">{t('nav.meals')}</span>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border-l-[5px] border-l-emerald-500 border-y border-r border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('dashboard.total_deposit')}</p>
            <div className="flex items-baseline justify-between mt-2">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">{totalDeposits.toFixed(0)} <span className="text-xs font-bold text-slate-400 font-sans">{t('common.currency')}</span></h3>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">{t('nav.deposits')}</span>
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-slate-900 to-slate-950 p-5 rounded-2xl border border-slate-800 shadow-lg shadow-blue-900/5 ring-4 ring-blue-500/5">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">{t('dashboard.meal_rate')}</p>
            <div className="flex items-baseline justify-between mt-2">
              <h3 className="text-3xl font-black text-white font-display">{mealRate.toFixed(2)} <span className="text-xs font-bold text-slate-400 font-sans">{t('common.currency')}</span></h3>
              <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">{language === 'bn' ? 'হার' : 'Rate'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 lg:col-span-1 flex flex-col justify-center min-h-[140px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 transform translate-x-2 -translate-y-2 pointer-events-none transition-transform group-hover:scale-110">
            <ShoppingCart className="w-32 h-32 text-blue-600" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('dashboard.total_bazar')}</h4>
          </div>
          <div>
            <span className="text-4xl sm:text-5xl font-black text-blue-600 font-display block">{totalBazarCost.toFixed(0)} {t('common.currency')}</span>
            <p className="text-xs text-slate-400 mt-2 font-medium">{language === 'bn' ? 'চলতি মাসে সর্বমোট বাজার খরচ' : 'Total market cost accumulated this month'}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('dashboard.daily_chart_title')}</h4>
          </div>
          <div className="h-[240px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMeals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 650}} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 650}} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 650}} tickFormatter={(value) => `${value}`} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: '1px solid #f1f5f9', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    fontFamily: 'Inter, sans-serif'
                  }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingTop: 15 }} />
                <Area yAxisId="left" type="monotone" dataKey="meals" stroke="#f97316" strokeWidth={1.5} fillOpacity={1} fill="url(#colorMeals)" name={t('dashboard.daily_consumption')} />
                <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 1.5, strokeWidth: 0, fill: '#2563eb' }} activeDot={{ r: 5 }} name={t('dashboard.running_meal_rate')} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>


      {/* Notice Reader Drawer/Modal */}
      {selectedNotice && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up border border-slate-105 dark:border-slate-800">
               <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2">
                     <span className="p-1.5 bg-blue-100/60 dark:bg-blue-950/30 rounded-lg text-blue-600 dark:text-blue-400">
                        <Megaphone className="w-4 h-4" />
                     </span>
                     <span className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                        {language === 'bn' ? 'নোটিশ বিবরণ' : 'Announcements Details'}
                     </span>
                  </div>
                  <button 
                     onClick={() => setSelectedNotice(null)}
                     className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                  >
                     <X className="w-4 h-4" />
                  </button>
               </div>
               <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div>
                     <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{selectedNotice.title}</h3>
                     <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold mt-2">
                        <span>{selectedNotice.author}</span>
                        <span>•</span>
                        <span>{selectedNotice.createdAt?.toDate ? format(selectedNotice.createdAt.toDate(), 'PPP p') : 'Just now'}</span>
                     </div>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                     <p className="text-slate-600 dark:text-slate-350 text-sm leading-relaxed whitespace-pre-wrap">{selectedNotice.content}</p>
                  </div>
               </div>
               <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-150 dark:border-slate-850 flex justify-end">
                  <button
                     onClick={() => setSelectedNotice(null)}
                     className="px-5 py-2.5 bg-slate-900 dark:bg-slate-950 hover:bg-slate-850 dark:hover:bg-slate-900 text-white dark:text-slate-200 rounded-xl text-xs font-bold transition shadow-md active:scale-95 cursor-pointer"
                  >
                     {language === 'bn' ? 'বন্ধ করুন' : 'Close Details'}
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
