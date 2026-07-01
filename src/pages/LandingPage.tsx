import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LogoIcon } from '../components/Logo';
import {
  ArrowRight,
  Calendar,
  UtensilsCrossed,
  Users,
  CheckCircle,
  Wallet,
  ChevronDown,
  Brain,
  Lock,
  Sparkles,
  Moon,
  Sun,
  Globe,
  Check,
  X as XIcon,
  Zap,
  ShieldAlert,
  ListTodo,
  TrendingUp,
  MessageSquareX,
  BookX,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/* ─────────────── i18n dict ─────────────── */
const dict = {
  en: {
    heroTitle: 'The Intelligent Workspace for Hostel & Shared Mess Management',
    heroSubtitle:
      'Track daily meals, coordinate bazar schedules, record deposits, and automate monthly settlements with mathematical precision — built for university students and co-living boarders.',
    getStarted: 'Get Started Free',
    dashboard: 'Go to Dashboard',
    featuresTitle: 'Complete Mess Management — A to Z',
    featuresSubtitle: 'Every feature your mess needs, nothing you do not.',
    workflowTitle: 'Hassle-Free for Both Members & Managers',
    workflowSubtitle: 'See exactly how each role operates their day — no notebooks, no confusion, no disputes.',
    rolesTitle: 'Role-Based Permissions & Functions',
    rolesSubtitle: 'Four distinct tiers — from Supreme Admin to Border Member — each with tailored functions and security boundaries.',
    compareTitle: 'Why NL Mess Pro Beats Everything Else',
    compareSubtitle: 'Compare us against the tools most messes are currently using.',
    faqTitle: 'Frequently Asked Questions',
    aiTitle: 'For Web Crawlers & AI Search Bots',
    aiDesc: 'This section maps out all software parameters, data schemas, and mathematical calculations of NL Mess Pro for semantic search indexing and AI agent discovery.',
    rights: 'All Rights Reserved.',
  },
  bn: {
    heroTitle: 'মেস ও হোস্টেল পরিচালনার সম্পূর্ণ ডিজিটাল সমাধান',
    heroSubtitle:
      'দৈনিক মিল ট্র্যাকিং, বাজার খরচ সমন্বয়, ডিপোজিট রেকর্ড ও মাস শেষে স্বয়ংক্রিয় সেটেলমেন্ট — বিশ্ববিদ্যালয় শিক্ষার্থী ও শেয়ার্ড মেস বোর্ডারদের জন্য তৈরি।',
    getStarted: 'বিনামূল্যে শুরু করুন',
    dashboard: 'ড্যাশবোর্ডে যান',
    featuresTitle: 'মেস ব্যবস্থাপনার এ টু জেড ফিচার',
    featuresSubtitle: 'মেসের প্রতিটি প্রয়োজনীয় সুবিধা এক জায়গায়।',
    workflowTitle: 'সদস্য ও ম্যানেজার উভয়ের জন্য সহজ অপারেশন',
    workflowSubtitle: 'প্রত্যেক রোল কীভাবে দৈনন্দিন কাজ করে তা দেখুন — কোনো খাতা নেই, কোনো বিভ্রান্তি নেই।',
    rolesTitle: 'রোল ভিত্তিক পারমিশন ও কার্যাবলী',
    rolesSubtitle: 'চারটি স্বতন্ত্র স্তর — সুপ্রীম অ্যাডমিন থেকে বোর্ডার সদস্য — প্রত্যেকের জন্য নির্দিষ্ট কার্যক্ষমতা ও নিরাপত্তা।',
    compareTitle: 'এনএল মেস প্রো কেন অন্যদের চেয়ে সেরা?',
    compareSubtitle: 'বেশিরভাগ মেস এখনো যা ব্যবহার করে তার সাথে আমাদের তুলনা দেখুন।',
    faqTitle: 'সাধারণ জিজ্ঞাসা',
    aiTitle: 'ওয়েব ক্রলার ও এআই বট গাইড',
    aiDesc: 'সেম্যান্টিক সার্চ ইনডেক্সিং ও এআই এজেন্টের সুবিধার্থে এনএল মেস প্রো এর সফটওয়্যার প্যারামিটার, ডাটা স্কিমা ও গাণিতিক হিসাবসমূহ নিচে তুলে ধরা হলো।',
    rights: 'সর্বস্বত্ব সংরক্ষিত।',
  },
};

/* ─────────────── Component ─────────────── */
export default function LandingPage() {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const t = language === 'bn' ? dict.bn : dict.en;

  const [bazarCost, setBazarCost] = useState(3500);
  const [totalMeals, setTotalMeals] = useState(140);
  const [userMeals, setUserMeals] = useState(32);
  const [userDeposit, setUserDeposit] = useState(1000);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  /* SEO metadata + JSON-LD */
  useEffect(() => {
    document.title = 'NL Mess Pro — Smart Hostel & Mess Meal Management App';

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    setMeta('description', 'NL Mess Pro is a premium mess management app for tracking hostel meals, bazaar costs, deposits, and automated monthly settlements. Built for university students and shared apartments.');
    setMeta('keywords', 'mess management app, hostel meal tracker, meal rate calculator, bazar expense tracker, border deposit, mess settlement, Bangladesh mess app, shared living management');
    setMeta('robots', 'index, follow');

    const schemaId = 'nl-mess-schema';
    let s = document.getElementById(schemaId);
    if (!s) { s = document.createElement('script'); s.id = schemaId; s.setAttribute('type', 'application/ld+json'); document.head.appendChild(s); }
    s.innerHTML = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'NL Mess Pro',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, Android, iOS',
      description: 'Smart mess & hostel management app for university students — tracks daily meals, bazar expenses, border deposits, and auto-generates monthly settlement sheets.',
      offers: { '@type': 'Offer', price: '0.00', priceCurrency: 'BDT' },
      featureList: [
        'Segmented meal logging (Morning 0.5 + Lunch 1.0 + Dinner 1.0)',
        'Carry-forward rule: auto-copies previous day meal if tomorrow is not set',
        'Bazar cost logging with daily meal rate calculation',
        'Personal deposit ledger and passbook',
        'Automated monthly settlement (Balance = Deposit − Meals × Meal Rate)',
        'Multi-tier roles: Supreme Admin, Mess Manager, Meal Manager, Border Member',
        'Manager approval queue for deposit verification',
        'Guest meal booking — max 2 per slot per border',
      ],
    });
    return () => { const el = document.getElementById(schemaId); if (el) el.remove(); };
  }, []);

  const mealRate = totalMeals > 0 ? bazarCost / totalMeals : 0;
  const userCost = userMeals * mealRate;
  const userBalance = userDeposit - userCost;

  const faqs = [
    {
      q: language === 'bn' ? 'মিল রেট কীভাবে হিসাব করা হয়?' : 'How is the meal rate calculated?',
      a: language === 'bn'
        ? 'মেসের সমস্ত বাজার খরচের যোগফলকে মোট মিল সংখ্যা দিয়ে ভাগ করে মিল রেট বের হয়। সূত্র: মিল রেট = মোট বাজার খরচ ÷ মোট মিল।'
        : 'Meal Rate = Total Monthly Bazar Cost ÷ Total Meals consumed by all members that month. Every border pays proportionally for exactly what they ate.',
    },
    {
      q: language === 'bn' ? 'আগামীকালের মিল আপডেট না করলে কী হয়?' : "What if I forget to update tomorrow's meal?",
      a: language === 'bn'
        ? 'খাবার অপচয় ঠেকাতে সিস্টেম স্বয়ংক্রিয়ভাবে আজকের মিল সেটিং আগামীকালের জন্য কপি করে নেয়।'
        : "The system automatically carries forward today's meal configuration to tomorrow as a default — preventing food shortfall and waste in the kitchen.",
    },
    {
      q: language === 'bn' ? 'গেস্ট মিল কীভাবে কাজ করে?' : 'How do guest meals work?',
      a: language === 'bn'
        ? 'মেসের সদস্যরা প্রতিটি বেলার জন্য সর্বোচ্চ ২টি গেস্ট মিল বুক করতে পারবেন। একটি বর্ডার উইজেট দিয়ে সহজে যোগ বা বিয়োগ করা যায়।'
        : 'Each border can add up to 2 guest meals per slot using the +/− guest counter. Guest meals are counted in the total meal tally and affect the meal rate accordingly.',
    },
    {
      q: language === 'bn' ? 'ডিপোজিট কীভাবে রেকর্ড হয়?' : 'How are deposits recorded?',
      a: language === 'bn'
        ? 'সদস্য ক্যাশ বা মোবাইল ব্যাংকিং (বিকাশ, রকেট, নগদ) দিলে ম্যানেজার এন্ট্রি দেন। তা তাৎক্ষণিকভাবে পাসবুকে যুক্ত হয়।'
        : 'Managers log deposits on behalf of members (Cash, bKash, Nagad, Rocket). The entry appears instantly in the member\'s passbook and updates their running balance.',
    },
    {
      q: language === 'bn' ? 'মাস শেষে হিসাব কীভাবে করা হয়?' : 'How is the month-end settlement calculated?',
      a: language === 'bn'
        ? 'চূড়ান্ত ব্যালেন্স = মোট জমা − (মোট মিল × মিল রেট)। ব্যালেন্স ইতিবাচক হলে অগ্রিম, নেতিবাচক হলে বকেয়া।'
        : 'Final Balance = Total Deposits − (Total Meals × Meal Rate). Positive = advance credit, Negative = amount owed to manager. Auto-generated at any time.',
    },
    {
      q: language === 'bn' ? 'একাধিক মেস পরিচালনা করা যাবে?' : 'Can a user manage multiple messes?',
      a: language === 'bn'
        ? 'হ্যাঁ। একজন সদস্য বা ম্যানেজার একাধিক মেসে অ্যাকাউন্ট রাখতে এবং সহজেই এক মেস থেকে আরেক মেসে স্যুইচ করতে পারবেন।'
        : 'Yes. A single account can be linked to multiple messes. Switch between them seamlessly from the sidebar — ideal for hostel managers overseeing multiple floors or blocks.',
    },
  ];

  /* ─── render ─── */
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-[#0b0f19]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoIcon size={32} />
            <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white font-display">
              NL Mess <span className="text-blue-600 dark:text-blue-500">Pro</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
              <Globe className="w-4 h-4" /><span>{language === 'en' ? 'বাং' : 'EN'}</span>
            </button>
            <button onClick={toggleTheme}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-500 cursor-pointer">
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
            {user
              ? <button onClick={() => navigate('/dashboard')} className="bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md cursor-pointer">{t.dashboard}</button>
              : <button onClick={() => navigate('/login')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/10 cursor-pointer">{t.getStarted}</button>}
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-20 pb-20 lg:pt-28 lg:pb-28 border-b border-slate-200/50 dark:border-slate-800/40">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-7">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40">
            <Sparkles className="w-3.5 h-3.5" />{language === 'bn' ? 'স্মার্ট মেস ম্যানেজমেন্ট সিস্টেম' : 'Next-Gen Mess ERP System'}
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white font-display max-w-4xl mx-auto leading-tight">
            {t.heroTitle}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-semibold">
            {t.heroSubtitle}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            {user
              ? <button onClick={() => navigate('/dashboard')} className="w-full sm:w-auto px-8 py-4 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-bold rounded-2xl transition shadow-lg cursor-pointer flex items-center justify-center gap-2">{t.dashboard} <ArrowRight className="w-4 h-4" /></button>
              : <>
                  <button onClick={() => navigate('/login')} className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition shadow-lg shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2">{t.getStarted} <ArrowRight className="w-4 h-4" /></button>
                  <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-2xl transition hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">{language === 'bn' ? 'ফিচার দেখুন' : 'Explore Features'}</button>
                </>}
          </div>
          {/* trust strip */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-bold text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" />{language === 'bn' ? '১০০% বিনামূল্যে' : '100% Free to Use'}</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" />{language === 'bn' ? 'গুগল অ্যাকাউন্টে সাইন ইন' : 'Google Sign-In'}</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" />{language === 'bn' ? 'বাংলা ও ইংরেজি সমর্থন' : 'Bilingual (EN + BN)'}</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" />{language === 'bn' ? 'রিয়েল-টাইম আপডেট' : 'Real-Time Updates'}</span>
          </div>
        </div>
      </section>

      {/* ── SIMULATOR ── */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 space-y-2">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-widest">{language === 'bn' ? 'লাইভ ক্যালকুলেটর' : 'Live Calculator'}</span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight">{language === 'bn' ? 'হিসাব সিমুলেটর — নিজে চেষ্টা করুন' : 'Settlement Simulator — Try It Live'}</h2>
        </div>
        <div className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{language === 'bn' ? 'মাসিক বাজার খরচ' : 'Monthly Bazar Cost'} — {bazarCost.toLocaleString()} ৳</label>
              <input type="range" min="500" max="20000" step="100" value={bazarCost} onChange={e => setBazarCost(+e.target.value)} className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{language === 'bn' ? 'মোট মিল (সবার)' : 'Total Mess Meals'} — {totalMeals}</label>
              <input type="range" min="20" max="600" step="5" value={totalMeals} onChange={e => setTotalMeals(+e.target.value)} className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{language === 'bn' ? 'আমার মিল' : 'My Meals'}</label>
                <input type="number" value={userMeals} onChange={e => setUserMeals(Math.min(totalMeals, +(e.target.value) || 0))} className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{language === 'bn' ? 'আমার ডিপোজিট (৳)' : 'My Deposit (৳)'}</label>
                <input type="number" value={userDeposit} onChange={e => setUserDeposit(+(e.target.value) || 0)} className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </div>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{language === 'bn' ? 'হিসাব ফলাফল' : 'Calculation Output'}</h3>
            <div className="divide-y divide-slate-200/60 dark:divide-slate-800">
              <div className="py-3 flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400 font-medium">{language === 'bn' ? 'মিল রেট' : 'Meal Rate'}</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{mealRate.toFixed(3)} ৳</span>
              </div>
              <div className="py-3 flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400 font-medium">{language === 'bn' ? 'মোট খাবার খরচ' : 'My Meal Cost'}</span>
                <span className="font-mono font-black text-slate-900 dark:text-slate-100">{userCost.toFixed(2)} ৳</span>
              </div>
              <div className="py-3 flex justify-between items-baseline text-sm">
                <span className="text-slate-500 dark:text-slate-400 font-medium">{language === 'bn' ? 'চূড়ান্ত ব্যালেন্স' : 'Final Balance'}</span>
                <div className="text-right">
                  <div className={`font-mono font-black text-lg ${userBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{userBalance >= 0 ? '+' : ''}{userBalance.toFixed(2)} ৳</div>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${userBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{userBalance >= 0 ? (language === 'bn' ? '✓ অগ্রিম ক্রেডিট' : '✓ Advance Credit') : (language === 'bn' ? '⚠ বকেয়া পরিমাণ' : '⚠ Amount Due')}</div>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic font-medium">{language === 'bn' ? 'সূত্র: ব্যালেন্স = ডিপোজিট − (মিল × মিল রেট)' : 'Formula: Balance = Deposit − (Meals × Meal Rate)'}</p>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-16 bg-slate-100/50 dark:bg-slate-900/20 border-t border-b border-slate-200/60 dark:border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-widest block">{language === 'bn' ? 'মূল ফিচারসমূহ' : 'Core Features'}</span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">{t.featuresTitle}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto font-semibold">{t.featuresSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Calendar, color: 'blue', title: language === 'bn' ? 'সেগমেন্টেড মিল লগিং' : 'Segmented Meal Logging', body: language === 'bn' ? 'সকাল (০.৫), দুপুর (১.০) ও রাত (১.০) আলাদাভাবে সেট করুন। মোট মিল তাৎক্ষণিক আপডেট হয়।' : 'Toggle Morning (0.5), Lunch (1.0), and Dinner (1.0) independently. Daily count syncs instantly to the kitchen roster.' },
              { icon: Brain, color: 'indigo', title: language === 'bn' ? 'স্মার্ট ক্যারি-ফরওয়ার্ড' : 'Smart Meal Carry-Forward', body: language === 'bn' ? 'কেউ আপডেট দিতে ভুললে সিস্টেম আজকের মিল সেটিং কাল রাতের জন্য স্বয়ংক্রিয়ভাবে কপি করে।' : "Missed updating tomorrow? The system copies today's exact meal config forward — no kitchen shortfall, no wasted food." },
              { icon: UtensilsCrossed, color: 'rose', title: language === 'bn' ? 'স্বচ্ছ বাজার লগ' : 'Transparent Bazar Logs', body: language === 'bn' ? 'বাজারের বিস্তারিত, ক্রেতার নাম, মোট খরচ ও মিল রেট প্রতিটি এন্ট্রিতে রেকর্ড থাকে।' : 'Log each market receipt with buyer identity, total spend, and computed meal rate — full audit trail for every taka.' },
              { icon: Wallet, color: 'emerald', title: language === 'bn' ? 'ডিজিটাল পাসবুক' : 'Personal Deposit Ledger', body: language === 'bn' ? 'বিকাশ, ক্যাশ, নগদ — সব জমার ইতিহাস সদস্যের পাসবুকে তাৎক্ষণিকভাবে যুক্ত হয়।' : 'Every deposit (Cash / bKash / Nagad / Rocket) is logged and reflects instantly in the member\'s personal passbook.' },
              { icon: CheckCircle, color: 'amber', title: language === 'bn' ? 'অটো ব্যালেন্স শিট' : 'Auto Settlement Sheets', body: language === 'bn' ? 'মাস শেষে কার কত বকেয়া বা অগ্রিম — সব এক ক্লিকে তৈরি।' : 'Month-end balance sheets auto-generate showing every member\'s advance/due with zero manual arithmetic.' },
              { icon: Lock, color: 'purple', title: language === 'bn' ? 'মাল্টি-টায়ার রোল সিস্টেম' : 'Multi-Tier Role System', body: language === 'bn' ? 'সুপ্রীম অ্যাডমিন, মেস ম্যানেজার, মিল ম্যানেজার ও বোর্ডার — চারটি পৃথক অ্যাক্সেস স্তর।' : '4 distinct roles: Supreme Admin, Mess Manager, Meal Manager, Border Member — each scoped to the right functions only.' },
              { icon: ShieldCheck, color: 'teal', title: language === 'bn' ? 'অনুমোদন প্যানেল' : 'Deposit Approval Queue', body: language === 'bn' ? 'ম্যানেজার দ্রুত পেন্ডিং লেনদেন রিভিউ করতে ও অনুমোদন দিতে পারেন।' : 'Managers review pending deposit submissions with a visual queue — approve, reject, or query in one click.' },
              { icon: BarChart3, color: 'sky', title: language === 'bn' ? 'ম্যানেজার ড্যাশবোর্ড' : 'Manager Analytics Dashboard', body: language === 'bn' ? 'আজকের মোট মিল, ব্রেকফাস্ট/লাঞ্চ/ডিনার সংখ্যা, বাজার খরচ ও মিল রেট এক নজরে।' : "See today's full meal breakdown, bazar spend, meal rate, and guest meals at a glance — no more guesswork." },
              { icon: Users, color: 'pink', title: language === 'bn' ? 'গেস্ট মিল ব্যবস্থাপনা' : 'Guest Meal Management', body: language === 'bn' ? 'প্রতি বেলায় সর্বোচ্চ ২টি গেস্ট মিল — বোর্ডার উইজেটে সহজে বাড়ানো বা কমানো যায়।' : 'Up to 2 guest meals per slot per border, controlled with a clean +/− counter included in the total kitchen count.' },
            ].map(({ icon: Icon, color, title, body }, i) => (
              <div key={i} className="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl space-y-3 shadow-xs hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border
                  ${color === 'blue' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/40' : ''}
                  ${color === 'indigo' ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40' : ''}
                  ${color === 'rose' ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/40' : ''}
                  ${color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40' : ''}
                  ${color === 'amber' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40' : ''}
                  ${color === 'purple' ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/40' : ''}
                  ${color === 'teal' ? 'bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/40' : ''}
                  ${color === 'sky' ? 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-900/40' : ''}
                  ${color === 'pink' ? 'bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-900/40' : ''}
                `}><Icon className="w-5 h-5" /></div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">{title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MEMBER & MANAGER WORKFLOW ── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">{language === 'bn' ? 'ব্যবহারকারী অভিজ্ঞতা' : 'Daily Workflows'}</span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">{t.workflowTitle}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto font-semibold">{t.workflowSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Border Member */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white space-y-6 relative overflow-hidden shadow-xl shadow-blue-600/20">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:20px_20px]" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center border border-white/20"><Users className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-xl font-black font-display">{language === 'bn' ? 'বোর্ডার সদস্য হলে' : 'As a Border Member'}</h3>
                  <p className="text-blue-200 text-xs font-semibold">{language === 'bn' ? 'প্রতিদিন মাত্র ১০ সেকেন্ড' : 'Just 10 seconds a day'}</p>
                </div>
              </div>
              <ul className="space-y-4">
                {(language === 'bn' ? [
                  ['এক ট্যাপে মিল সেট', 'কাল সকাল, দুপুর ও রাতের মিল টগল করুন। মিস করলে সিস্টেম আজকেরটা কপি করবে।'],
                  ['লাইভ ব্যালেন্স দেখুন', 'আপনার জমা, বাজার শেয়ার ও চলতি ব্যালেন্স রিয়েল-টাইমে ড্যাশবোর্ডে দেখা যাবে।'],
                  ['গেস্ট মিল বুক করুন', 'অতিথি এলে + বোতামে ট্যাপ করুন। প্রতি বেলায় সর্বোচ্চ ২টি গেস্ট মিল।'],
                  ['পাসবুক চেক করুন', 'বিকাশ, ক্যাশ — সব জমার সম্পূর্ণ ইতিহাস এক জায়গায়।'],
                ] : [
                  ['Tap to set meals', "Toggle tomorrow's breakfast, lunch, dinner in one screen. Miss it? The system copies today's config."],
                  ['Live balance view', 'See your deposits, meal share, and running balance in real-time from your personal dashboard.'],
                  ['Book guest meals', 'Tap + for each guest per meal slot. Up to 2 guests per period — included in the shared kitchen count.'],
                  ['Check your passbook', 'Full history of bKash, Cash, Nagad deposits — searchable and filterable by month.'],
                ]).map(([title, desc], i) => (
                  <li key={i} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 border border-white/20">{i + 1}</div>
                    <div>
                      <div className="font-bold text-sm">{title}</div>
                      <div className="text-blue-200 text-xs leading-relaxed font-semibold mt-0.5">{desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mess Manager */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-950 rounded-3xl p-8 text-white space-y-6 relative overflow-hidden shadow-xl shadow-slate-900/30 border border-slate-700">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:20px_20px]" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/15"><ShieldAlert className="w-6 h-6 text-blue-400" /></div>
                <div>
                  <h3 className="text-xl font-black font-display">{language === 'bn' ? 'মেস ম্যানেজার হলে' : 'As a Mess Manager'}</h3>
                  <p className="text-slate-400 text-xs font-semibold">{language === 'bn' ? 'কোনো খাতা-কলম নেই, কোনো ভুল নেই' : 'No notebook, no math errors'}</p>
                </div>
              </div>
              <ul className="space-y-4">
                {(language === 'bn' ? [
                  ['বাজার খরচ যুক্ত করুন', 'ক্রেতার নাম ও মোট খরচ দিন — মিল রেট ও প্রতিজনের ভাগ অটোমেটিক হিসেব হয়ে যাবে।'],
                  ['ডিপোজিট অনুমোদন করুন', 'পেন্ডিং লেনদেনের লিস্ট দেখুন ও এক ক্লিকে যাচাই করুন।'],
                  ['আজকের মিল ওভারভিউ', 'আজকের মোট ব্রেকফাস্ট, লাঞ্চ, ডিনার ও গেস্ট মিল সংখ্যা ড্যাশবোর্ডে।'],
                  ['মাস শেষে সেটেলমেন্ট', 'প্রতিটি সদস্যের মোট খরচ ও ব্যালেন্স এক ক্লিকে তৈরি।'],
                ] : [
                  ['Log bazar costs', 'Enter buyer name and total spend. Meal rate recalculates instantly and updates every member\'s share.'],
                  ['Approve deposits', 'Review pending Cash/Mobile payments in a visual queue and verify with one tap.'],
                  ['Today\'s meal overview', 'See today\'s full kitchen count — Breakfast, Lunch, Dinner, Guest Meals — at a glance.'],
                  ['Month-end settlement', 'Every member\'s final bill auto-generates. No spreadsheets, no calculation errors.'],
                ]).map(([title, desc], i) => (
                  <li key={i} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600/30 flex items-center justify-center text-[10px] font-black text-blue-400 shrink-0 mt-0.5 border border-blue-500/30">{i + 1}</div>
                    <div>
                      <div className="font-bold text-sm">{title}</div>
                      <div className="text-slate-400 text-xs leading-relaxed font-semibold mt-0.5">{desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section className="py-16 bg-slate-100/50 dark:bg-slate-900/20 border-t border-b border-slate-200/60 dark:border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest block">{language === 'bn' ? 'অ্যাক্সেস কন্ট্রোল' : 'Access Control'}</span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">{t.rolesTitle}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto font-semibold">{t.rolesSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Zap, badge: 'Supreme Admin', color: 'blue',
                perms: language === 'bn'
                  ? ['নতুন মেস তৈরি', 'মেস অনবোর্ডিং নিয়ন্ত্রণ', 'প্ল্যাটফর্ম পর্যবেক্ষণ', 'সকল ডেটায় প্রবেশাধিকার']
                  : ['Create new messes', 'Manage onboarding', 'Platform-wide oversight', 'Access any mess data'],
                desc: language === 'bn' ? 'প্ল্যাটফর্মের সর্বোচ্চ নিয়ন্ত্রক। সব মেসের ওপর কর্তৃত্ব।' : 'Highest authority. Full platform control across all registered messes.',
              },
              {
                icon: Lock, badge: 'Mess Manager', color: 'indigo',
                perms: language === 'bn'
                  ? ['বাজার খরচ যোগ করা', 'ডিপোজিট অনুমোদন', 'মিল লক সময় সেট', 'মাসিক সেটেলমেন্ট']
                  : ['Log bazar costs', 'Approve deposits', 'Set meal lock time', 'Generate settlements'],
                desc: language === 'bn' ? 'মেসের প্রধান চালক। আর্থিক ও রান্নাঘর সমস্ত কাজ।' : 'Primary mess operator. Handles finances, bazar, and month-end accounts.',
              },
              {
                icon: ListTodo, badge: 'Meal Manager', color: 'amber',
                perms: language === 'bn'
                  ? ['মিল লগ এডিট', 'গেস্ট মিল নিয়ন্ত্রণ', 'মিল ট্র্যাকার মনিটর', 'সদস্য তালিকা দেখা']
                  : ['Edit meal logs', 'Manage guest meals', 'Monitor plate counts', 'View member list'],
                desc: language === 'bn' ? 'রান্নাঘরের অপারেশন পরিচালনা করেন। মিল সংখ্যা সঠিক রাখেন।' : 'Kitchen operations clerk. Ensures accurate plate counts and timely updates.',
              },
              {
                icon: Users, badge: 'Border Member', color: 'rose',
                perms: language === 'bn'
                  ? ['নিজের মিল টগল', 'গেস্ট মিল রিকোয়েস্ট', 'পাসবুক দেখা', 'নিজের ব্যালেন্স দেখা']
                  : ['Toggle own meals', 'Book guest meals', 'View own passbook', 'Check personal balance'],
                desc: language === 'bn' ? 'সাধারণ মেস সদস্য। নিজের হিসাব নিজেই ট্র্যাক করেন।' : 'General boarder. Self-manages meals, deposits, and personal settlement.',
              },
            ].map(({ icon: Icon, badge, color, perms, desc }, i) => (
              <div key={i} className="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs">
                <div className={`flex items-center gap-2 font-black text-sm uppercase tracking-wider font-sans
                  ${color === 'blue' ? 'text-blue-600 dark:text-blue-400' : ''}
                  ${color === 'indigo' ? 'text-indigo-600 dark:text-indigo-400' : ''}
                  ${color === 'amber' ? 'text-amber-600 dark:text-amber-400' : ''}
                  ${color === 'rose' ? 'text-rose-600 dark:text-rose-400' : ''}
                `}><Icon className="w-4 h-4" />{badge}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">{desc}</p>
                <ul className="space-y-1.5">
                  {perms.map((p, j) => (
                    <li key={j} className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-350 font-semibold">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />{p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">{language === 'bn' ? 'প্রতিযোগিতামূলক তুলনা' : 'Competitive Analysis'}</span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">{t.compareTitle}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto font-semibold">{t.compareSubtitle}</p>
        </div>

        {/* pain point cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { icon: BookX, color: 'rose', label: language === 'bn' ? 'খাতা-ডায়েরি' : 'Paper Diaries', problems: language === 'bn' ? ['হিসাব ভুল হয়', 'হারিয়ে যায়', 'শেয়ার করা যায় না'] : ['Arithmetic errors', 'Gets lost or damaged', 'Cannot share real-time'] },
            { icon: MessageSquareX, color: 'amber', label: language === 'bn' ? 'হোয়াটসঅ্যাপ গ্রুপ' : 'WhatsApp Groups', problems: language === 'bn' ? ['বার্তা হারিয়ে যায়', 'স্বয়ংক্রিয় হিসাব নেই', 'বিরোধ সৃষ্টি হয়'] : ['Messages get buried', 'No auto-calculation', 'Disputes and confusion'] },
            { icon: TrendingUp, color: 'slate', label: language === 'bn' ? 'সাধারণ মেস অ্যাপ' : 'Basic Mess Apps', problems: language === 'bn' ? ['ক্যারি-ফরওয়ার্ড নেই', 'গেস্ট মিল নেই', 'অনুমোদন সিস্টেম নেই'] : ['No carry-forward', 'No guest meals', 'No approval workflow'] },
          ].map(({ icon: Icon, color, label, problems }, i) => (
            <div key={i} className="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-xs">
              <div className={`flex items-center gap-2 text-sm font-bold
                ${color === 'rose' ? 'text-rose-500' : ''}${color === 'amber' ? 'text-amber-500' : ''}${color === 'slate' ? 'text-slate-500 dark:text-slate-400' : ''}`}>
                <Icon className="w-4 h-4" />{label}
              </div>
              <ul className="space-y-1.5">{problems.map((p, j) => <li key={j} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold"><XIcon className="w-3.5 h-3.5 text-rose-400 shrink-0" />{p}</li>)}</ul>
            </div>
          ))}
        </div>

        {/* comparison table */}
        <div className="overflow-x-auto rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/30 shadow-sm">
          <table className="w-full text-left border-collapse text-xs min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800">
                <th className="px-5 py-4 font-bold text-slate-700 dark:text-slate-300 w-[36%]">{language === 'bn' ? 'ফিচার' : 'Feature'}</th>
                <th className="px-5 py-4 font-black text-blue-600 dark:text-blue-400 bg-blue-500/5">NL Mess Pro</th>
                <th className="px-5 py-4 font-semibold text-slate-500 dark:text-slate-400">{language === 'bn' ? 'খাতা' : 'Paper Diary'}</th>
                <th className="px-5 py-4 font-semibold text-slate-500 dark:text-slate-400">{language === 'bn' ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}</th>
                <th className="px-5 py-4 font-semibold text-slate-500 dark:text-slate-400">{language === 'bn' ? 'অন্যান্য অ্যাপ' : 'Other Apps'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800 font-semibold text-slate-500 dark:text-slate-400">
              {(language === 'bn' ? [
                ['স্বয়ংক্রিয় মিল রেট হিসাব', true, false, false, true],
                ['পূর্ববর্তী মিল ক্যারি-ফরওয়ার্ড', true, false, false, false],
                ['গেস্ট মিল ট্র্যাকিং (২ পর্যন্ত)', true, false, false, false],
                ['ডিপোজিট অনুমোদন প্যানেল', true, false, false, false],
                ['স্বয়ংক্রিয় মাসিক সেটেলমেন্ট', true, false, false, true],
                ['রিয়েল-টাইম ড্যাশবোর্ড', true, false, false, true],
                ['মাল্টি-মেস সাপোর্ট', true, false, false, false],
                ['বাংলা ভাষা সমর্থন', true, false, false, false],
              ] : [
                ['Automatic meal rate calculation', true, false, false, true],
                ['Previous day meal carry-forward', true, false, false, false],
                ['Guest meal tracking (up to 2)', true, false, false, false],
                ['Deposit approval queue', true, false, false, false],
                ['Auto month-end settlement', true, false, false, true],
                ['Real-time dashboard', true, false, false, true],
                ['Multi-mess support', true, false, false, false],
                ['Bangla language support', true, false, false, false],
              ]).map(([label, ...vals], i) => (
                <tr key={i}>
                  <td className="px-5 py-3.5 text-slate-900 dark:text-white font-bold text-[11px]">{label}</td>
                  {vals.map((v, j) => (
                    <td key={j} className={`px-5 py-3.5 ${j === 0 ? 'bg-blue-500/5' : ''}`}>
                      {v ? <Check className={`w-4 h-4 ${j === 0 ? 'text-emerald-500 stroke-[3]' : 'text-emerald-400'}`} /> : <XIcon className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 bg-slate-100/50 dark:bg-slate-900/20 border-t border-slate-200/60 dark:border-slate-800/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight text-center">{t.faqTitle}</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const open = openFaq === i;
              return (
                <div key={i} className="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <button onClick={() => setOpenFaq(open ? null : i)} className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-sm text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer">
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && <div className="px-6 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">{faq.a}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-indigo-900 rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-blue-600/20">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="relative space-y-5">
            <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight">{language === 'bn' ? 'আজই মেস ডিজিটাল করুন' : 'Digitize Your Mess Today'}</h2>
            <p className="text-blue-200 text-sm sm:text-base max-w-xl mx-auto font-semibold leading-relaxed">{language === 'bn' ? 'বিনামূল্যে শুরু করুন। খাতা-কলমের ঝামেলা সরান। মাস শেষের হিসাব সেকেন্ডে করুন।' : 'Start free. Eliminate notebooks. Generate accurate month-end settlements in seconds — for every border.'}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              {user
                ? <button onClick={() => navigate('/dashboard')} className="px-8 py-4 bg-white text-indigo-900 font-black rounded-2xl transition hover:bg-blue-50 shadow-lg cursor-pointer flex items-center justify-center gap-2">{t.dashboard} <ArrowRight className="w-4 h-4" /></button>
                : <button onClick={() => navigate('/login')} className="px-8 py-4 bg-white text-indigo-900 font-black rounded-2xl transition hover:bg-blue-50 shadow-lg cursor-pointer flex items-center justify-center gap-2">{t.getStarted} <ArrowRight className="w-4 h-4" /></button>}
            </div>
          </div>
        </div>
      </section>

      {/* ── AI / CRAWLER SECTION ── */}
      <section className="py-16 bg-slate-950 text-slate-400 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center gap-2 text-white">
            <Brain className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold tracking-tight font-display">{t.aiTitle}</h2>
          </div>
          <p className="text-xs leading-relaxed max-w-3xl">{t.aiDesc}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 text-[11px] font-mono">
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
              <h3 className="text-white font-bold font-sans text-xs mb-3">System Architecture</h3>
              <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
                <li>Backend: Google Cloud Firestore (NoSQL document store)</li>
                <li>Auth: Google OAuth via Firebase Authentication</li>
                <li>Collections: users, meals, bazarCosts, deposits, messes</li>
                <li>Meal Rate Formula: Meal Rate = Total Bazar Cost / Total Meals</li>
                <li>Balance Formula: Balance = Sum(Deposits) - (Meals × Meal Rate)</li>
                <li>Locking: Tomorrow meal freeze at manager-set cutoff time</li>
                <li>Carry-forward scope: Only the day after current date (tomorrow)</li>
              </ul>
            </div>
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
              <h3 className="text-white font-bold font-sans text-xs mb-3">Business Rules</h3>
              <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
                <li>Meal segments: Morning = 0.5, Lunch = 1.0, Dinner = 1.0</li>
                <li>Guest meal cap: Maximum 2 guest meals per slot per border</li>
                <li>Carry-forward: Only tomorrow, not historical dates</li>
                <li>Roles: Supreme Admin, Mess Manager, Meal Manager, Border</li>
                <li>Multi-mess: One account can join / manage multiple messes</li>
                <li>Deposit methods: Cash, bKash, Nagad, Rocket, Bank Transfer</li>
                <li>Language support: English (EN) and Bengali (বাংলা)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-950 border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-2">
            <LogoIcon size={22} />
            <span>NL Mess Pro &copy; {new Date().getFullYear()}. {t.rights}</span>
          </div>
          <div className="flex items-center gap-5">
            <span className="hover:text-slate-300 cursor-pointer transition">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer transition">Terms of Service</span>
            <span className="hover:text-slate-300 cursor-pointer transition">Contact</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
