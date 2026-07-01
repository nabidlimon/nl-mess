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
  MessageSquareX,
  BookX,
  ShieldCheck,
  BarChart3,
  Mail,
  Github,
  Linkedin,
  Building2,
  Code2,
  HeartHandshake,
  TrendingUp,
  Star,
  Rocket,
  Clock,
  BadgeCheck,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/* ─── i18n ─── */
const dict = {
  en: {
    hero: 'The Intelligent Workspace for Hostel & Shared Mess Management',
    heroSub: 'Track daily meals, coordinate bazar schedules, record deposits, and automate monthly settlements — built for university students and co-living boarders in Bangladesh.',
    getStarted: 'Get Started Free',
    goToDash: 'Go to Dashboard',
    exploreFeatures: 'Explore Features',
    trustFree: '100% Free',
    trustGoogle: 'Google Sign-In',
    trustBilingual: 'English + বাংলা',
    trustRealtime: 'Real-Time Sync',
    calcHeading: 'Settlement Simulator — Try It Live',
    calcSub: 'Drag the sliders, see exactly how the system computes your monthly balance.',
    bazarLabel: 'Monthly Bazar Cost',
    totalMealsLabel: 'Total Mess Meals',
    myMealsLabel: 'My Meals',
    myDepositLabel: 'My Deposit (৳)',
    calcOutput: 'Calculation Output',
    mealRate: 'Meal Rate',
    mealCost: 'My Meal Cost',
    balance: 'Final Balance',
    advance: '✓ Advance Credit',
    due: '⚠ Amount Due',
    formula: 'Formula: Balance = Deposit − (Meals × Meal Rate)',
    featuresHeading: 'Complete Mess Management — A to Z',
    featuresSub: 'Every feature your mess needs, nothing it does not.',
    workflowHeading: 'Hassle-Free for Both Members & Managers',
    workflowSub: 'See exactly how each role operates every day — no paper, no confusion, no disputes.',
    asMember: 'As a Border Member',
    memberSub: 'Just 10 seconds a day',
    asManager: 'As a Mess Manager',
    managerSub: 'No notebook, no calculation errors',
    rolesHeading: 'Role-Based Permissions & Functions',
    rolesSub: 'Four granular access tiers — each with precisely scoped permissions to prevent unauthorized changes.',
    compareHeading: 'Why NL Mess Pro Beats Everything Else',
    compareSub: 'A full comparison against the tools most messes currently rely on.',
    whyHeading: '7 Reasons This System Is Better',
    whySub: 'Not just another app — a purpose-built, mathematically rigorous mess management platform.',
    creatorHeading: 'Meet the Creator',
    creatorSub: 'The engineer and designer behind NL Mess Pro.',
    companyHeading: 'About Nanolez Tech',
    companySub: 'The technology studio powering NL Mess Pro.',
    faqHeading: 'Frequently Asked Questions',
    ctaHeading: 'Digitize Your Mess Today',
    ctaSub: 'Start free. Eliminate notebooks. Generate accurate month-end settlements in seconds.',
    aiHeading: 'For Web Crawlers & AI Search Bots',
    aiDesc: 'Structured semantic data about NL Mess Pro for search engine indexing and AI agent discovery.',
    rights: 'All Rights Reserved.',
  },
  bn: {
    hero: 'মেস ও হোস্টেল পরিচালনার সম্পূর্ণ ডিজিটাল সমাধান',
    heroSub: 'দৈনিক মিল ট্র্যাকিং, বাজার খরচ সমন্বয়, ডিপোজিট রেকর্ড ও মাস শেষে স্বয়ংক্রিয় সেটেলমেন্ট — বিশ্ববিদ্যালয় শিক্ষার্থী ও শেয়ার্ড মেস বোর্ডারদের জন্য।',
    getStarted: 'বিনামূল্যে শুরু করুন',
    goToDash: 'ড্যাশবোর্ডে যান',
    exploreFeatures: 'ফিচার দেখুন',
    trustFree: '১০০% বিনামূল্যে',
    trustGoogle: 'গুগল সাইন-ইন',
    trustBilingual: 'বাংলা ও ইংরেজি',
    trustRealtime: 'রিয়েল-টাইম সিঙ্ক',
    calcHeading: 'হিসাব সিমুলেটর — নিজে চেষ্টা করুন',
    calcSub: 'স্লাইডার নাড়ান এবং দেখুন সিস্টেম কীভাবে মাসিক ব্যালেন্স হিসাব করে।',
    bazarLabel: 'মাসিক বাজার খরচ',
    totalMealsLabel: 'মোট মিল সংখ্যা',
    myMealsLabel: 'আমার মিল',
    myDepositLabel: 'আমার ডিপোজিট (৳)',
    calcOutput: 'হিসাব ফলাফল',
    mealRate: 'মিল রেট',
    mealCost: 'আমার মিলের খরচ',
    balance: 'চূড়ান্ত ব্যালেন্স',
    advance: '✓ অগ্রিম ক্রেডিট',
    due: '⚠ বকেয়া পরিমাণ',
    formula: 'সূত্র: ব্যালেন্স = ডিপোজিট − (মিল × মিল রেট)',
    featuresHeading: 'মেস ব্যবস্থাপনার এ টু জেড ফিচার',
    featuresSub: 'মেসের প্রতিটি প্রয়োজনীয় সুবিধা এক জায়গায়।',
    workflowHeading: 'সদস্য ও ম্যানেজার উভয়ের জন্য ঝামেলামুক্ত অপারেশন',
    workflowSub: 'প্রত্যেক রোল কীভাবে দৈনন্দিন কাজ করে তা দেখুন — কোনো খাতা নেই, কোনো বিভ্রান্তি নেই।',
    asMember: 'বোর্ডার সদস্য হলে',
    memberSub: 'প্রতিদিন মাত্র ১০ সেকেন্ড',
    asManager: 'মেস ম্যানেজার হলে',
    managerSub: 'কোনো খাতা-কলম নেই, কোনো ভুল নেই',
    rolesHeading: 'রোল ভিত্তিক পারমিশন ও কার্যাবলী',
    rolesSub: 'চারটি স্বতন্ত্র স্তর — প্রত্যেকের জন্য নির্দিষ্ট কার্যক্ষমতা ও নিরাপত্তা।',
    compareHeading: 'এনএল মেস প্রো কেন অন্যদের চেয়ে সেরা?',
    compareSub: 'বেশিরভাগ মেস এখনো যা ব্যবহার করে তার সাথে সম্পূর্ণ তুলনা।',
    whyHeading: '৭টি কারণে এই সিস্টেম সেরা',
    whySub: 'শুধু একটি অ্যাপ নয় — উদ্দেশ্যমূলকভাবে তৈরি একটি গাণিতিকভাবে নির্ভুল মেস ম্যানেজমেন্ট প্ল্যাটফর্ম।',
    creatorHeading: 'নির্মাতার পরিচয়',
    creatorSub: 'এনএল মেস প্রো-এর প্রকৌশলী ও ডিজাইনার।',
    companyHeading: 'নানোলেজ টেক সম্পর্কে',
    companySub: 'এনএল মেস প্রো পরিচালনাকারী প্রযুক্তি স্টুডিও।',
    faqHeading: 'সাধারণ জিজ্ঞাসা',
    ctaHeading: 'আজই মেস ডিজিটাল করুন',
    ctaSub: 'বিনামূল্যে শুরু করুন। খাতা-কলমের ঝামেলা সরান। মাস শেষের হিসাব সেকেন্ডে করুন।',
    aiHeading: 'ওয়েব ক্রলার ও এআই বট গাইড',
    aiDesc: 'সেম্যান্টিক সার্চ ইনডেক্সিং ও এআই এজেন্টের সুবিধার্থে কাঠামোগত ডেটা।',
    rights: 'সর্বস্বত্ব সংরক্ষিত।',
  },
};

/* ─── Helpers ─── */
const iconColor = (c: string) => ({
  blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/40',
  indigo: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40',
  rose: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/40',
  emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40',
  amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40',
  purple: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/40',
  teal: 'bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/40',
  sky: 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-900/40',
  pink: 'bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-900/40',
})[c] ?? '';

const Chip = ({ color, text }: { color: string; text: string }) => (
  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${color}`}>{text}</span>
);

/* ─── Component ─── */
export default function LandingPage() {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const t = language === 'bn' ? dict.bn : dict.en;
  const isEn = language === 'en';

  const [bazarCost, setBazarCost] = useState(3500);
  const [totalMeals, setTotalMeals] = useState(140);
  const [userMeals, setUserMeals] = useState(32);
  const [userDeposit, setUserDeposit] = useState(1000);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'NL Mess Pro — Smart Hostel & Mess Meal Management App | Nanolez Tech';
    const setMeta = (n: string, c: string) => {
      let el = document.querySelector(`meta[name="${n}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); el.name = n; document.head.appendChild(el); }
      el.content = c;
    };
    setMeta('description', 'NL Mess Pro by Nanolez Tech — a premium mess management app for tracking hostel meals, bazaar costs, deposits, and automated monthly settlements. Built for university students in Bangladesh.');
    setMeta('keywords', 'mess management app Bangladesh, hostel meal tracker, meal rate calculator, bazar expense tracker, border deposit, mess settlement app, Nanolez Tech, NL Mess Pro');
    setMeta('author', 'Nabid Ahamed, Nanolez Tech');
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
      author: { '@type': 'Person', name: 'Nabid Ahamed', email: 'nabidahamed2003@gmail.com', url: 'https://github.com/NabidAhammed' },
      publisher: { '@type': 'Organization', name: 'Nanolez Tech' },
      description: 'Smart mess & hostel management app for university students — tracks daily meals, bazar expenses, border deposits, and auto-generates monthly settlement sheets.',
      offers: { '@type': 'Offer', price: '0.00', priceCurrency: 'BDT' },
      featureList: ['Segmented meal logging (Morning 0.5 + Lunch 1.0 + Dinner 1.0)', 'Carry-forward: auto-copies previous day meal if tomorrow is not set', 'Bazar cost logging with daily meal rate calculation', 'Personal deposit ledger and passbook', 'Automated monthly settlement', 'Four access roles: Supreme Admin, Mess Manager, Meal Manager, Border Member', 'Manager approval queue for deposit verification', 'Guest meal booking — max 2 per slot', 'Multi-mess account support', 'Bilingual: English and Bengali'],
    });
    return () => { const el = document.getElementById(schemaId); if (el) el.remove(); };
  }, []);

  const mealRate = totalMeals > 0 ? bazarCost / totalMeals : 0;
  const userCost = userMeals * mealRate;
  const userBalance = userDeposit - userCost;

  const features = [
    { icon: Calendar, color: 'blue', title: isEn ? 'Segmented Meal Logging' : 'সেগমেন্টেড মিল লগিং', body: isEn ? 'Toggle Morning (0.5), Lunch (1.0), and Dinner (1.0) independently. Daily count syncs instantly to the kitchen roster.' : 'সকাল (০.৫), দুপুর (১.০) ও রাত (১.০) আলাদাভাবে সেট করুন। মোট মিল তাৎক্ষণিক আপডেট হয়।' },
    { icon: Brain, color: 'indigo', title: isEn ? 'Smart Meal Carry-Forward' : 'স্মার্ট ক্যারি-ফরওয়ার্ড', body: isEn ? "Missed updating tomorrow? The system copies today's exact meal config forward — no kitchen shortfall, no wasted food." : 'কেউ আপডেট দিতে ভুললে সিস্টেম আজকের মিল সেটিং কাল রাতের জন্য স্বয়ংক্রিয়ভাবে কপি করে।' },
    { icon: UtensilsCrossed, color: 'rose', title: isEn ? 'Transparent Bazar Logs' : 'স্বচ্ছ বাজার লগ', body: isEn ? 'Log each market receipt with buyer identity, total spend, and computed meal rate — full audit trail.' : 'বাজারের বিস্তারিত, ক্রেতার নাম, মোট খরচ ও মিল রেট প্রতিটি এন্ট্রিতে রেকর্ড থাকে।' },
    { icon: Wallet, color: 'emerald', title: isEn ? 'Personal Deposit Ledger' : 'ডিজিটাল পাসবুক', body: isEn ? 'Every deposit (Cash / bKash / Nagad / Rocket) reflects instantly in the member\'s personal passbook.' : 'বিকাশ, ক্যাশ, নগদ — সব জমার ইতিহাস সদস্যের পাসবুকে তাৎক্ষণিকভাবে যুক্ত হয়।' },
    { icon: CheckCircle, color: 'amber', title: isEn ? 'Auto Settlement Sheets' : 'অটো সেটেলমেন্ট শিট', body: isEn ? 'Month-end balance sheets auto-generate showing every member\'s advance/due with zero manual arithmetic.' : 'মাস শেষে কার কত বকেয়া বা অগ্রিম — সব এক ক্লিকে তৈরি।' },
    { icon: Lock, color: 'purple', title: isEn ? 'Multi-Tier Role System' : 'মাল্টি-টায়ার রোল সিস্টেম', body: isEn ? '4 distinct roles: Supreme Admin, Mess Manager, Meal Manager, Border Member — each scoped precisely.' : 'সুপ্রীম অ্যাডমিন, মেস ম্যানেজার, মিল ম্যানেজার ও বোর্ডার — চারটি পৃথক অ্যাক্সেস স্তর।' },
    { icon: ShieldCheck, color: 'teal', title: isEn ? 'Deposit Approval Queue' : 'ডিপোজিট অনুমোদন প্যানেল', body: isEn ? 'Managers review pending deposit submissions with a visual queue — approve, reject, or query in one click.' : 'ম্যানেজার পেন্ডিং লেনদেন রিভিউ করতে ও অনুমোদন দিতে পারেন এক ক্লিকে।' },
    { icon: BarChart3, color: 'sky', title: isEn ? 'Manager Analytics Dashboard' : 'ম্যানেজার অ্যানালিটিক্স', body: isEn ? "Today's full meal breakdown, bazar spend, meal rate, and guest meal count — all at a glance." : 'আজকের মোট মিল, বাজার খরচ, মিল রেট ও গেস্ট মিল সংখ্যা এক নজরে।' },
    { icon: Users, color: 'pink', title: isEn ? 'Guest Meal Management' : 'গেস্ট মিল ব্যবস্থাপনা', body: isEn ? 'Up to 2 guest meals per slot per border, with a clean +/− counter included in the total kitchen count.' : 'প্রতি বেলায় সর্বোচ্চ ২টি গেস্ট মিল — বোর্ডার উইজেটে সহজে বাড়ানো বা কমানো যায়।' },
  ];

  const memberSteps = isEn ? [
    ['Toggle meals in one tap', "Enable or disable tomorrow's breakfast, lunch, and dinner in a single screen. Miss it? System copies today."],
    ['Check live balance', 'See your running balance, deposited amount, and monthly meal cost updated in real-time.'],
    ['Book guest meals', 'Use the +/− counter for guests. Max 2 per slot — automatically counted in the shared kitchen roster.'],
    ['Review your passbook', 'Full searchable history of all bKash, Cash, Nagad deposits filtered by month.'],
  ] : [
    ['এক ট্যাপে মিল সেট', 'কাল সকাল, দুপুর ও রাতের মিল টগল করুন। মিস করলে সিস্টেম আজকেরটা কপি করবে।'],
    ['লাইভ ব্যালেন্স দেখুন', 'আপনার জমা, বাজার শেয়ার ও চলতি ব্যালেন্স রিয়েল-টাইমে ড্যাশবোর্ডে দেখা যাবে।'],
    ['গেস্ট মিল বুক করুন', 'অতিথি এলে + বোতামে ট্যাপ করুন। প্রতি বেলায় সর্বোচ্চ ২টি গেস্ট মিল।'],
    ['পাসবুক চেক করুন', 'বিকাশ, ক্যাশ, নগদ — সব জমার সম্পূর্ণ ইতিহাস এক জায়গায়।'],
  ];

  const managerSteps = isEn ? [
    ['Log bazar costs', "Enter buyer name and total spend. Meal rate recalculates instantly across every member's share."],
    ['Approve deposits', 'Review pending Cash/Mobile payments in a visual queue — verify, reject, or flag for follow-up.'],
    ["Today's kitchen overview", 'See today\'s Breakfast + Lunch + Dinner + Guest Meal counts before buying groceries.'],
    ['Generate settlement', "Every member's final bill auto-generates. Export or share. No spreadsheets, no errors."],
  ] : [
    ['বাজার খরচ যুক্ত করুন', 'ক্রেতার নাম ও মোট খরচ দিন — মিল রেট ও প্রতিজনের ভাগ অটোমেটিক হিসেব হয়ে যাবে।'],
    ['ডিপোজিট অনুমোদন করুন', 'পেন্ডিং লেনদেনের লিস্ট দেখুন ও এক ক্লিকে যাচাই করুন।'],
    ['আজকের মিল ওভারভিউ', 'আজকের মোট ব্রেকফাস্ট, লাঞ্চ, ডিনার ও গেস্ট মিল সংখ্যা বাজারে যাওয়ার আগে দেখুন।'],
    ['মাস শেষে সেটেলমেন্ট', 'প্রতিটি সদস্যের মোট খরচ ও ব্যালেন্স এক ক্লিকে তৈরি।'],
  ];

  const roles = [
    {
      icon: Zap, badge: 'Supreme Admin', color: 'text-blue-600 dark:text-blue-400',
      desc: isEn ? 'Highest authority. Full platform control across all registered messes, onboarding flows, and global configurations.' : 'প্ল্যাটফর্মের সর্বোচ্চ নিয়ন্ত্রক। সব মেসের ওপর কর্তৃত্ব।',
      perms: isEn ? ['Create & configure messes', 'Manage all onboarding', 'Platform-wide monitoring', 'Override any mess data'] : ['নতুন মেস তৈরি', 'মেস অনবোর্ডিং নিয়ন্ত্রণ', 'প্ল্যাটফর্ম মনিটরিং', 'সকল ডেটায় প্রবেশাধিকার'],
    },
    {
      icon: Lock, badge: 'Mess Manager', color: 'text-indigo-600 dark:text-indigo-400',
      desc: isEn ? 'Primary mess driver. Handles finances, bazar receipts, member approvals, and month-end accounts.' : 'মেসের প্রধান চালক। আর্থিক ও রান্নাঘর সমস্ত কাজ।',
      perms: isEn ? ['Log bazar costs', 'Approve deposits & payments', 'Set meal lock deadline', 'Generate monthly settlement', 'Manage member roles'] : ['বাজার খরচ যোগ করা', 'ডিপোজিট অনুমোদন', 'মিল লক সময় সেট', 'মাসিক সেটেলমেন্ট', 'সদস্য রোল ম্যানেজ'],
    },
    {
      icon: ListTodo, badge: 'Meal Manager', color: 'text-amber-600 dark:text-amber-400',
      desc: isEn ? 'Kitchen operations clerk. Ensures accurate plate counts, timely meal logs, and minimizes food waste.' : 'রান্নাঘরের অপারেশন পরিচালনা করেন। মিল সংখ্যা সঠিক রাখেন।',
      perms: isEn ? ['Edit member meal logs', 'Manage guest meal counts', 'Monitor daily plate roster', 'View member directory', 'Access bazar data'] : ['মিল লগ এডিট করা', 'গেস্ট মিল নিয়ন্ত্রণ', 'মিল ট্র্যাকার মনিটর', 'সদস্য তালিকা দেখা', 'বাজার ডেটা দেখা'],
    },
    {
      icon: Users, badge: 'Border Member', color: 'text-rose-600 dark:text-rose-400',
      desc: isEn ? 'General boarder. Self-manages meals, deposits, and personal settlement — full transparency over own data.' : 'সাধারণ মেস সদস্য। নিজের মিল, জমা ও ব্যালেন্স নিজেই ট্র্যাক করেন।',
      perms: isEn ? ['Toggle own meal slots', 'Book guest meals (max 2)', 'View personal passbook', 'Check personal balance', 'Request joining a mess'] : ['নিজের মিল টগল', 'গেস্ট মিল রিকোয়েস্ট', 'পাসবুক দেখা', 'নিজের ব্যালেন্স দেখা', 'মেসে যোগ দেওয়া'],
    },
  ];

  const compareRows = isEn ? [
    ['Automatic meal rate calculation', true, false, false, true],
    ['Previous day meal carry-forward', true, false, false, false],
    ['Guest meal tracking (max 2/slot)', true, false, false, false],
    ['Manager deposit approval queue', true, false, false, false],
    ['Auto month-end settlement sheet', true, false, false, true],
    ['Real-time dashboard for all roles', true, false, false, true],
    ['Multi-mess management (one account)', true, false, false, false],
    ['Bilingual interface (EN + BN)', true, false, false, false],
    ['Kitchen plate count before bazar', true, false, false, false],
    ['100% free, no subscription', true, true, true, false],
  ] : [
    ['স্বয়ংক্রিয় মিল রেট হিসাব', true, false, false, true],
    ['পূর্ববর্তী মিল ক্যারি-ফরওয়ার্ড', true, false, false, false],
    ['গেস্ট মিল ট্র্যাকিং (২ পর্যন্ত)', true, false, false, false],
    ['ডিপোজিট অনুমোদন প্যানেল', true, false, false, false],
    ['স্বয়ংক্রিয় মাসিক সেটেলমেন্ট', true, false, false, true],
    ['সকল রোলের রিয়েল-টাইম ড্যাশবোর্ড', true, false, false, true],
    ['মাল্টি-মেস সাপোর্ট (একটি অ্যাকাউন্টে)', true, false, false, false],
    ['দ্বিভাষিক ইন্টারফেস (EN + BN)', true, false, false, false],
    ['বাজারের আগে রান্নাঘরের প্লেট কাউন্ট', true, false, false, false],
    ['১০০% বিনামূল্যে, কোনো সাবস্ক্রিপশন নেই', true, true, true, false],
  ];

  const whyReasons = [
    { icon: BadgeCheck, color: 'blue', title: isEn ? 'Purpose-Built for Mess' : 'মেসের জন্যই তৈরি', body: isEn ? 'Unlike generic expense apps, every screen, formula, and workflow is designed around the exact way mess finance and meals operate in Bangladesh.' : 'সাধারণ খরচের অ্যাপের বিপরীতে, প্রতিটি স্ক্রিন, সূত্র ও ওয়ার্কফ্লো বাংলাদেশের মেস অপারেশনকে কেন্দ্র করে ডিজাইন করা হয়েছে।' },
    { icon: Zap, color: 'amber', title: isEn ? 'Zero Manual Arithmetic' : 'শূন্য ম্যানুয়াল হিসাব', body: isEn ? 'Meal rate, individual cost, advance, due amount — all computed instantly by the engine. No Excel, no calculator, no paper.' : 'মিল রেট, ব্যক্তিগত খরচ, অগ্রিম, বকেয়া — সবকিছু ইঞ্জিন তাৎক্ষণিকভাবে হিসাব করে। কোনো Excel বা ক্যালকুলেটর দরকার নেই।' },
    { icon: Clock, color: 'teal', title: isEn ? 'Carry-Forward Logic' : 'ক্যারি-ফরওয়ার্ড লজিক', body: isEn ? "Only tomorrow's date is pre-filled based on today. Historical records stay untouched — no accidental overwrites, ever." : 'শুধুমাত্র আগামীকালের তারিখ আজকের উপর ভিত্তি করে প্রি-ফিল হয়। ঐতিহাসিক রেকর্ড অক্ষুণ্ণ থাকে।' },
    { icon: ShieldCheck, color: 'emerald', title: isEn ? 'Financial Transparency' : 'আর্থিক স্বচ্ছতা', body: isEn ? 'Every taka of bazar expense and every deposit is permanently logged, timestamped, and visible to the right roles — no hidden manipulation.' : 'বাজারের প্রতিটি টাকা ও জমা স্থায়ীভাবে লগ করা হয় এবং সঠিক রোলের কাছে দৃশ্যমান।' },
    { icon: Star, color: 'rose', title: isEn ? 'Guest Meal Fairness' : 'গেস্ট মিলের ন্যায্যতা', body: isEn ? 'Guest meals are capped at 2 per slot and added to the shared meal count, so the guest cost is automatically split proportionally — no unfair charges.' : 'গেস্ট মিল প্রতি বেলায় সর্বোচ্চ ২টি — এবং মোট মিলে যোগ হয়, তাই খরচ সমানুপাতিকভাবে ভাগ হয়।' },
    { icon: Rocket, color: 'purple', title: isEn ? 'Multi-Mess Scalability' : 'মাল্টি-মেস স্কেলেবিলিটি', body: isEn ? 'One account can manage multiple messes simultaneously. Ideal for hostel managers overseeing multiple floors, blocks, or properties.' : 'একটি অ্যাকাউন্টে একাধিক মেস পরিচালনা করুন। হোস্টেলের একাধিক ফ্লোর বা ব্লক পরিচালনার জন্য আদর্শ।' },
    { icon: HeartHandshake, color: 'indigo', title: isEn ? 'Made in Bangladesh, For Bangladesh' : 'বাংলাদেশে তৈরি, বাংলাদেশের জন্য', body: isEn ? 'Built understanding local mess culture, Bengali language, and the exact payment methods (bKash, Nagad, Rocket) boarders use daily.' : 'স্থানীয় মেস সংস্কৃতি, বাংলা ভাষা ও বোর্ডারদের দৈনন্দিন পেমেন্ট পদ্ধতি (বিকাশ, নগদ, রকেট) বুঝে তৈরি।' },
  ];

  const faqs = [
    { q: isEn ? 'How is the meal rate calculated?' : 'মিল রেট কীভাবে হিসাব করা হয়?', a: isEn ? 'Meal Rate = Total Monthly Bazar Cost ÷ Total Meals consumed by all members. Every border pays proportionally for exactly what they ate.' : 'মিল রেট = মোট মাসিক বাজার খরচ ÷ সবার মোট মিল। প্রতিটি সদস্য ঠিক যতটুকু খেয়েছেন সেই অনুপাতে ভুগ করেন।' },
    { q: isEn ? "What if I forget to update tomorrow's meal?" : 'আগামীকালের মিল আপডেট না করলে কী হয়?', a: isEn ? "The system automatically carries forward today's meal configuration to tomorrow as a default — preventing food shortfall and kitchen waste." : 'সিস্টেম স্বয়ংক্রিয়ভাবে আজকের মিল সেটিং আগামীকালের জন্য কপি করে নেয় — খাবার অপচয় ঠেকাতে।' },
    { q: isEn ? 'How do guest meals work?' : 'গেস্ট মিল কীভাবে কাজ করে?', a: isEn ? 'Each border can add up to 2 guest meals per slot using the +/− counter. Guest meals are counted in the total meal tally, so cost is shared fairly.' : 'প্রতি বেলায় সর্বোচ্চ ২টি গেস্ট মিল যোগ করা যায়। গেস্ট মিল মোট মিলে যোগ হয়, তাই খরচ সমানভাবে ভাগ হয়।' },
    { q: isEn ? 'How are deposits recorded?' : 'ডিপোজিট কীভাবে রেকর্ড হয়?', a: isEn ? "Managers log deposits on behalf of members (Cash, bKash, Nagad, Rocket). The entry appears instantly in the member's passbook and updates their running balance." : 'ম্যানেজার সদস্যের পক্ষে জমা লগ করেন। এন্ট্রি তাৎক্ষণিকভাবে পাসবুকে যুক্ত হয় এবং ব্যালেন্স আপডেট হয়।' },
    { q: isEn ? 'How is the month-end settlement calculated?' : 'মাস শেষে হিসাব কীভাবে করা হয়?', a: isEn ? 'Final Balance = Total Deposits − (Total Meals × Meal Rate). Positive = advance credit, Negative = amount owed. Auto-generated at any time.' : 'চূড়ান্ত ব্যালেন্স = মোট জমা − (মোট মিল × মিল রেট)। ইতিবাচক = অগ্রিম, নেতিবাচক = বকেয়া।' },
    { q: isEn ? 'Can a user manage multiple messes?' : 'একাধিক মেস পরিচালনা করা যাবে?', a: isEn ? 'Yes. One account can be linked to multiple messes. Switch between them seamlessly — ideal for managers overseeing multiple floors or blocks.' : 'হ্যাঁ। একটি অ্যাকাউন্ট একাধিক মেসের সাথে লিঙ্ক করা যায়। সহজেই এক মেস থেকে আরেক মেসে স্যুইচ করুন।' },
    { q: isEn ? 'Is there a subscription or payment required?' : 'কোনো সাবস্ক্রিপশন বা পেমেন্ট লাগবে?', a: isEn ? 'No. NL Mess Pro is 100% free to use. Sign in with your Google account and start managing your mess immediately — no credit card, no fees.' : 'না। এনএল মেস প্রো সম্পূর্ণ বিনামূল্যে। গুগল অ্যাকাউন্টে সাইন ইন করুন এবং তাৎক্ষণিক ব্যবহার শুরু করুন।' },
  ];

  /* ─── Render ─── */
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white/75 dark:bg-[#0b0f19]/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoIcon size={32} />
            <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white font-display">
              NL Mess <span className="text-blue-600 dark:text-blue-500">Pro</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
              <Globe className="w-4 h-4" /><span>{language === 'en' ? 'বাং' : 'EN'}</span>
            </button>
            <button onClick={toggleTheme} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-500 cursor-pointer">
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
            {user
              ? <button onClick={() => navigate('/dashboard')} className="bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md cursor-pointer">{t.goToDash}</button>
              : <button onClick={() => navigate('/login')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/10 cursor-pointer">{t.getStarted}</button>}
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-28 lg:pb-32 border-b border-slate-200/50 dark:border-slate-800/40">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-7">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40">
            <Sparkles className="w-3.5 h-3.5" />{isEn ? 'Next-Gen Mess ERP System · by Nanolez Tech' : 'স্মার্ট মেস ম্যানেজমেন্ট · নানোলেজ টেক'}
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white font-display max-w-4xl mx-auto leading-tight">{t.hero}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-semibold">{t.heroSub}</p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            {user
              ? <button onClick={() => navigate('/dashboard')} className="w-full sm:w-auto px-8 py-4 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-bold rounded-2xl transition shadow-lg cursor-pointer flex items-center justify-center gap-2">{t.goToDash} <ArrowRight className="w-4 h-4" /></button>
              : <>
                  <button onClick={() => navigate('/login')} className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition shadow-lg shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2">{t.getStarted} <ArrowRight className="w-4 h-4" /></button>
                  <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition">{t.exploreFeatures}</button>
                </>}
          </div>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-bold text-slate-400 dark:text-slate-500">
            {[t.trustFree, t.trustGoogle, t.trustBilingual, t.trustRealtime].map((s, i) => (
              <span key={i} className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" />{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── SIMULATOR ── */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 space-y-2">
          <Chip color="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/40" text={isEn ? 'Live Calculator' : 'লাইভ ক্যালকুলেটর'} />
          <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight">{t.calcHeading}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold max-w-lg mx-auto">{t.calcSub}</p>
        </div>
        <div className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-5">
            {[
              { label: `${t.bazarLabel} — ${bazarCost.toLocaleString()} ৳`, min: 500, max: 20000, step: 100, val: bazarCost, set: setBazarCost },
              { label: `${t.totalMealsLabel} — ${totalMeals}`, min: 20, max: 600, step: 5, val: totalMeals, set: setTotalMeals },
            ].map(({ label, min, max, step, val, set }, i) => (
              <div key={i}>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</label>
                <input type="range" min={min} max={max} step={step} value={val} onChange={e => set(+e.target.value)} className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: t.myMealsLabel, val: userMeals, set: (v: number) => setUserMeals(Math.min(totalMeals, v)) },
                { label: t.myDepositLabel, val: userDeposit, set: setUserDeposit },
              ].map(({ label, val, set }, i) => (
                <div key={i}>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</label>
                  <input type="number" value={val} onChange={e => set(+(e.target.value) || 0)} className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.calcOutput}</h3>
            <div className="divide-y divide-slate-200/60 dark:divide-slate-800">
              <div className="py-3 flex justify-between items-center text-sm"><span className="text-slate-500 dark:text-slate-400 font-medium">{t.mealRate}</span><span className="font-mono font-bold text-slate-800 dark:text-slate-200">{mealRate.toFixed(3)} ৳</span></div>
              <div className="py-3 flex justify-between items-center text-sm"><span className="text-slate-500 dark:text-slate-400 font-medium">{t.mealCost}</span><span className="font-mono font-black text-slate-900 dark:text-slate-100">{userCost.toFixed(2)} ৳</span></div>
              <div className="py-3 flex justify-between items-baseline text-sm">
                <span className="text-slate-500 dark:text-slate-400 font-medium">{t.balance}</span>
                <div className="text-right">
                  <div className={`font-mono font-black text-lg ${userBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{userBalance >= 0 ? '+' : ''}{userBalance.toFixed(2)} ৳</div>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${userBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{userBalance >= 0 ? t.advance : t.due}</div>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic font-medium">{t.formula}</p>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-16 bg-slate-100/50 dark:bg-slate-900/20 border-t border-b border-slate-200/60 dark:border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <Chip color="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/40" text={isEn ? 'Core Features' : 'মূল ফিচারসমূহ'} />
            <h2 className="text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">{t.featuresHeading}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto font-semibold">{t.featuresSub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, color, title, body }, i) => (
              <div key={i} className="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl space-y-3 shadow-xs hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${iconColor(color)}`}><Icon className="w-5 h-5" /></div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">{title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORKFLOWS ── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        <div className="text-center space-y-3">
          <Chip color="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-900/40" text={isEn ? 'Daily Workflows' : 'ব্যবহারকারী অভিজ্ঞতা'} />
          <h2 className="text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">{t.workflowHeading}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto font-semibold">{t.workflowSub}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Member */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-blue-600/20">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:20px_20px]" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center border border-white/20"><Users className="w-6 h-6" /></div>
                <div><h3 className="text-xl font-black font-display">{t.asMember}</h3><p className="text-blue-200 text-xs font-semibold">{t.memberSub}</p></div>
              </div>
              <ul className="space-y-4">
                {memberSteps.map(([title, desc], i) => (
                  <li key={i} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 border border-white/20">{i + 1}</div>
                    <div><div className="font-bold text-sm">{title}</div><div className="text-blue-200 text-xs leading-relaxed font-semibold mt-0.5">{desc}</div></div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* Manager */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/30 border border-slate-700">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:20px_20px]" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/15"><ShieldAlert className="w-6 h-6 text-blue-400" /></div>
                <div><h3 className="text-xl font-black font-display">{t.asManager}</h3><p className="text-slate-400 text-xs font-semibold">{t.managerSub}</p></div>
              </div>
              <ul className="space-y-4">
                {managerSteps.map(([title, desc], i) => (
                  <li key={i} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600/30 flex items-center justify-center text-[10px] font-black text-blue-400 shrink-0 mt-0.5 border border-blue-500/30">{i + 1}</div>
                    <div><div className="font-bold text-sm">{title}</div><div className="text-slate-400 text-xs leading-relaxed font-semibold mt-0.5">{desc}</div></div>
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
            <Chip color="bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200/60 dark:border-purple-900/40" text={isEn ? 'Access Control' : 'অ্যাক্সেস কন্ট্রোল'} />
            <h2 className="text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">{t.rolesHeading}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto font-semibold">{t.rolesSub}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {roles.map(({ icon: Icon, badge, color, desc, perms }, i) => (
              <div key={i} className="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs">
                <div className={`flex items-center gap-2 font-black text-sm uppercase tracking-wider font-sans ${color}`}><Icon className="w-4 h-4" />{badge}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">{desc}</p>
                <ul className="space-y-1.5">
                  {perms.map((p, j) => <li key={j} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-350 font-semibold"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />{p}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <Chip color="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40" text={isEn ? 'Why NL Mess Pro' : 'কেন এনএল মেস প্রো'} />
          <h2 className="text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">{t.whyHeading}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto font-semibold">{t.whySub}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {whyReasons.map(({ icon: Icon, color, title, body }, i) => (
            <div key={i} className="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-xs hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${iconColor(color)}`}><Icon className="w-5 h-5" /></div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">{title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section className="py-16 bg-slate-100/50 dark:bg-slate-900/20 border-t border-b border-slate-200/60 dark:border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <Chip color="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/40" text={isEn ? 'Competitive Analysis' : 'প্রতিযোগিতামূলক তুলনা'} />
            <h2 className="text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">{t.compareHeading}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto font-semibold">{t.compareSub}</p>
          </div>
          <div className="overflow-x-auto rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/30 shadow-sm">
            <table className="w-full text-left border-collapse text-xs min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800">
                  <th className="px-5 py-4 font-bold text-slate-700 dark:text-slate-300 w-[38%]">{isEn ? 'Feature' : 'ফিচার'}</th>
                  <th className="px-5 py-4 font-black text-blue-600 dark:text-blue-400 bg-blue-500/5">NL Mess Pro</th>
                  <th className="px-5 py-4 font-semibold text-slate-500 dark:text-slate-400">{isEn ? 'Paper Diary' : 'খাতা'}</th>
                  <th className="px-5 py-4 font-semibold text-slate-500 dark:text-slate-400">{isEn ? 'WhatsApp' : 'হোয়াটসঅ্যাপ'}</th>
                  <th className="px-5 py-4 font-semibold text-slate-500 dark:text-slate-400">{isEn ? 'Other Apps' : 'অন্যান্য অ্যাপ'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800 font-semibold text-slate-500 dark:text-slate-400">
                {compareRows.map(([label, ...vals], i) => (
                  <tr key={i}>
                    <td className="px-5 py-3.5 text-slate-900 dark:text-white font-bold text-[11px]">{label as string}</td>
                    {(vals as boolean[]).map((v, j) => (
                      <td key={j} className={`px-5 py-3.5 ${j === 0 ? 'bg-blue-500/5' : ''}`}>
                        {v ? <Check className={`w-4 h-4 ${j === 0 ? 'text-emerald-500 stroke-[3]' : 'text-emerald-400'}`} /> : <XIcon className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── CREATOR ── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <Chip color="bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/40" text={isEn ? 'The Creator' : 'নির্মাতা'} />
          <h2 className="text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">{t.creatorHeading}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">{t.creatorSub}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Creator card */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 space-y-6 shadow-xs">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-4xl font-black text-white shadow-lg shadow-blue-500/20 shrink-0">N</div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white font-display">Nabid Ahamed</h3>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">{isEn ? 'Full-Stack Developer & Designer' : 'ফুল-স্ট্যাক ডেভেলপার ও ডিজাইনার'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">{isEn ? 'Founder, Nanolez Tech' : 'প্রতিষ্ঠাতা, নানোলেজ টেক'}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
              {isEn
                ? 'Nabid is a passionate software engineer who built NL Mess Pro from the ground up, solving the real-world problem of transparent and efficient mess management for university students in Bangladesh. He combines product thinking, clean code, and premium UI/UX to deliver tools that actually work.'
                : 'নাবিদ একজন উৎসাহী সফটওয়্যার ইঞ্জিনিয়ার যিনি বাংলাদেশের বিশ্ববিদ্যালয় শিক্ষার্থীদের মেস ব্যবস্থাপনার বাস্তব সমস্যা সমাধানে এনএল মেস প্রো তৈরি করেছেন। পণ্য চিন্তা, পরিষ্কার কোড ও প্রিমিয়াম UI/UX একত্রিত করে তিনি সত্যিকারের কার্যকর টুলস তৈরি করেন।'}
            </p>
            <div className="grid grid-cols-1 gap-2 pt-2">
              {[
                { icon: Mail, label: 'nabidahamed2003@gmail.com', href: 'mailto:nabidahamed2003@gmail.com' },
                { icon: Github, label: 'github.com/NabidAhammed', href: 'https://github.com/NabidAhammed' },
                { icon: Linkedin, label: 'linkedin.com/in/nalimon005', href: 'https://linkedin.com/in/nalimon005' },
              ].map(({ icon: Icon, label, href }, i) => (
                <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800/60">
                  <Icon className="w-4 h-4 text-blue-500 shrink-0" />{label}
                </a>
              ))}
            </div>
          </div>
          {/* Skills / contribution list */}
          <div className="space-y-5">
            <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">{isEn ? 'What He Built' : 'তিনি যা তৈরি করেছেন'}</h3>
            <ul className="space-y-3">
              {(isEn ? [
                ['Full-Stack Architecture', 'React + TypeScript frontend with Google Cloud Firestore backend and Firebase Auth.'],
                ['Mathematical Engine', 'Meal rate, per-member cost, and balance computation engine — accurate to 4 decimal places.'],
                ['Bilingual Interface', 'Complete EN/BN translation system with dynamic language switching throughout the app.'],
                ['Multi-Role Security System', 'Four-tier access control ensuring each role sees and modifies only what they should.'],
                ['Carry-Forward Logic', 'Smart date-aware meal inheritance that prevents food waste without overwriting history.'],
                ['Premium UI/UX Design', 'Every screen designed from scratch: glassmorphism, dark mode, micro-animations, mobile-first.'],
              ] : [
                ['ফুল-স্ট্যাক আর্কিটেকচার', 'React + TypeScript ফ্রন্টএন্ড ও Google Cloud Firestore ব্যাকএন্ড।'],
                ['গাণিতিক ইঞ্জিন', 'মিল রেট, ব্যক্তিগত খরচ ও ব্যালেন্স হিসাব — ৪ দশমিক স্থান পর্যন্ত নির্ভুল।'],
                ['দ্বিভাষিক ইন্টারফেস', 'সম্পূর্ণ EN/BN অনুবাদ সিস্টেম।'],
                ['মাল্টি-রোল নিরাপত্তা', 'চারটি স্তরের অ্যাক্সেস কন্ট্রোল।'],
                ['ক্যারি-ফরওয়ার্ড লজিক', 'তারিখ-সচেতন মিল উত্তরাধিকার যা ইতিহাস অক্ষুণ্ণ রাখে।'],
                ['প্রিমিয়াম UI/UX ডিজাইন', 'গ্লাসমর্ফিজম, ডার্ক মোড, মাইক্রো-অ্যানিমেশন সহ সম্পূর্ণ ডিজাইন।'],
              ]).map(([title, desc], i) => (
                <li key={i} className="flex gap-3 text-xs">
                  <div className="w-6 h-6 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center border border-blue-100 dark:border-blue-900/40 shrink-0 mt-0.5"><Code2 className="w-3.5 h-3.5" /></div>
                  <div><div className="font-bold text-slate-900 dark:text-white">{title}</div><div className="text-slate-500 dark:text-slate-400 leading-relaxed font-semibold mt-0.5">{desc}</div></div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── COMPANY ── */}
      <section className="py-16 bg-slate-100/50 dark:bg-slate-900/20 border-t border-b border-slate-200/60 dark:border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <Chip color="bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 border-teal-200/60 dark:border-teal-900/40" text={isEn ? 'The Company' : 'প্রতিষ্ঠান'} />
            <h2 className="text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">{t.companyHeading}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">{t.companySub}</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 space-y-5 shadow-xs">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white font-display">Nanolez Tech</h3>
                  <p className="text-xs text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider mt-1">{isEn ? 'Technology Studio · Bangladesh' : 'প্রযুক্তি স্টুডিও · বাংলাদেশ'}</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                {isEn
                  ? 'Nanolez Tech is a technology studio focused on building practical, scalable digital solutions for everyday problems faced by people in Bangladesh. The studio specializes in product design, full-stack web development, and purpose-built SaaS platforms — with NL Mess Pro as the flagship application.'
                  : 'নানোলেজ টেক একটি প্রযুক্তি স্টুডিও যা বাংলাদেশের মানুষের দৈনন্দিন সমস্যার জন্য ব্যবহারিক ও স্কেলেবল ডিজিটাল সমাধান তৈরিতে মনোযোগী। স্টুডিওটি পণ্য ডিজাইন, ফুল-স্ট্যাক ওয়েব ডেভেলপমেন্ট ও উদ্দেশ্যমূলক SaaS প্ল্যাটফর্মে বিশেষজ্ঞ।'}
              </p>
              <div className="grid grid-cols-3 gap-3 pt-2">
                {(isEn ? [
                  ['Product Design', 'Research-backed UI/UX'],
                  ['Full-Stack Dev', 'React, Firebase, Cloud'],
                  ['SaaS Platforms', 'Scalable multi-tenant apps'],
                ] : [
                  ['পণ্য ডিজাইন', 'গবেষণা ভিত্তিক UI/UX'],
                  ['ফুল-স্ট্যাক', 'React, Firebase, Cloud'],
                  ['SaaS প্ল্যাটফর্ম', 'স্কেলেবল মাল্টি-টেন্যান্ট অ্যাপ'],
                ]).map(([title, sub], i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 text-center">
                    <div className="text-xs font-black text-slate-900 dark:text-white">{title}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{sub}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">{isEn ? 'Our Core Values' : 'আমাদের মূল মূল্যবোধ'}</h3>
              {(isEn ? [
                { icon: HeartHandshake, color: 'teal', title: 'User-First Design', body: "Every feature starts with a real problem users face. We don't build what sounds impressive — we build what works." },
                { icon: ShieldCheck, color: 'emerald', title: 'Radical Transparency', body: 'Financial tools must be honest. Every calculation, every taka is trackable, auditable, and fully visible to the right people.' },
                { icon: Rocket, color: 'indigo', title: 'Continuous Improvement', body: 'NL Mess Pro is actively developed. Feedback from messes across Bangladesh directly shapes every update and feature.' },
                { icon: Code2, color: 'blue', title: 'Craftsmanship in Code', body: 'Clean architecture, precise type safety, and thoughtful design patterns — software that scales and maintainability that lasts.' },
              ] : [
                { icon: HeartHandshake, color: 'teal', title: 'ব্যবহারকারী-প্রথম ডিজাইন', body: 'প্রতিটি ফিচার বাস্তব সমস্যা থেকে শুরু হয়। আমরা যা চমৎকার শোনায় তা নয়, যা কাজ করে তা তৈরি করি।' },
                { icon: ShieldCheck, color: 'emerald', title: 'সম্পূর্ণ স্বচ্ছতা', body: 'আর্থিক টুলস সৎ হতে হয়। প্রতিটি হিসাব, প্রতিটি টাকা ট্র্যাকযোগ্য ও অডিটযোগ্য।' },
                { icon: Rocket, color: 'indigo', title: 'অবিরাম উন্নয়ন', body: 'এনএল মেস প্রো সক্রিয়ভাবে ডেভেলপ করা হচ্ছে। বাংলাদেশের মেসগুলোর ফিডব্যাক প্রতিটি আপডেট গঠন করে।' },
                { icon: Code2, color: 'blue', title: 'কোডে কারুকার্য', body: 'পরিষ্কার আর্কিটেকচার, নির্ভুল টাইপ সেফটি ও চিন্তাশীল ডিজাইন প্যাটার্ন।' },
              ]).map(({ icon: Icon, color, title, body }, i) => (
                <div key={i} className="flex gap-4 bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${iconColor(color)}`}><Icon className="w-4 h-4" /></div>
                  <div><div className="text-sm font-bold text-slate-900 dark:text-white">{title}</div><div className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed mt-0.5">{body}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight text-center">{t.faqHeading}</h2>
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
      </section>

      {/* ── CTA ── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-indigo-900 rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-blue-600/20">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="relative space-y-5">
            <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight">{t.ctaHeading}</h2>
            <p className="text-blue-200 text-sm sm:text-base max-w-xl mx-auto font-semibold leading-relaxed">{t.ctaSub}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              {user
                ? <button onClick={() => navigate('/dashboard')} className="px-8 py-4 bg-white text-indigo-900 font-black rounded-2xl hover:bg-blue-50 shadow-lg cursor-pointer transition flex items-center justify-center gap-2">{t.goToDash} <ArrowRight className="w-4 h-4" /></button>
                : <button onClick={() => navigate('/login')} className="px-8 py-4 bg-white text-indigo-900 font-black rounded-2xl hover:bg-blue-50 shadow-lg cursor-pointer transition flex items-center justify-center gap-2">{t.getStarted} <ArrowRight className="w-4 h-4" /></button>}
            </div>
          </div>
        </div>
      </section>

      {/* ── AI / CRAWLER ── */}
      <section className="py-16 bg-slate-950 text-slate-400 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center gap-2 text-white"><Brain className="w-5 h-5 text-blue-400" /><h2 className="text-xl font-bold font-display">{t.aiHeading}</h2></div>
          <p className="text-xs leading-relaxed max-w-3xl">{t.aiDesc}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-[11px] font-mono">
            {[
              { title: 'System Architecture', items: ['Backend: Google Cloud Firestore (NoSQL)', 'Auth: Firebase Authentication (Google OAuth)', 'Frontend: React 18 + TypeScript + Vite', 'Styling: Tailwind CSS + Motion/React', 'Meal Rate: Total Bazar Cost / Total Meals', 'Balance: Sum(Deposits) - (Meals × Meal Rate)'] },
              { title: 'Business Rules', items: ['Morning slot = 0.5 meal, Lunch = 1.0, Dinner = 1.0', 'Guest meal cap: max 2 per slot per border', 'Carry-forward: tomorrow only, not history', 'Roles: Supreme Admin > Mess Manager > Meal Manager > Border', 'Deposit methods: Cash, bKash, Nagad, Rocket, Bank', 'Languages: English (EN) and Bengali (বাংলা)'] },
              { title: 'Company & Creator', items: ['Product: NL Mess Pro', 'Company: Nanolez Tech', 'Creator: Nabid Ahamed', 'Email: nabidahamed2003@gmail.com', 'GitHub: github.com/NabidAhammed', 'LinkedIn: linkedin.com/in/nalimon005'] },
            ].map(({ title, items }, i) => (
              <div key={i} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
                <h3 className="text-white font-bold font-sans text-xs mb-3">{title}</h3>
                <ul className="space-y-1.5 text-slate-400 list-disc list-inside">{items.map((item, j) => <li key={j}>{item}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-950 border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-2.5">
            <LogoIcon size={22} />
            <div>
              <span className="text-slate-300 font-bold">NL Mess Pro</span> — {isEn ? 'by' : 'নির্মাতা:'} <span className="text-blue-400 font-bold">Nabid Ahamed</span> · <span className="text-teal-400 font-bold">Nanolez Tech</span>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <a href="mailto:nabidahamed2003@gmail.com" className="hover:text-slate-300 transition flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />Contact</a>
            <a href="https://github.com/NabidAhammed" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition flex items-center gap-1.5"><Github className="w-3.5 h-3.5" />GitHub</a>
            <a href="https://linkedin.com/in/nalimon005" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition flex items-center gap-1.5"><Linkedin className="w-3.5 h-3.5" />LinkedIn</a>
            <span>&copy; {new Date().getFullYear()} {t.rights}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
