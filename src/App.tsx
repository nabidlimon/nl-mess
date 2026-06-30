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
import { useLanguage } from './contexts/LanguageContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading, logout, isSupreme, hasEntered } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const location = useLocation();
  
  if (loading) return <AppLoadingScreen />;
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If not entered and not at onboarding, redirect to onboarding
  if (!hasEntered && !isSupreme && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Supreme user bypasses most checks
  if (isSupreme) {
    return <AppLayout>{children}</AppLayout>;
  }

  // If Border is pending, show pending screen
  if (userProfile?.role === 'Border' && userProfile.status === 'Pending') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans text-center px-4 relative">
        {/* Floating Language Switcher */}
        <div className="absolute top-4 right-4 flex bg-white border border-slate-200 rounded-full p-1 shadow-xs z-50">
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
              language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('bn')}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
              language === 'bn' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            বাঙলা
          </button>
        </div>

        <div className="max-w-md w-full bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
          <div className="w-16 h-16 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold border border-yellow-100">!</div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t('nav.pending')}</h2>
          <p className="mt-3 text-slate-500 text-sm leading-relaxed">{t('nav.waiting_explanation')}</p>
          <button
            onClick={() => logout()}
            className="mt-6 inline-flex justify-center items-center py-2 px-4 border border-slate-200 hover:bg-slate-50 text-sm font-semibold rounded-xl text-slate-700 transition cursor-pointer"
          >
            {t('nav.sign_out')}
          </button>
        </div>
      </div>
    )
  }

  return <AppLayout>{children}</AppLayout>;
}

function RoutesConfig() {
  const { user, userProfile } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={(user || userProfile) ? <Navigate to="/" replace /> : <Login />} />
      
      {/* Protected Routes */}
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
      <Route path="/members" element={<PrivateRoute><Members /></PrivateRoute>} />
      <Route path="/meals" element={<PrivateRoute><Meals /></PrivateRoute>} />
      <Route path="/tomorrow-meal" element={<PrivateRoute><TomorrowMeal /></PrivateRoute>} />
      <Route path="/deposits" element={<PrivateRoute><Deposits /></PrivateRoute>} />
      <Route path="/bazar" element={<PrivateRoute><Bazar /></PrivateRoute>} />
      <Route path="/settlement" element={<PrivateRoute><Settlement /></PrivateRoute>} />
      <Route path="/manager-panel" element={<PrivateRoute><ManagerPanel /></PrivateRoute>} />
      <Route path="/about" element={<PrivateRoute><About /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/authority" element={<PrivateRoute><AuthorityPanel /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
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


