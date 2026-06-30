import { ReactNode, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useMonth } from '../../contexts/MonthContext';
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  Wallet,
  ShoppingBasket,
  BarChart3,
  LogOut,
  Shield,
  RefreshCcw,
  Info,
  User,
  ChevronLeft,
  ChevronRight,
  Globe,
  CalendarDays,
  Utensils,
  FileSpreadsheet,
  MoreHorizontal,
  X,
  ChevronRight as Arrow,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { LogoIcon } from '../Logo';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { ChatCenter } from '../notifications/ChatCenter';
import { motion, AnimatePresence } from 'motion/react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  show: boolean;
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, userProfile, currentMess, managedMesses, logout, isSupreme, setHasEntered } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { selectedMonth, setSelectedMonth } = useMonth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isMessManager = (currentMess?.managerIds || []).includes(userProfile?.id || '');
  const isAdmin = isMessManager || isSupreme || userProfile?.role === 'Manager' || userProfile?.role === 'MealManager';
  const isSupremeAuthority = isSupreme || userProfile?.email === 'nabidahamed2003@gmail.com';

  const navItems: NavItem[] = [
    { name: t('nav.dashboard'),                                        path: '/',              icon: LayoutDashboard,  show: true },
    { name: language === 'bn' ? 'সুপ্রীম প্যানেল' : 'Platform',      path: '/authority',     icon: Shield,           show: isSupremeAuthority },
    { name: language === 'bn' ? 'মেসসমূহ' : 'My Messes',             path: '/onboarding',    icon: RefreshCcw,       show: (userProfile?.messIds?.length || 0) > 1 || managedMesses.length > 1 },
    { name: t('nav.members'),                                          path: '/members',       icon: Users,            show: isAdmin },
    { name: t('nav.manager_panel'),                                    path: '/manager-panel', icon: FileSpreadsheet,  show: isAdmin },
    { name: t('nav.tomorrow_meal'),                                    path: '/tomorrow-meal', icon: Utensils,         show: true },
    { name: t('nav.meals'),                                            path: '/meals',         icon: UtensilsCrossed,  show: true },
    { name: t('nav.deposits'),                                         path: '/deposits',      icon: Wallet,           show: true },
    { name: t('nav.bazar'),                                            path: '/bazar',         icon: ShoppingBasket,   show: true },
    { name: t('nav.settlement'),                                       path: '/settlement',    icon: BarChart3,        show: true },
    { name: language === 'bn' ? 'প্রোফাইল' : 'Profile',              path: '/profile',       icon: User,             show: true },
    { name: t('nav.about'),                                            path: '/about',         icon: Info,             show: true },
  ];

  const visibleNavItems = navItems.filter(i => i.show);

  // Fixed 3 bottom tabs + "More"
  const pinned = [
    visibleNavItems.find(n => n.path === '/'),
    visibleNavItems.find(n => n.path === '/meals'),
    visibleNavItems.find(n => n.path === '/profile'),
  ].filter(Boolean) as NavItem[];

  // Everything else goes in "More"
  const pinnedPaths = new Set(pinned.map(n => n.path));
  const moreItems = visibleNavItems.filter(n => !pinnedPaths.has(n.path));

  // Is any "more" item currently active?
  const moreIsActive = moreItems.some(n =>
    n.path === '/' ? location.pathname === '/' : location.pathname.startsWith(n.path)
  );

  const userRole = isSupreme
    ? 'Supreme Admin'
    : userProfile?.role === 'Manager'
    ? (language === 'bn' ? 'ম্যানেজার' : 'Manager')
    : userProfile?.role === 'MealManager'
    ? (language === 'bn' ? 'মিল ম্যানেজার' : 'Meal Manager')
    : (language === 'bn' ? 'সদস্য' : 'Member');

  const userInitial = userProfile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="h-screen flex bg-slate-100 font-sans text-slate-900 antialiased overflow-hidden">

      {/* ─────────── DESKTOP SIDEBAR ─────────── */}
      <aside
        className={cn(
          'hidden md:flex flex-col h-full transition-all duration-300 ease-in-out z-40 relative',
          'bg-slate-950 border-r border-slate-800/50 shadow-2xl shadow-black/20',
          collapsed ? 'w-[68px]' : 'w-60'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center h-16 border-b border-slate-800/60 flex-shrink-0 overflow-hidden',
          collapsed ? 'justify-center px-0' : 'px-5 gap-3'
        )}>
          <div className="shrink-0"><LogoIcon size={28} /></div>
          {!collapsed && (
            <span className="text-white font-black text-lg tracking-tight font-display truncate">
              NL Mess <span className="text-blue-400">Pro</span>
            </span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <div className={cn('space-y-0.5', collapsed ? 'px-2' : 'px-3')}>
            {visibleNavItems.map((item) => {
              const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => item.path === '/onboarding' && setHasEntered(false)}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    'sidebar-nav-item relative group flex items-center gap-3 rounded-xl transition-all duration-150 cursor-pointer',
                    collapsed ? 'w-11 h-11 justify-center mx-auto' : 'px-3.5 py-2.5',
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                  )}
                >
                  <item.icon className={cn('shrink-0', collapsed ? 'w-5 h-5' : 'w-4.5 h-4.5')} />
                  {!collapsed && <span className="text-sm font-semibold truncate">{item.name}</span>}
                  {collapsed && <span className="sidebar-tooltip">{item.name}</span>}
                  {isActive && !collapsed && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* User + actions */}
        <div className={cn('border-t border-slate-800/60 flex-shrink-0', collapsed ? 'p-2' : 'p-3')}>
          <div
            onClick={() => navigate('/profile')}
            className={cn(
              'flex items-center rounded-xl cursor-pointer transition-all hover:bg-slate-800/80 mb-2',
              collapsed ? 'justify-center p-2.5' : 'gap-3 p-2.5'
            )}
            title={collapsed ? (userProfile?.name || 'Profile') : undefined}
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-lg object-cover shrink-0 ring-2 ring-blue-500/30" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-lg shadow-blue-600/20">
                {userInitial}
              </div>
            )}
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{userProfile?.name || user?.displayName || 'User'}</p>
                <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider truncate">{userRole}</p>
              </div>
            )}
          </div>
          <div className={cn('flex', collapsed ? 'flex-col gap-1.5 items-center' : 'gap-1.5')}>
            <button
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              className={cn(
                'sidebar-nav-item relative group flex items-center justify-center gap-2 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-slate-100 hover:bg-slate-800',
                collapsed ? 'w-11 h-9' : 'flex-1 h-9'
              )}
              title={language === 'en' ? 'Switch to Bangla' : 'Switch to English'}
            >
              <Globe className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="text-[11px] font-bold">{language === 'en' ? 'বাং' : 'EN'}</span>}
              {collapsed && <span className="sidebar-tooltip">{language === 'en' ? 'বাংলা' : 'English'}</span>}
            </button>
            <button
              onClick={handleLogout}
              className={cn(
                'sidebar-nav-item relative group flex items-center justify-center gap-2 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-red-400 hover:bg-red-950/30',
                collapsed ? 'w-11 h-9' : 'flex-1 h-9'
              )}
              title={t('nav.sign_out')}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="text-[11px] font-bold">{t('nav.sign_out')}</span>}
              {collapsed && <span className="sidebar-tooltip">{t('nav.sign_out')}</span>}
            </button>
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[72px] w-6 h-6 bg-slate-800 border border-slate-700 rounded-full hidden md:flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer shadow-md z-50"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>

      {/* ─────────── MAIN CONTENT AREA ─────────── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">

        {/* TOP BAR — desktop */}
        <header className="hidden md:flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200/70 shadow-sm flex-shrink-0 z-30">
          <div className="flex items-center gap-4">
            {currentMess && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" />
                <span className="text-sm font-bold text-slate-700 max-w-[180px] truncate">{currentMess.name}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-slate-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all cursor-pointer hover:border-slate-300"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
          </div>
        </header>

        {/* TOP BAR — mobile */}
        <header className="md:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-slate-200/70 shadow-sm flex-shrink-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/30">
              <LogoIcon size={18} />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight leading-none">
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">NL</span>
                  <span className="text-slate-800"> Mess</span>
                </span>
                <span className="text-[9px] font-black bg-gradient-to-r from-blue-600 to-indigo-500 text-white px-1.5 py-0.5 rounded-md tracking-widest uppercase leading-none">
                  PRO
                </span>
              </div>
              {currentMess && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  <p className="text-[10px] text-slate-400 font-semibold leading-none truncate max-w-[110px]">{currentMess.name}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
            />
            <NotificationCenter />
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 md:p-7 pb-24 md:pb-8">
          {children}
        </main>

        {/* ─────────── FLOATING CHAT BUTTON ─────────── */}
        {/* Mobile: sits above bottom nav (bottom-20), Desktop: bottom-6 right-6 */}
        <div className="fixed bottom-[88px] right-4 md:bottom-6 md:right-6 z-[90]">
          <ChatCenter />
        </div>

        {/* ─────────── MOBILE BOTTOM NAV ─────────── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <div className="bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-2xl shadow-slate-900/10">
            <div className="flex items-stretch justify-around px-1 py-1.5">

              {/* Pinned tabs */}
              {pinned.map((item) => {
                const isActive = item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className="flex flex-col items-center gap-1 px-3 py-1.5 flex-1"
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
                      isActive ? 'bg-blue-600 shadow-lg shadow-blue-600/30 scale-105' : ''
                    )}>
                      <item.icon className={cn('w-5 h-5 transition-colors', isActive ? 'text-white' : 'text-slate-400')} />
                    </div>
                    <span className={cn(
                      'text-[10px] font-semibold leading-none truncate max-w-[56px] text-center',
                      isActive ? 'text-blue-600' : 'text-slate-400'
                    )}>
                      {item.name}
                    </span>
                  </NavLink>
                );
              })}

              {/* More button */}
              <button
                onClick={() => setMoreOpen(true)}
                className="flex flex-col items-center gap-1 px-3 py-1.5 flex-1"
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
                  moreIsActive || moreOpen ? 'bg-indigo-50' : ''
                )}>
                  <MoreHorizontal className={cn('w-5 h-5 transition-colors', moreIsActive || moreOpen ? 'text-indigo-500' : 'text-slate-400')} />
                </div>
                <span className={cn(
                  'text-[10px] font-semibold leading-none',
                  moreIsActive || moreOpen ? 'text-indigo-500' : 'text-slate-400'
                )}>
                  {language === 'bn' ? 'আরো' : 'More'}
                </span>
              </button>
            </div>
          </div>
        </nav>

        {/* ─────────── MOBILE "MORE" SHEET ─────────── */}
        <AnimatePresence>
          {moreOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                key="more-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="md:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
                onClick={() => setMoreOpen(false)}
              />

              {/* Bottom sheet */}
              <motion.div
                key="more-sheet"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                className="md:hidden fixed inset-x-0 bottom-0 z-[70] bg-white rounded-t-3xl overflow-hidden shadow-2xl"
              >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1 cursor-pointer" onClick={() => setMoreOpen(false)}>
                  <div className="w-10 h-1 rounded-full bg-slate-200" />
                </div>

                {/* Sheet header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{language === 'bn' ? 'সব মেনু' : 'All Sections'}</h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">{language === 'bn' ? 'যেকোনো পেজে যান' : 'Navigate anywhere'}</p>
                  </div>
                  <button
                    onClick={() => setMoreOpen(false)}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* User card inside sheet */}
                <div
                  className="mx-4 mt-4 mb-3 flex items-center gap-3 p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl cursor-pointer shadow-lg shadow-blue-500/20"
                  onClick={() => { navigate('/profile'); setMoreOpen(false); }}
                >
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="User" className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/30" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-white text-base">
                      {userInitial}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{userProfile?.name || user?.displayName || 'User'}</p>
                    <p className="text-[11px] text-blue-200 font-medium uppercase tracking-wide">{userRole}</p>
                  </div>
                  <Arrow className="w-4 h-4 text-white/60" />
                </div>

                {/* Nav links grid */}
                <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                  {moreItems.map((item) => {
                    const isActive = item.path === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.path);
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => {
                          setMoreOpen(false);
                          if (item.path === '/onboarding') setHasEntered(false);
                        }}
                        className={cn(
                          'flex items-center gap-3 p-3.5 rounded-2xl transition-all',
                          isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                        )}
                      >
                        <div className={cn(
                          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                          isActive ? 'bg-white/20' : 'bg-white shadow-sm'
                        )}>
                          <item.icon className={cn('w-4.5 h-4.5', isActive ? 'text-white' : 'text-slate-500')} />
                        </div>
                        <span className={cn('text-sm font-semibold leading-tight truncate', isActive ? 'text-white' : 'text-slate-700')}>
                          {item.name}
                        </span>
                      </NavLink>
                    );
                  })}
                </div>

                {/* Bottom actions */}
                <div className="px-4 pb-6 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
                    className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors"
                  >
                    <Globe className="w-4.5 h-4.5 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-700">{language === 'en' ? 'বাংলা' : 'English'}</span>
                  </button>
                  <button
                    onClick={() => { handleLogout(); setMoreOpen(false); }}
                    className="flex items-center justify-center gap-2 p-3 bg-red-50 hover:bg-red-100 rounded-2xl transition-colors"
                  >
                    <LogOut className="w-4.5 h-4.5 text-red-500" />
                    <span className="text-sm font-semibold text-red-600">{t('nav.sign_out')}</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
