import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { doc, updateDoc, getDocs, collection, query, where, documentId } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Phone, Mail, Award, Key, MapPin, CheckCircle, Home, RefreshCcw, Building } from 'lucide-react';
import { Mess } from '../types';

export default function Profile() {
  const { user, userProfile, currentMess, managedMesses, refreshProfile } = useAuth();
  const { language } = useLanguage();

  const [name, setName] = useState(userProfile?.name || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [institution, setInstitution] = useState(userProfile?.institution || '');
  const [room, setRoom] = useState((userProfile as any)?.room || '');
  const [pin, setPin] = useState(userProfile?.plainPin || '');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [allMyMesses, setAllMyMesses] = useState<Mess[]>([]);
  const [switchingMess, setSwitchingMess] = useState(false);

  useEffect(() => {
    const fetchMyMesses = async () => {
      const messIds = userProfile?.messIds || [];
      const combined = [...managedMesses];
      
      // Fetch any from messIds that are NOT in managedMesses
      const missingIds = messIds.filter(id => !combined.find(m => m.id === id));
      
      if (missingIds.length > 0) {
        try {
          const q = query(collection(db, 'messes'), where(documentId(), 'in', missingIds.slice(0, 10))); 
          const snap = await getDocs(q);
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Mess));
          data.forEach(m => {
             if (!combined.find(ex => ex.id === m.id)) combined.push(m);
          });
        } catch (err) {
          console.error("Error fetching my messes", err);
        }
      }
      setAllMyMesses(combined);
    };
    fetchMyMesses();
  }, [userProfile?.messIds, managedMesses]);

  const handleSwitchMess = async (messId: string) => {
    if (!userProfile?.id || switchingMess) return;
    try {
      setSwitchingMess(true);
      await updateDoc(doc(db, 'users', userProfile.id), {
        messId: messId
      });
      await refreshProfile();
      setSuccessMsg(t('Mess switched successfully!', 'মেস সফলভাবে পরিবর্তন করা হয়েছে!'));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSwitchingMess(false);
    }
  };

  const isBorder = userProfile?.role === 'Border' || userProfile?.role === 'MealManager';

  const t = (enValue: string, bnValue: string) => {
    return language === 'bn' ? bnValue : enValue;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const userId = userProfile?.id || user?.uid;
    if (!userId) {
      setErrorMsg(t('User session not found.', 'ব্যবহারকারীর সেশন পাওয়া যায়নি।'));
      return;
    }

    if (!name.trim()) {
      setErrorMsg(t('Name is required.', 'নাম দেওয়া আবশ্যক।'));
      return;
    }

    if (pin && pin.length !== 6) {
      setErrorMsg(t('PIN must be exactly 6 digits.', 'পিন নম্বর অবশ্যই ৬ ডিজিটের হতে হবে।'));
      return;
    }

    setLoading(true);

    try {
      const userRef = doc(db, 'users', userId);
      const updates: any = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        updatedAt: new Date().toISOString()
      };

      if (pin) {
        updates.plainPin = pin;
      }

      if (isBorder) {
        updates.institution = institution.trim();
        updates.room = room.trim();
      }

      await updateDoc(userRef, updates);
      await refreshProfile();
      setSuccessMsg(t('Profile updated successfully!', 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে!'));
      
      // Auto-dismiss success message
      setTimeout(() => {
        setSuccessMsg('');
      }, 4000);
    } catch (err: any) {
      console.error('Error updating profile', err);
      setErrorMsg(err?.message || t('Failed to update profile.', 'প্রোফাইল আপডেট করতে ব্যর্থ হয়েছে।'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
            <span className="text-3xl font-extrabold text-white tracking-wider">
              {name.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{name || t('User Profile', 'ব্যবহারকারী প্রোফাইল')}</h1>
              <CheckCircle className="w-5 h-5 text-emerald-400 fill-white" />
            </div>
            <p className="text-sm text-blue-100 font-medium">
              {userProfile?.role === 'Manager' 
                ? t('Mess Manager', 'মেস ম্যানেজার') 
                : userProfile?.role === 'MealManager'
                ? t('Meal Manager', 'মিল ম্যানেজার')
                : t('Mess Resident / Border', 'মেস আবাসিক বর্ডার')}
            </p>
            {userProfile?.status && (
              <span className="inline-block mt-1 px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                {userProfile.status}
              </span>
            )}
          </div>
        </div>

        {/* Mess Selector / Switching */}
        {allMyMesses.length > 1 && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-500" />
                {t('My Messes', 'আমার মেসসমূহ')}
              </h3>
              {switchingMess && <RefreshCcw className="w-4 h-4 animate-spin text-blue-500" />}
            </div>
            <div className="space-y-2">
              {allMyMesses.map(m => (
                <button
                  key={m.id}
                  onClick={() => handleSwitchMess(m.id)}
                  disabled={m.id === userProfile?.messId || switchingMess}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between group ${
                    m.id === userProfile?.messId 
                      ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/10' 
                      : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${m.id === userProfile?.messId ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'}`}>
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${m.id === userProfile?.messId ? 'text-blue-900' : 'text-slate-700'}`}>{m.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium truncate max-w-[140px]">{m.id}</p>
                    </div>
                  </div>
                  {m.id === userProfile?.messId && (
                    <div className="bg-blue-600 text-white rounded-full p-1 shadow-sm shadow-blue-600/20">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 font-medium italic text-center px-2">
              {t('You can manage multiple messes. Select one to enter.', 'আপনি একাধিক মেস পরিচালনা করতে পারেন। যেকোনো একটি নির্বাচন করে প্রবেশ করুন।')}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card Summary */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 h-fit">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            {t('Overview', 'এক নজরে')}
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase">{t('Role', 'পদবী')}</p>
                <p className="text-sm font-semibold text-slate-700">
                  {userProfile?.role || 'Border'}
                </p>
              </div>
            </div>

            {userProfile?.messId && (
              <div className="flex items-start gap-3">
                <Home className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] text-slate-400 font-bold uppercase">{t('Mess ID', 'মেস আইডি')}</p>
                  <p className="text-sm font-mono font-semibold text-slate-700 truncate max-w-[160px]" title={userProfile?.messId}>
                    {userProfile?.messId}
                  </p>
                </div>
              </div>
            )}

            {userProfile?.location?.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] text-slate-400 font-bold uppercase">{t('Registered Address', 'নিবন্ধিত ঠিকানা')}</p>
                  <p className="text-xs font-medium text-slate-600 line-clamp-3">
                    {userProfile.location.address}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Editing Form */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">
              {t('Edit Profile Information', 'প্রোফাইল তথ্য পরিবর্তন করুন')}
            </h2>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-5">
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-sm font-medium">
                {errorMsg}
              </div>
            )}

            {/* Basic Info Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {t('Full Name', 'সম্পূর্ণ নাম')} *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 font-medium text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {t('Phone Number', 'ফোন নম্বর')}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 017xxxxxxxx"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 font-medium text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {t('Email Address', 'ইমেইল অ্যাড্রেস')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 font-medium text-sm transition-all"
                />
              </div>
            </div>

            {/* Border Specific Row */}
            {isBorder && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    {t('Institution / Education', 'শিক্ষা প্রতিষ্ঠান / অফিস')}
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 font-medium text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    {t('Room Number', 'রুম নম্বর')}
                  </label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 font-medium text-sm transition-all"
                  />
                </div>
              </div>
            )}

            {/* Security Setting: Login PIN */}
            <div className="border-t border-slate-100 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {t('Update 6-Digit Login PIN', '৬-ডিজিটের লগইন পিন আপডেট করুন')}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    maxLength={6}
                    minLength={6}
                    pattern="\d{6}"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 font-mono tracking-[0.5em] text-sm transition-all"
                    placeholder="******"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {t('Used to log in quickly without Google.', 'গুগল ছাড়া দ্রুত লগইন করতে এই পিন নম্বরটি ব্যবহার করুন।')}
                </p>
              </div>
            </div>

            {/* Form actions */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl text-white bg-blue-600 hover:bg-blue-700 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow active:scale-[0.98]"
              >
                {loading ? t('Saving...', 'সংরক্ষণ করা হচ্ছে...') : t('Save Changes', 'তথ্য সংরক্ষণ করুন')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
