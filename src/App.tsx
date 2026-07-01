/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { MonthProvider } from './contexts/MonthContext';
import { AppLayout } from './components/layout/AppLayout';
import { AppLoadingScreen } from './components/AppLoadingScreen';

import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import Members from './pages/Members';
import Meals from './pages/Meals';
import Deposits from './pages/Deposits';
import Bazar from './pages/Bazar';
import Settlement from './pages/Settlement';
import About from './pages/About';
import AuthorityPanel from './pages/AuthorityPanel';
import TomorrowMeal from './pages/TomorrowMeal';
import Profile from './pages/Profile';
import ManagerPanel from './pages/ManagerPanel';
import Approvals from './pages/Approvals';
import { useLanguage } from './contexts/LanguageContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading, logout, isSupreme, hasEntered, setHasEntered } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const location = useLocation();
  
  if (loading) return <AppLoadingScreen />;
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (location.pathname === '/onboarding') {
    return <>{children}</>;
  }
  
  // If no mess is selected yet, or hasEntered is false, redirect to onboarding
  if ((!userProfile?.messId || !hasEntered) && !isSupreme && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Supreme user bypasses most checks
  if (isSupreme) {
    return <AppLayout>{children}</AppLayout>;
  }

  // If Border is pending, show pending screen
  if (userProfile?.role === 'Border' && userProfile.status === 'Pending') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-55 dark:bg-[#0b0f19] font-sans text-center px-4 relative transition-colors duration-200">
        
        {/* Glowing backdrop elements for premium dark mode */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Language Switcher */}
        <div className="absolute top-4 right-4 flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full p-1 shadow-xs z-50">
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
              language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-655 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('bn')}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
              language === 'bn' ? 'bg-blue-600 text-white' : 'text-slate-655 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            বাঙলা
          </button>
        </div>

        <div className="max-w-md w-full bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/25 text-3xl font-extrabold animate-pulse">!</div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('nav.pending')}</h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm font-semibold leading-relaxed">{t('nav.waiting_explanation')}</p>
          
          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={() => {
                setHasEntered(false);
              }}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition cursor-pointer flex items-center justify-center shadow-md shadow-blue-500/10 active:scale-98"
            >
              {language === 'bn' ? 'মেস পরিবর্তন করুন / অন্য মেসে যোগ দিন' : 'Switch Mess / Join Another'}
            </button>
            
            <button
              onClick={() => logout()}
              className="w-full py-3 border border-slate-250 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold rounded-xl text-slate-600 dark:text-slate-300 transition cursor-pointer flex items-center justify-center"
            >
              {t('nav.sign_out')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}

// Smart root component declared globally to prevent reconciliation issues/unmounting
function SmartRoot() {
  const { user, loading } = useAuth();
  if (loading) return <AppLoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

function RoutesConfig() {
  const { user, userProfile } = useAuth();


  return (
    <Routes>
      <Route path="/login" element={(user || userProfile) ? <Navigate to="/dashboard" replace /> : <Login />} />
      
      {/* Smart Landing Page: loader → redirect to dashboard if logged in, else show page */}
      <Route path="/" element={<SmartRoot />} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
      <Route path="/members" element={<PrivateRoute><Members /></PrivateRoute>} />
      <Route path="/meals" element={<PrivateRoute><Meals /></PrivateRoute>} />
      <Route path="/tomorrow-meal" element={<PrivateRoute><TomorrowMeal /></PrivateRoute>} />
      <Route path="/deposits" element={<PrivateRoute><Deposits /></PrivateRoute>} />
      <Route path="/bazar" element={<PrivateRoute><Bazar /></PrivateRoute>} />
      <Route path="/settlement" element={<PrivateRoute><Settlement /></PrivateRoute>} />
      <Route path="/manager-panel" element={<PrivateRoute><ManagerPanel /></PrivateRoute>} />
      <Route path="/approvals" element={<PrivateRoute><Approvals /></PrivateRoute>} />
      <Route path="/about" element={<PrivateRoute><About /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/authority" element={<PrivateRoute><AuthorityPanel /></PrivateRoute>} />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
    </Routes>
  );
}

import { ThemeProvider } from './contexts/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MonthProvider>
            <Router>
              <RoutesConfig />
            </Router>
          </MonthProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}


