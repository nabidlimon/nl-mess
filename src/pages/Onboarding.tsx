import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../lib/firebase';
import { doc, setDoc, updateDoc, collection, query, getDocs, where } from 'firebase/firestore';
import { Mess, UserProfile, Notification } from '../types';
import { LogOut, Home, Users, Plus, Search, CheckCircle, ArrowRight, ShieldCheck, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-slate-900">
      <div className="max-w-xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-6 rotate-3">
             <Home className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2">{t('onboarding.welcome')}</h1>
          <p className="text-slate-500 font-medium">{t('onboarding.sub')}</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'selection' && (
            <motion.div 
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid gap-6"
            >
              <button 
                onClick={() => setStep('register_mess')}
                className="group relative bg-white border-2 border-slate-200 p-8 rounded-3xl hover:border-blue-600 transition-all duration-300 text-left shadow-sm hover:shadow-xl"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <ShieldCheck className="w-8 h-8 text-blue-600 group-hover:text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">{t('onboarding.create_title')}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{t('onboarding.create_desc')}</p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </button>

              <button 
                onClick={() => { setStep('join_mess'); fetchMesses(); }}
                className="group relative bg-white border-2 border-slate-200 p-8 rounded-3xl hover:border-blue-600 transition-all duration-300 text-left shadow-sm hover:shadow-xl"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                    <Users className="w-8 h-8 text-indigo-600 group-hover:text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">{t('onboarding.join_title')}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{t('onboarding.join_desc')}</p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
              </button>

              <button 
                onClick={logout}
                className="mt-4 flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 font-bold transition-colors py-4"
              >
                <LogOut className="w-4 h-4" />
                {t('nav.sign_out')}
              </button>
            </motion.div>
          )}

          {step === 'register_mess' && (
            <motion.div 
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm"
            >
              <h3 className="text-2xl font-black mb-1">{t('onboarding.register_title')}</h3>
              <p className="text-slate-500 text-sm mb-8">{t('onboarding.register_sub')}</p>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('onboarding.full_name')}</label>
                  <input 
                    type="text" 
                    value={userName} 
                    onChange={e => setUserName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('onboarding.mess_name')}</label>
                  <input 
                    type="text" 
                    placeholder={t('onboarding.mess_name_placeholder')}
                    value={messName} 
                    onChange={e => setMessName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('onboarding.manager_phone')}</label>
                    <input 
                      type="tel" 
                      value={messPhone} 
                      onChange={e => setMessPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('onboarding.total_borders')}</label>
                    <input 
                      type="number" 
                      value={messCapacity} 
                      onChange={e => setMessCapacity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setStep('selection')}
                    className="flex-1 py-4 px-6 border border-slate-200 hover:bg-slate-50 rounded-2xl font-bold text-slate-600 transition-all cursor-pointer"
                  >
                    {t('onboarding.back')}
                  </button>
                  <button 
                    onClick={handleCreateMess}
                    disabled={loading || !messName || !messPhone}
                    className="flex-[2] py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm"
            >
              <h3 className="text-2xl font-black mb-1">{t('onboarding.resident_title')}</h3>
              <p className="text-slate-500 text-sm mb-8">{t('onboarding.resident_sub')}</p>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('onboarding.full_name')}</label>
                  <input 
                    type="text" 
                    value={userName} 
                    onChange={e => setUserName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('onboarding.phone')}</label>
                  <input 
                    type="tel" 
                    placeholder={t('onboarding.phone_placeholder')}
                    value={userPhone} 
                    onChange={e => setUserPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('onboarding.institution')}</label>
                  <input 
                    type="text" 
                    placeholder={t('onboarding.institution_placeholder')}
                    value={institution} 
                    onChange={e => setInstitution(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('onboarding.select_mess')}</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                      type="text" 
                      placeholder="Search mess by name or phone..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="mt-2 max-h-40 overflow-y-auto border border-slate-100 rounded-xl bg-slate-50 divide-y divide-slate-100">
                    {filteredMesses.length > 0 ? filteredMesses.map(m => (
                      <button 
                        key={m.id}
                        onClick={() => setSelectedMessId(m.id)}
                        className={`w-full text-left p-3 text-sm flex items-center justify-between hover:bg-white transition-colors ${selectedMessId === m.id ? 'bg-white ring-2 ring-blue-500 ring-inset' : ''}`}
                      >
                        <div>
                          <span className="font-bold block">{m.name}</span>
                          <span className="text-[10px] text-slate-500">Manager: {m.managerPhone}</span>
                        </div>
                        {selectedMessId === m.id && <CheckCircle className="w-5 h-5 text-blue-600" />}
                      </button>
                    )) : (
                      <div className="p-4 text-center text-xs text-slate-400">No messes found</div>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setStep('selection')}
                    className="flex-1 py-4 px-6 border border-slate-200 hover:bg-slate-50 rounded-2xl font-bold text-slate-600 transition-all cursor-pointer"
                  >
                    {t('onboarding.back')}
                  </button>
                  <button 
                    onClick={handleJoinMess}
                    disabled={loading || !selectedMessId || !userPhone}
                    className="flex-[2] py-4 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
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
              <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-600/20 text-center relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                     <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black mb-2">
                    {language === 'bn' ? 'স্বাগতম!' : 'Welcome!'}
                  </h3>
                  <p className="text-blue-100 text-xs mb-6">
                    {language === 'bn' 
                      ? 'আপনার যুক্ত থাকা মেসগুলো নিচে দেখতে পাচ্ছেন:' 
                      : 'You are part of the following mess communities:'}
                  </p>
                  
                  <div className="grid gap-3 mb-6 max-h-[300px] overflow-y-auto px-1 custom-scrollbar">
                    {managedMesses.map(m => (
                      <div 
                        key={m.id}
                        className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm transition-all flex items-center justify-between border-2 ${
                          userProfile?.messId === m.id 
                            ? 'bg-white text-blue-600 border-white' 
                            : 'bg-blue-500/30 text-white border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Home className="w-4.5 h-4.5 shrink-0" />
                          <span className="truncate text-base">{m.name}</span>
                          {m.managerIds?.includes(userProfile?.id || '') && (
                            <span className="text-[8px] bg-blue-600/10 text-white border border-white/20 px-1.5 py-0.5 rounded uppercase font-bold shrink-0">
                              {language === 'bn' ? 'ম্যানেজার' : 'Manager'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            disabled={switchingMess}
                            onClick={() => handleSwitchAndEnter(m.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer select-none active:scale-95 ${
                              userProfile?.messId === m.id
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/10'
                                : 'bg-white text-blue-600 hover:bg-blue-50 shadow-md'
                            }`}
                          >
                            {language === 'bn' ? 'প্রবেশ করুন' : 'Enter Mess'}
                          </button>
                          {userProfile?.messId === m.id && (
                            <CheckCircle className="w-5 h-5 text-blue-600 shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {managedMesses.length === 0 && !switchingMess && (
                      <div className="py-4 text-blue-200 text-xs italic">
                         {language === 'bn' ? 'কোন মেস পাওয়া যায়নি' : 'No messes found'}
                      </div>
                    )}
                  </div>

                  {userProfile?.role !== 'Border' && (
                    <div className="pt-2 border-t border-white/10">
                      <button 
                        onClick={() => setStep('register_mess')}
                        className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border border-white/10"
                      >
                        <Plus className="w-4 h-4" />
                        {language === 'bn' ? 'নতুন মেস খুলুন' : 'Register Another Mess'}
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Decorative gradients */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -ml-32 -mb-32"></div>
              </div>
              
              <button 
                onClick={logout}
                className="flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 font-bold transition-colors py-2"
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
               className="bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-xl text-center"
             >
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                   <UserIcon className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-2">Hello, {userName}!</h3>
                <p className="text-slate-500 mb-10">You are a member of <span className="font-bold text-slate-900">{userProfile?.messId ? 'your mess' : 'a mess'}</span>. Ready to check in?</p>
                
                <button 
                  onClick={() => { setHasEntered(true); navigate('/'); }}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-slate-900/20 cursor-pointer flex items-center justify-center gap-3"
                >
                  Enter Mess
                  <ArrowRight className="w-6 h-6" />
                </button>

                <div className="mt-6 pt-4 border-t border-slate-50 flex flex-col gap-3">
                  <button 
                    onClick={() => setStep('register_mess')}
                    className="text-blue-600 font-bold text-sm hover:text-blue-700 transition-colors py-2"
                  >
                    {language === 'bn' ? '+ নতুন কোনো মেস খুলতে চান?' : '+ Want to create another mess?'}
                  </button>
                  <button 
                    onClick={logout}
                    className="flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 font-bold transition-colors mx-auto"
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
