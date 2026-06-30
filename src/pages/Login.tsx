import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LogoIcon } from '../components/Logo';
import { motion } from 'motion/react';
import { ShieldCheck, Utensils, Wallet, Activity } from 'lucide-react';

export default function Login() {
  const { signInWithGoogle } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      
      {/* ── Background Glowing Orbs ── */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Floating Language Switcher */}
      <div className="absolute top-5 right-5 flex bg-white/5 backdrop-blur-md border border-white/10 rounded-full p-1 shadow-2xl z-50">
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
            language === 'en' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage('bn')}
          className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
            language === 'bn' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          বাং
        </button>
      </div>

      {/* Header and Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 260 }}
          className="flex justify-center"
        >
          <div className="h-20 w-20 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-3xl shadow-xl shadow-indigo-950/20 p-3.5 mb-1.5 transform hover:scale-105 hover:rotate-2 transition-all duration-300">
            <LogoIcon size={56} />
          </div>
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6 text-center text-3.5xl font-black text-white tracking-tight leading-none"
        >
          {t('login.welcome')}
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-3.5 text-center text-sm text-slate-400 max-w-sm mx-auto leading-relaxed font-medium"
        >
          {t('login.tagline')}
        </motion.p>
      </div>

      {/* Login Box and Features List */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 220, delay: 0.3 }}
          className="bg-slate-900/50 backdrop-blur-xl py-9 px-6 shadow-2xl border border-slate-800/80 sm:rounded-3xl sm:px-10"
        >
          <div className="text-center">
            <p className="text-sm text-slate-300 mb-6 px-2 font-medium">
              {language === 'bn' 
                ? 'আপনার গুগল অ্যাকাউন্ট ব্যবহার করে নিরাপদভাবে লগইন করুন।' 
                : 'Log in securely using your Google account to get started.'}
            </p>
            
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center py-3.5 px-4 border border-slate-800 hover:border-slate-700 rounded-2xl shadow-lg text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all cursor-pointer transform active:scale-98"
            >
              <svg className="w-5 h-5 mr-3 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              {t('login.google_btn')}
            </button>

            {/* Quick Benefits list */}
            <div className="mt-8 pt-7 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-left">
              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded-md bg-blue-500/10 text-blue-400 mt-0.5">
                  <Utensils className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-200 leading-tight">
                    {language === 'bn' ? 'মিল ট্র্যাকিং' : 'Meal Logs'}
                  </p>
                  <p className="text-[9px] text-slate-500 mt-0.5 leading-none">
                    {language === 'bn' ? 'সহজ দৈনিক হিসাব' : 'Daily automatic rates'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 mt-0.5">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-200 leading-tight">
                    {language === 'bn' ? 'জমা পোর্টাল' : 'Ledger Pool'}
                  </p>
                  <p className="text-[9px] text-slate-500 mt-0.5 leading-none">
                    {language === 'bn' ? 'বাজার বাজেট কন্ট্রোল' : 'Easy shared cash'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-400 mt-0.5">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-200 leading-tight">
                    {language === 'bn' ? 'রেন্টাল প্যানেল' : 'Rent Sheets'}
                  </p>
                  <p className="text-[9px] text-slate-500 mt-0.5 leading-none">
                    {language === 'bn' ? 'রুম ভাড়া বিবরণী' : 'Room vara summaries'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded-md bg-violet-500/10 text-violet-400 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-200 leading-tight">
                    {language === 'bn' ? 'সুরক্ষিত তথ্য' : 'Secure Admin'}
                  </p>
                  <p className="text-[9px] text-slate-500 mt-0.5 leading-none">
                    {language === 'bn' ? 'পাসওয়ার্ডলেস গুগল লগইন' : 'Verified onboarding'}
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-8 text-[11px] text-slate-500 font-medium tracking-wide">
              {t('login.developed_by')}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
