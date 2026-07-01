import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../lib/firebase';
import { doc, setDoc, updateDoc, collection, query, getDocs, where } from 'firebase/firestore';
import { Mess, UserProfile, Notification } from '../types';
import { LogOut, Home, Users, Plus, Search, CheckCircle, ArrowRight, ShieldCheck, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LogoIcon } from '../components/Logo';

export default function Onboarding() {
  const { user, userProfile, managedMesses, logout, refreshProfile, setHasEntered, hasEntered } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'selection' | 'register_mess' | 'join_mess' | 'manager_choice' | 'border_entry'>('selection');
  const [loading, setLoading] = useState(false);
  const [messes, setMesses] = useState<Mess[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form states
  const [messName, setMessName] = useState('');
  const [messEmail, setMessEmail] = useState('');
  const [messPhone, setMessPhone] = useState('');
  const [messCapacity, setMessCapacity] = useState('20');
  const [selectedMessId, setSelectedMessId] = useState('');
  const [institution, setInstitution] = useState('');
  const [userName, setUserName] = useState(user?.displayName || '');
  const [userPhone, setUserPhone] = useState('');

  const [switchingMess, setSwitchingMess] = useState(false);
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (hasEntered) {
      navigate('/');
      return;
    }

    // Determine initial step based on profile and managed messes
    if (userProfile) {
      if (managedMesses.length > 0) {
        setStep('manager_choice');
      } else if (userProfile.messId) {
        setStep('border_entry');
      } else {
        setStep('selection');
      }
    } else {
      setStep('selection');
    }
  }, [user, userProfile, navigate, managedMesses, hasEntered]);

  const handleSwitchAndEnter = async (messId: string) => {
    if (!userProfile?.id || switchingMess) return;
    try {
      setSwitchingMess(true);
      if (userProfile.messId !== messId) {
        // Update active messId in Firestore
        await updateDoc(doc(db, 'users', userProfile.id), { 
          messId: messId
        });
        await refreshProfile();
      }
      setHasEntered(true);
      navigate('/');
    } catch (err) {
      console.error("Error switching mess", err);
    } finally {
      setSwitchingMess(false);
    }
  };

  const fetchMesses = async () => {
    try {
      const q = query(collection(db, 'messes'));
      const snap = await getDocs(q);
      setMesses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mess)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateMess = async () => {
    if (!user || !messName || !messPhone) return;
    setLoading(true);
    try {
      const messRef = doc(collection(db, 'messes'));
      const newMess: Mess = {
        id: messRef.id,
        name: messName,
        managerIds: [user.uid],
        managerPhone: messPhone,
        email: messEmail || user.email || '',
        totalBorders: parseInt(messCapacity),
        location: { lat: 0, lng: 0, address: '' },
        photoUrl: '',
        createdAt: new Date().toISOString()
      };
      
      await setDoc(messRef, newMess);
      
      const existingMessIds = userProfile?.messIds || [];
      const newProfile: Partial<UserProfile> = {
        name: userName || user.displayName || 'Anonymous',
        email: user.email || '',
        role: 'Manager', // Upgrade them to manager if they created one
        phone: messPhone,
        messId: messRef.id,
        messIds: Array.from(new Set([...existingMessIds, messRef.id])),
        status: 'Active',
        isRegistered: true,
      };

      if (!userProfile) {
         (newProfile as any).id = user.uid;
         (newProfile as any).createdAt = new Date().toISOString();
         await setDoc(doc(db, 'users', user.uid), newProfile as UserProfile);
      } else {
         await updateDoc(doc(db, 'users', user.uid), newProfile);
      }
      
      await refreshProfile();
      setHasEntered(true);
      navigate('/');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMess = async () => {
    if (!user || !selectedMessId || !userPhone) return;
    setLoading(true);
    try {
      const existingMessIds = userProfile?.messIds || [];
      const newProfileData: Partial<UserProfile> = {
        name: userName || user.displayName || 'Anonymous',
        email: user.email || '',
        phone: userPhone,
        messId: selectedMessId,
        messIds: Array.from(new Set([...existingMessIds, selectedMessId])),
        institution: institution,
        status: 'Pending',
        isRegistered: true,
      };

      // Preserve role if they are already a manager
      if (!userProfile || userProfile.role !== 'Manager') {
        newProfileData.role = 'Border';
      }

      if (!userProfile) {
        (newProfileData as any).id = user.uid;
        (newProfileData as any).createdAt = new Date().toISOString();
        await setDoc(doc(db, 'users', user.uid), newProfileData as UserProfile);
      } else {
        await updateDoc(doc(db, 'users', user.uid), newProfileData);
      }

      // Create notification for managers
      const notifRef = doc(collection(db, 'notifications'));
      const notification: Notification = {
        id: notifRef.id,
        messId: selectedMessId,
        title: 'New Join Request',
        message: `${newProfileData.name} has requested to join your mess.`,
        type: 'JoinRequest',
        senderId: user.uid,
        senderName: newProfileData.name || 'Anonymous',
        recipientRoles: ['Manager', 'MealManager'],
        readBy: [],
        status: 'Unread',
        createdAt: new Date().toISOString()
      };
      await setDoc(notifRef, notification);

      await refreshProfile();
      setHasEntered(true);
      navigate('/');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMesses = messes.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.managerPhone.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans text-slate-100 relative overflow-hidden transition-colors duration-200">
      
      {/* ── Background Glowing Orbs ── */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-xl w-full z-10 px-1 sm:px-0">
        
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="mb-5 flex justify-center">
            <div className="h-16 w-16 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shadow-indigo-950/20 p-2.5 transform hover:scale-105 transition-all duration-300">
              <LogoIcon size={46} />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 text-white leading-tight">
            {t('onboarding.welcome')}
          </h1>
          <p className="text-slate-400 text-sm font-semibold max-w-sm mx-auto leading-relaxed">
            {t('onboarding.sub')}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'selection' && (
            <motion.div 
              key="selection"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid gap-4 sm:gap-6"
            >
              <button 
                onClick={() => setStep('register_mess')}
                className="group relative bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 rounded-3xl hover:border-blue-600/50 hover:bg-slate-900/60 transition-all duration-300 text-left shadow-2xl active:scale-[0.99] cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
                  <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1">{t('onboarding.create_title')}</h3>
                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-semibold">{t('onboarding.create_desc')}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all self-end sm:self-center" />
                </div>
              </button>

              <button 
                onClick={() => { setStep('join_mess'); fetchMesses(); }}
                className="group relative bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 rounded-3xl hover:border-indigo-600/50 hover:bg-slate-900/60 transition-all duration-300 text-left shadow-2xl active:scale-[0.99] cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
                  <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                    <Users className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1">{t('onboarding.join_title')}</h3>
                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-semibold">{t('onboarding.join_desc')}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all self-end sm:self-center" />
                </div>
              </button>

              <button 
                onClick={logout}
                className="mt-2 flex items-center justify-center gap-2 text-slate-400 hover:text-slate-200 font-bold transition-colors py-3 cursor-pointer text-sm"
              >
                <LogOut className="w-4 h-4" />
                {t('nav.sign_out')}
              </button>
            </motion.div>
          )}

          {step === 'register_mess' && (
            <motion.div 
              key="register"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl"
            >
              <h3 className="text-xl sm:text-2xl font-black text-white mb-1 leading-tight">{t('onboarding.register_title')}</h3>
              <p className="text-slate-400 text-xs sm:text-sm mb-6 sm:mb-8 font-semibold">{t('onboarding.register_sub')}</p>
              
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('onboarding.full_name')}</label>
                  <input 
                    type="text" 
                    value={userName} 
                    onChange={e => setUserName(e.target.value)}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('onboarding.mess_name')}</label>
                  <input 
                    type="text" 
                    placeholder={t('onboarding.mess_name_placeholder')}
                    value={messName} 
                    onChange={e => setMessName(e.target.value)}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('onboarding.manager_phone')}</label>
                    <input 
                      type="tel" 
                      value={messPhone} 
                      onChange={e => setMessPhone(e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('onboarding.total_borders')}</label>
                    <input 
                      type="number" 
                      value={messCapacity} 
                      onChange={e => setMessCapacity(e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setStep('selection')}
                    className="flex-1 py-3.5 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-2xl font-bold text-sm transition-all cursor-pointer text-center"
                  >
                    {t('onboarding.back')}
                  </button>
                  <button 
                    onClick={handleCreateMess}
                    disabled={loading || !messName || !messPhone}
                    className="flex-[2] py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 disabled:border disabled:border-slate-800 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/10 transition-all cursor-pointer text-center"
                  >
                    {loading ? t('onboarding.creating_btn') : t('onboarding.create_btn')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'join_mess' && (
            <motion.div 
              key="join"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl"
            >
              <h3 className="text-xl sm:text-2xl font-black text-white mb-1 leading-tight">{t('onboarding.resident_title')}</h3>
              <p className="text-slate-400 text-xs sm:text-sm mb-6 sm:mb-8 font-semibold">{t('onboarding.resident_sub')}</p>
              
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('onboarding.full_name')}</label>
                  <input 
                    type="text" 
                    value={userName} 
                    onChange={e => setUserName(e.target.value)}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('onboarding.phone')}</label>
                  <input 
                    type="tel" 
                    placeholder={t('onboarding.phone_placeholder')}
                    value={userPhone} 
                    onChange={e => setUserPhone(e.target.value)}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('onboarding.institution')}</label>
                  <input 
                    type="text" 
                    placeholder={t('onboarding.institution_placeholder')}
                    value={institution} 
                    onChange={e => setInstitution(e.target.value)}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('onboarding.select_mess')}</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-450 w-4.5 h-4.5" />
                    <input 
                      type="text" 
                      placeholder="Search mess by name or phone..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="mt-2 max-h-36 overflow-y-auto border border-slate-850 rounded-xl bg-slate-900/60 divide-y divide-slate-850 custom-scrollbar">
                    {filteredMesses.length > 0 ? filteredMesses.map(m => (
                      <button 
                        key={m.id}
                        onClick={() => setSelectedMessId(m.id)}
                        className={`w-full text-left p-3.5 text-sm flex items-center justify-between hover:bg-slate-800/60 transition-colors cursor-pointer ${selectedMessId === m.id ? 'bg-slate-800/40 ring-1 ring-blue-500 ring-inset' : ''}`}
                      >
                        <div className="min-w-0 pr-4">
                          <span className="font-bold text-white block truncate">{m.name}</span>
                          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Manager: {m.managerPhone}</span>
                        </div>
                        {selectedMessId === m.id && <CheckCircle className="w-5 h-5 text-blue-500 shrink-0" />}
                      </button>
                    )) : (
                      <div className="p-4 text-center text-xs text-slate-400 font-semibold">No messes found</div>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setStep('selection')}
                    className="flex-1 py-3.5 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-2xl font-bold text-sm transition-all cursor-pointer text-center"
                  >
                    {t('onboarding.back')}
                  </button>
                  <button 
                    onClick={handleJoinMess}
                    disabled={loading || !selectedMessId || !userPhone}
                    className="flex-[2] py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 disabled:border disabled:border-slate-800 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-500/10 transition-all cursor-pointer text-center"
                  >
                    {loading ? t('onboarding.joining_btn') : t('onboarding.join_btn')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'manager_choice' && (
            <motion.div 
               key="manager_choice"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="grid gap-6"
            >
              <div className="bg-slate-900/45 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 rounded-[2rem] text-slate-100 shadow-2xl relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                     <ShieldCheck className="w-7 h-7 animate-pulse" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white text-center mb-2 leading-tight">
                    {language === 'bn' ? 'স্বাগতম!' : 'Welcome back!'}
                  </h3>
                  <p className="text-slate-400 text-xs text-center mb-6 font-semibold">
                    {language === 'bn' 
                      ? 'আপনার যুক্ত থাকা মেসগুলো নিচে দেখতে পাচ্ছেন:' 
                      : 'Select which mess community you want to open:'}
                  </p>
                  
                  <div className="grid gap-2.5 mb-6 max-h-56 overflow-y-auto px-0.5 custom-scrollbar">
                    {managedMesses.map(m => (
                      <div 
                        key={m.id}
                        className={`w-full p-4 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${
                          userProfile?.messId === m.id 
                            ? 'bg-blue-600/10 border-blue-500 text-white' 
                            : 'bg-slate-800/40 text-slate-300 border-slate-800 hover:border-slate-750'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Home className="w-4.5 h-4.5 text-blue-400 shrink-0" />
                          <span className="truncate text-sm font-bold text-white">{m.name}</span>
                          {m.managerIds?.includes(userProfile?.id || '') && (
                            <span className="text-[8px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-black uppercase shrink-0">
                              {language === 'bn' ? 'ম্যানেজার' : 'Manager'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-end gap-2.5 shrink-0 self-end sm:self-center">
                          <button
                            disabled={switchingMess}
                            onClick={() => handleSwitchAndEnter(m.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer select-none active:scale-95 ${
                              userProfile?.messId === m.id
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20'
                                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                            }`}
                          >
                            {language === 'bn' ? 'প্রবেশ' : 'Enter'}
                          </button>
                          {userProfile?.messId === m.id && (
                            <CheckCircle className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {managedMesses.length === 0 && !switchingMess && (
                      <div className="py-4 text-slate-500 text-xs italic text-center font-semibold">
                         {language === 'bn' ? 'কোন মেস পাওয়া যায়নি' : 'No messes found'}
                      </div>
                    )}
                  </div>

                  {userProfile?.role !== 'Border' && (
                    <div className="pt-4 border-t border-slate-800">
                      <button 
                        onClick={() => setStep('register_mess')}
                        className="w-full py-3.5 bg-slate-800/60 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-700/80 shadow-md"
                      >
                        <Plus className="w-4 h-4" />
                        {language === 'bn' ? 'নতুন মেস খুলুন' : 'Register Another Mess'}
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Decorative gradients */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -ml-32 -mb-32"></div>
              </div>
              
              <button 
                onClick={logout}
                className="flex items-center justify-center gap-2 text-slate-400 hover:text-slate-200 font-bold transition-colors py-2 cursor-pointer text-sm"
              >
                <LogOut className="w-4 h-4" />
                {t('nav.sign_out')}
              </button>
            </motion.div>
          )}

          {step === 'border_entry' && (
             <motion.div 
               key="border_entry"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 rounded-[2rem] shadow-2xl text-center"
             >
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-emerald-500/25">
                   <UserIcon className="w-8 h-8" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white mb-2 leading-tight">Hello, {userName}!</h3>
                <p className="text-slate-400 text-xs sm:text-sm mb-8 font-semibold leading-relaxed">
                  You are a registered resident of this community. Ready to access your dashboard?
                </p>
                
                <button 
                  onClick={() => { setHasEntered(true); navigate('/'); }}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Enter Dashboard</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </button>

                <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col gap-3">
                  <button 
                    onClick={() => setStep('register_mess')}
                    className="text-blue-400 font-bold text-xs hover:text-blue-300 transition-colors py-1 cursor-pointer"
                  >
                    {language === 'bn' ? '+ নতুন কোনো মেস খুলতে চান?' : '+ Want to register another mess?'}
                  </button>
                  <button 
                    onClick={logout}
                    className="flex items-center justify-center gap-2 text-slate-400 hover:text-slate-200 font-bold transition-colors mx-auto cursor-pointer text-xs"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('nav.sign_out')}
                  </button>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
