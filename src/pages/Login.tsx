import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRight, Building, Compass } from 'lucide-react';
import { LogoIcon } from '../components/Logo';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Mess, Member } from '../types';
import { auth } from '../lib/firebase';

export default function Login() {
  const { signInWithGoogle } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative">
      {/* Floating Language Switcher */}
      <div className="absolute top-4 right-4 flex bg-white border border-slate-200 rounded-full p-1 shadow-xs z-50">
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
            language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          English
        </button>
        <button
          onClick={() => setLanguage('bn')}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
            language === 'bn' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          বাঙলা
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center">
          <div className="h-20 w-20 flex items-center justify-center bg-white border border-slate-200/60 rounded-2xl shadow-sm p-3 mb-2 transform -rotate-2 hover:rotate-3 transition-transform duration-300">
            <LogoIcon size={56} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-slate-900 tracking-tight">
          {t('login.welcome')}
        </h2>
        <p className="mt-3 text-center text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
          {t('login.tagline')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-xl sm:px-10">
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-6 px-4">
              {language === 'bn' 
                ? 'আপনার গুগল অ্যাকাউন্ট ব্যবহার করে নিরাপদভাবে লগইন করুন।' 
                : 'Log in securely using your Google workspace account.'}
            </p>
            <button
              onClick={signInWithGoogle}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {t('login.google_btn')}
            </button>
            <p className="mt-6 text-[11px] text-slate-400 font-medium lowercase">
              {t('login.developed_by')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
