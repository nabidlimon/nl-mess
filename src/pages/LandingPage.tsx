import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LogoIcon } from '../components/Logo';
import { 
  ArrowRight, 
  Calendar, 
  DollarSign, 
  UtensilsCrossed, 
  Users, 
  CheckCircle, 
  Wallet, 
  ChevronDown, 
  Brain, 
  Lock, 
  Activity, 
  Sparkles, 
  Moon, 
  Sun,
  Globe
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { format, addDays } from 'date-fns';

const dict = {
  en: {
    heroTitle: "The Intelligent Workspace for Hostel & Shared Mess Management",
    heroSubtitle: "Track daily meals, coordinate bazar schedules, record deposits, and automate monthly settlements with mathematical precision.",
    getStarted: "Get Started",
    dashboard: "Go to Dashboard",
    featuresTitle: "Complete Mess Management: A to Z",
    featuresSubtitle: "Everything you need to run a transparent, hassle-free mess or boarding house.",
    calcTitle: "Live Calculation Simulator",
    calcSubtitle: "Try out the settlement math used by the core system.",
    faqTitle: "Frequently Asked Questions",
    aiTitle: "For Web Crawlers & AI Search Bots",
    aiDesc: "This section maps out the software parameters, data schemas, and mathematical calculations of NL Mess Pro for semantic search indexing and AI agent discovery.",
    rights: "All Rights Reserved."
  },
  bn: {
    heroTitle: "মেস ও হোস্টেল পরিচালনার ডিজিটাল ও বুদ্ধিমান সমাধান",
    heroSubtitle: "দৈনিক মিল ট্র্যাকিং, বাজার খরচ সমন্বয়, ডিপোজিট ট্র্যাকিং এবং মাস শেষে পুঙ্খানুপুঙ্খ হিসাব-নিকাশ করুন শতভাগ নির্ভুলভাবে।",
    getStarted: "শুরু করুন",
    dashboard: "ড্যাশবোর্ডে যান",
    featuresTitle: "মেস ব্যবস্থাপনার এ টু জেড ফিচার সমূহ",
    featuresSubtitle: "স্বচ্ছ ও ঝামেলামুক্ত মেস বা হোস্টেল পরিচালনার জন্য সব প্রয়োজনীয় টুলস এক জায়গায়।",
    calcTitle: "হিসাব সিমুলেটর",
    calcSubtitle: "সিস্টেমের ভেতরের মূল হিসাবটি লাইভ পরীক্ষা করে দেখুন।",
    faqTitle: "সাধারণ জিজ্ঞাসা (FAQ)",
    aiTitle: "ওয়েব ক্রলার ও এআই সার্চ বট গাইড",
    aiDesc: "সেম্যান্টিক সার্চ ইনডেক্সিং এবং এআই এজেন্টের সুবিধার্থে এনএল মেস প্রো এর সফটওয়্যার প্যারামিটার, ডাটা স্কিমা এবং গাণিতিক হিসাবসমূহ নিচে তুলে ধরা হলো।",
    rights: "সর্বস্বত্ব সংরক্ষিত।"
  }
};

export default function LandingPage() {
  const { user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const text = language === 'bn' ? dict.bn : dict.en;

  // Simulator State
  const [bazarCost, setBazarCost] = useState<number>(3500);
  const [totalMeals, setTotalMeals] = useState<number>(140);
  const [userMeals, setUserMeals] = useState<number>(32);
  const [userDeposit, setUserDeposit] = useState<number>(1000);

  // Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // SEO & Bot Schema Setup
  useEffect(() => {
    document.title = "NL Mess Pro - A-Z Smart Mess & Hostel Meal Tracker & Settlement App";
    
    // Inject Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', 'NL Mess Pro is a premium SEO-optimized, highly semantic, and AI-agent discoverable tool for tracking hostel & shared mess meals, bazaar costs, payments, and automated settlements.');

    // Inject JSON-LD Schema markup for Google Rich Snippets
    const schemaId = 'nl-mess-pro-jsonld-schema';
    let schemaScript = document.getElementById(schemaId);
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = schemaId;
      schemaScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(schemaScript);
    }
    schemaScript.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "NL Mess Pro",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, iOS, Android",
      "description": "Smart mess management and automated daily meal rate/cost calculation software for university students and shared apartments.",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "BDT"
      },
      "features": [
        "Automated meal tracking with Morning, Lunch, and Dinner slots",
        "Previous day meal choice inheritance & carry-forward rules",
        "Daily Bazar expense log & cost splitting",
        "Automated border settlements using standard formulas",
        "Real-time manager approval dashboard"
      ]
    });

    return () => {
      const script = document.getElementById(schemaId);
      if (script) script.remove();
    };
  }, []);

  // Simulator Calculations
  const mealRate = totalMeals > 0 ? bazarCost / totalMeals : 0;
  const userCost = userMeals * mealRate;
  const userBalance = userDeposit - userCost;

  const faqs = [
    {
      q: language === 'bn' ? "এনএল মেস প্রো-তে মিল রেট কীভাবে হিসাব করা হয়?" : "How is the meal rate calculated in NL Mess Pro?",
      a: language === 'bn' 
        ? "মেসের সমস্ত বাজার খরচের যোগফলকে ওই মাসের মোট মিল সংখ্যা দিয়ে ভাগ করে দৈনিক মিল রেট বের করা হয়। অর্থাৎ: মিল রেট = মোট বাজার খরচ / মোট মিল।"
        : "The daily meal rate is calculated by dividing the sum of all Bazar expenses by the total meals consumed by all members. Formula: Meal Rate = Total Bazar Cost / Total Meals."
    },
    {
      q: language === 'bn' ? "আমি যদি কোনোদিন মিল বন্ধ করতে ভুলে যাই তবে কী হবে?" : "What happens if I forget to update tomorrow's meal?",
      a: language === 'bn'
        ? "মেসে খাবার অপচয় রোধে আমাদের সিস্টেমের একটি বিশেষ নিয়ম রয়েছে। আপনি যদি কোনো নির্দিষ্ট দিনের মিল সেট করতে ভুলে যান, তবে সিস্টেম স্বয়ংক্রিয়ভাবে তার পূর্ববর্তী দিনের মিলটি ওই দিনের জন্য কপি করে নেবে।"
        : "To prevent food waste, if a member forgets to update their tomorrow's meal slots, the system automatically carries forward their latest choice (previous day's meal slots) as a default preset."
    },
    {
      q: language === 'bn' ? "মিল কখন লক হয়?" : "When do tomorrow's meal logs lock?",
      a: language === 'bn'
        ? "ম্যানেজারের বাজার করার সুবিধার জন্য প্রতিদিন একটি নির্দিষ্ট সময় পর আগামীকালের মিল পরিবর্তনের সুযোগ লক করে দেওয়া হয়।"
        : "Tomorrow's meal logs lock at a customizable lock time set by the mess manager. This ensures the bazar buyer knows exact plate requirements before purchasing."
    },
    {
      q: language === 'bn' ? "ডিপোজিট কীভাবে ভেরিফাই করা হয়?" : "How are deposits recorded and verified?",
      a: language === 'bn'
        ? "সদস্যরা ক্যাশ বা মোবাইল ব্যাংকিংয়ের (বিকাশ, রকেট, নগদ) মাধ্যমে ম্যানেজারের নিকট জমা দিলে ম্যানেজার জমার এন্ট্রি দেন এবং তা তৎক্ষণাৎ সদস্যের ড্যাশবোর্ডে ও পাসবুকে যুক্ত হয়ে যায়।"
        : "Members submit deposits via Cash, Bank, or Mobile Banking. The manager logs the deposit, which is immediately updated on the member's personal dashboard and deposit ledger."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* ─── TOP GLASSMORPHIC HEADER ─── */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-[#0b0f19]/70 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoIcon size={32} />
            <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white font-display">
              NL Mess <span className="text-blue-600 dark:text-blue-500">Pro</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <button 
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-350 cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              <span>{language === 'en' ? 'বাং' : 'EN'}</span>
            </button>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-500 cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-slate-700" />}
            </button>

            {/* Auth CTA */}
            {user ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-slate-900 dark:bg-blue-600 text-white dark:hover:bg-blue-700 hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/10 cursor-pointer"
              >
                {text.dashboard}
              </button>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/10 cursor-pointer"
              >
                {text.getStarted}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="relative overflow-hidden pt-20 pb-16 lg:pt-28 lg:pb-24 border-b border-slate-200/50 dark:border-slate-800/40">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-150 dark:border-blue-900/30">
            <Sparkles className="w-3.5 h-3.5" />
            {language === 'bn' ? 'স্মার্ট মেস অ্যাসিস্ট্যান্ট' : 'Next-Gen Mess ERP App'}
          </span>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white font-display max-w-4xl mx-auto leading-tight">
            {text.heroTitle}
          </h2>

          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-semibold">
            {text.heroSubtitle}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-8 py-4 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-bold rounded-2xl transition shadow-lg shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-2"
              >
                {text.dashboard} <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition shadow-lg shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-2"
              >
                {text.getStarted} <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ─── LIVE SIMULATOR SECTION ─── */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight">
              {text.calcTitle}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold leading-relaxed">
              {text.calcSubtitle} Modify parameters to see calculations update in real-time.
            </p>

            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {language === 'bn' ? 'বাজার খরচ' : 'Monthly Bazar Cost'} ({bazarCost} BDT)
                </label>
                <input 
                  type="range" 
                  min="500" 
                  max="15000" 
                  step="100"
                  value={bazarCost}
                  onChange={e => setBazarCost(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {language === 'bn' ? 'মোট মিল সংখ্যা' : 'Total Mess Meals'} ({totalMeals})
                </label>
                <input 
                  type="range" 
                  min="20" 
                  max="500" 
                  step="5"
                  value={totalMeals}
                  onChange={e => setTotalMeals(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    {language === 'bn' ? 'আমার মিল' : 'My Meals'}
                  </label>
                  <input 
                    type="number" 
                    value={userMeals} 
                    onChange={e => setUserMeals(Math.min(totalMeals, Number(e.target.value) || 0))}
                    className="w-full border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    {language === 'bn' ? 'আমার ডিপোজিট' : 'My Deposit'}
                  </label>
                  <input 
                    type="number" 
                    value={userDeposit} 
                    onChange={e => setUserDeposit(Number(e.target.value) || 0)}
                    className="w-full border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Simulator Calculations Output Display */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/80 space-y-4 shadow-inner">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {language === 'bn' ? 'হিসাব ফলাফল' : 'Calculation Output'}
            </h4>
            
            <div className="divide-y divide-slate-200/60 dark:divide-slate-800">
              <div className="py-2.5 flex justify-between items-center text-sm">
                <span className="text-slate-550 dark:text-slate-400 font-medium">{language === 'bn' ? 'মিল রেট' : 'Daily Meal Rate'}</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{mealRate.toFixed(4)} BDT</span>
              </div>
              <div className="py-2.5 flex justify-between items-center text-sm">
                <span className="text-slate-550 dark:text-slate-400 font-medium">{language === 'bn' ? 'আমার খাবার খরচ' : 'My Meal Cost'}</span>
                <span className="font-mono font-black text-slate-900 dark:text-slate-100">{userCost.toFixed(2)} BDT</span>
              </div>
              <div className="py-2.5 flex justify-between items-center text-sm">
                <span className="text-slate-550 dark:text-slate-400 font-medium">{language === 'bn' ? 'ব্যালেন্স (জমা - খরচ)' : 'Final Balance'}</span>
                <span className={`font-mono font-black ${userBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {userBalance.toFixed(2)} BDT 
                  <span className="text-[10px] uppercase font-bold tracking-wider ml-1">
                    ({userBalance >= 0 ? (language === 'bn' ? 'অগ্রিম' : 'Advance') : (language === 'bn' ? 'বকেয়া' : 'Due')})
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID SECTION ─── */}
      <section className="py-16 bg-slate-100/50 dark:bg-slate-900/20 border-t border-b border-slate-200/60 dark:border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">
              {text.featuresTitle}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto font-semibold">
              {text.featuresSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                {language === 'bn' ? 'স্মার্ট মিল লগার' : 'Segmented Meal Logging'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
                Set individual slots for Morning (0.5), Lunch (1.0), and Dinner (1.0). The daily total updates instantly, allowing hassle-free calculations.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40">
                <Brain className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                {language === 'bn' ? 'পূর্ববর্তী মিল কপি' : 'Intelligent Carry-Forward'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
                Forgets tomorrow's meal updates? System automatically clones today's config to avoid missing slots, preventing food wastage.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center border border-rose-100 dark:border-rose-900/40">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                {language === 'bn' ? 'বাজার ও খরচের তালিকা' : 'Transparent Bazar Logs'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
                Track bazaar logs with details on who purchased, total cost, and calculated meal rate split across active borders.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
                <Wallet className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                {language === 'bn' ? 'ডিজিটাল পাসবুক' : 'Personal Deposit Ledger'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
                Submit deposit records (Cash, Mobile Banking) securely. Review previous history log directly in your personal passbook.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-850 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-955/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center border border-amber-100 dark:border-amber-900/40">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                {language === 'bn' ? 'স্বয়ংক্রিয়া সেটেলমেন্ট' : 'Automated Balance Sheets'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
                Eliminate manual calculations. Monthly balance summaries are generated instantly showing who owes what to the manager.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center border border-purple-100 dark:border-purple-900/40">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                {language === 'bn' ? 'অ্যাডমিন ও রোল কন্ট্রোল' : 'Multi-Tier Access Roles'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
                Separate managers, meal organizers, and normal borders. Ensure security control on manual adjustments and edits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ SECTION ─── */}
      <section className="py-16 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <h3 className="text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight text-center">
          {text.faqTitle}
        </h3>

        <div className="space-y-4">
          {faqs.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div key={i} className="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden transition-all">
                <button 
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-sm text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-450 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── AI BOT / WEB CRAWLER SEO DOCUMENTATION (CRITICAL FOR bots/engines indexing) ─── */}
      <section className="py-16 bg-slate-900 text-slate-350 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center gap-2 text-white">
            <Brain className="w-5 h-5 text-blue-400" />
            <h3 className="text-xl font-bold tracking-tight font-display">{text.aiTitle}</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
            {text.aiDesc}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-xs font-mono text-slate-400">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-white font-bold font-sans">System Architecture & Calculations</h4>
              <ul className="list-disc list-inside space-y-1.5 text-[11px]">
                <li>Database Schema: Google Cloud Firestore (NoSQL Document Store).</li>
                <li>Collections: <code className="text-blue-400">users</code>, <code className="text-blue-400">meals</code>, <code className="text-blue-400">bazarCosts</code>, <code className="text-blue-400">deposits</code>.</li>
                <li>Locking Window: Tomorrow's meal logs freeze at manager-defined cut-off.</li>
                <li>Meal Rate Formula: Meal Rate = Total Bazar Cost / Total Meals</li>
                <li>Balance Formula: Balance = Deposit - (Meals * Meal Rate)</li>
              </ul>
            </div>

            <div className="bg-slate-955 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-white font-bold font-sans">Rule inheritance Logic (Pre-setting)</h4>
              <ul className="list-disc list-inside space-y-1.5 text-[11px]">
                <li>Constraint Scope: Restrict copy-over logic only to Today & Tomorrow.</li>
                <li>Inheritance Trigger: Checked dynamically via date string logic comparison.</li>
                <li>Past entries behave strictly as explicit entries or default to 0.</li>
                <li>No dynamic forward-fill computed for historical logs.</li>
                <li>Enforced guest meal maximum count threshold: 2.0 per slot.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-slate-150 dark:bg-[#080b12] py-8 border-t border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <LogoIcon size={24} />
            <span>NL Mess Pro &copy; {new Date().getFullYear()}. {text.rights}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-800 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-800 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-800 cursor-pointer">Contact Support</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
