import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch, arrayUnion, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Member, Meal, Notification } from '../types';
import { CheckCircle2, XCircle, UserCheck, UtensilsCrossed, Megaphone, Loader2, AlertCircle, Sparkles, ClipboardCheck } from 'lucide-react';
import { format } from 'date-fns';

export default function Approvals() {
  const { currentMess, userProfile, isSupreme } = useAuth();
  const { t, language } = useLanguage();

  const isMessManager = (currentMess?.managerIds || []).includes(userProfile?.id || '');
  const isOverallManager = isMessManager || isSupreme || userProfile?.role === 'Manager';
  const isMealManager = userProfile?.role === 'MealManager';
  const isAdmin = isOverallManager || isMealManager;

  const [activeTab, setActiveTab] = useState<'admissions' | 'guestMeals'>(
    isOverallManager ? 'admissions' : 'guestMeals'
  );
  const [pendingMembers, setPendingMembers] = useState<Member[]>([]);
  const [pendingMeals, setPendingMeals] = useState<(Meal & { memberName?: string })[]>([]);
  const [membersMap, setMembersMap] = useState<Record<string, Member>>({});
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  // States for room allocation modal
  const [allocatingMember, setAllocatingMember] = useState<Member | null>(null);
  const [roomNumber, setRoomNumber] = useState('');

  // 1. Fetch all members/users in the mess
  useEffect(() => {
    if (!currentMess?.id) return;

    const qMembers = query(
      collection(db, 'users'),
      where('messId', '==', currentMess.id)
    );

    const unsubMembers = onSnapshot(qMembers, (snap) => {
      const allMembers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
      
      // Filter pending admission requests
      const pending = allMembers.filter(m => m.status === 'Pending');
      setPendingMembers(pending);

      // Map for easy member lookup by id
      const mapping = allMembers.reduce((acc, m) => {
        acc[m.id] = m;
        return acc;
      }, {} as Record<string, Member>);
      setMembersMap(mapping);
      
      setLoading(false);
    }, (err) => {
      console.error("Error fetching members for approvals:", err);
      setLoading(false);
    });

    return () => unsubMembers();
  }, [currentMess?.id]);

  // 2. Fetch pending guest meals
  useEffect(() => {
    if (!currentMess?.id) return;

    const qMeals = query(
      collection(db, 'meals'),
      where('messId', '==', currentMess.id)
    );

    const unsubMeals = onSnapshot(qMeals, (snap) => {
      const allMeals = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Meal));
      const pending = allMeals.filter(m => 
        (m.pendingGuestMorning && m.pendingGuestMorning > 0) ||
        (m.pendingGuestLunch && m.pendingGuestLunch > 0) ||
        (m.pendingGuestDinner && m.pendingGuestDinner > 0)
      );

      // Sort by date ascending
      pending.sort((a, b) => a.date.localeCompare(b.date));
      setPendingMeals(pending);
    }, (err) => {
      console.error("Error fetching meals for approvals:", err);
    });

    return () => unsubMeals();
  }, [currentMess?.id]);

  // Handle Admission Approval
  const handleApproveMember = async (member: Member, room: string) => {
    try {
      setActionId(member.id);
      
      // Update member status and room
      await updateDoc(doc(db, 'users', member.id), {
        status: 'Active',
        room: room.trim() || '',
        role: 'Border'
      });

      // Send approval notification
      const notifRef = doc(collection(db, 'notifications'));
      await updateDoc(doc(db, 'notifications', notifRef.id), {
        id: notifRef.id,
        userId: member.id,
        messId: currentMess?.id,
        title: language === 'bn' ? 'আবেদন মঞ্জুর হয়েছে' : 'Admission Approved',
        message: language === 'bn'
          ? `আপনার ভর্তি আবেদন মঞ্জুর করা হয়েছে। রুম নং: ${room || 'এন/এ'}`
          : `Your admission request has been approved. Room No: ${room || 'N/A'}`,
        type: 'approval',
        read: false,
        createdAt: new Date().toISOString()
      });

      // Mark matching JoinRequest notifications as approved
      const qNotif = query(
        collection(db, 'notifications'),
        where('messId', '==', currentMess?.id),
        where('senderId', '==', member.id),
        where('type', '==', 'JoinRequest')
      );
      const notifSnap = await getDocs(qNotif);
      if (!notifSnap.empty) {
        const batch = writeBatch(db);
        notifSnap.docs.forEach(d => {
          batch.update(d.ref, {
            actionTaken: 'approved',
            readBy: arrayUnion(userProfile?.id || '')
          });
        });
        await batch.commit();
      }

      setAllocatingMember(null);
      setRoomNumber('');
    } catch (err) {
      console.error("Error approving member:", err);
    } finally {
      setActionId(null);
    }
  };

  // Handle Admission Decline
  const handleDeclineMember = async (member: Member) => {
    if (!window.confirm(language === 'bn' ? `আপনি কি নিশ্চিতভাবে এই আবেদনটি প্রত্যাখ্যান করতে চান?` : `Are you sure you want to decline this request?`)) return;
    try {
      setActionId(member.id);

      // Remove from mess and put status inactive
      await updateDoc(doc(db, 'users', member.id), {
        messId: null,
        status: 'Inactive'
      });

      // Notify user
      const notifRef = doc(collection(db, 'notifications'));
      await updateDoc(doc(db, 'notifications', notifRef.id), {
        id: notifRef.id,
        userId: member.id,
        title: language === 'bn' ? 'আবেদন প্রত্যাখ্যান করা হয়েছে' : 'Admission Declined',
        message: language === 'bn'
          ? `আপনার যোগদানের অনুরোধ বাতিল করা হয়েছে। অনুগ্রহ করে অন্য কোনো মেসে চেষ্টা করুন।`
          : `Your join request has been declined. Please try joining another mess.`,
        type: 'System',
        read: false,
        createdAt: new Date().toISOString()
      });

      // Mark JoinRequest notifications as declined
      const qNotif = query(
        collection(db, 'notifications'),
        where('messId', '==', currentMess?.id),
        where('senderId', '==', member.id),
        where('type', '==', 'JoinRequest')
      );
      const notifSnap = await getDocs(qNotif);
      if (!notifSnap.empty) {
        const batch = writeBatch(db);
        notifSnap.docs.forEach(d => {
          batch.update(d.ref, {
            actionTaken: 'declined',
            readBy: arrayUnion(userProfile?.id || '')
          });
        });
        await batch.commit();
      }
    } catch (err) {
      console.error("Error declining member:", err);
    } finally {
      setActionId(null);
    }
  };

  // Handle Guest Meals Approval
  const handleApproveGuest = async (meal: Meal) => {
    try {
      setActionId(meal.id);
      
      const pm = meal.pendingGuestMorning || 0;
      const pl = meal.pendingGuestLunch || 0;
      const pd = meal.pendingGuestDinner || 0;

      const newGuestMorning = (meal.guestMorning || 0) + pm;
      const newGuestLunch = (meal.guestLunch || 0) + pl;
      const newGuestDinner = (meal.guestDinner || 0) + pd;

      let ownMealCount = 0;
      if (meal.morning !== undefined) {
        if (meal.morning) ownMealCount += 0.5;
        if (meal.lunch) ownMealCount += 1;
        if (meal.dinner) ownMealCount += 1;
      } else {
        ownMealCount = (meal.mealCount || 0) - ((meal.guestMorning || 0) * 0.5 + (meal.guestLunch || 0) + (meal.guestDinner || 0));
        if (ownMealCount < 0) ownMealCount = 0;
      }

      const newMealCount = ownMealCount + (newGuestMorning * 0.5) + newGuestLunch + newGuestDinner;
      const newDisplayValue = String(newMealCount);

      const batch = writeBatch(db);
      batch.update(doc(db, 'meals', meal.id), {
        guestMorning: newGuestMorning,
        guestLunch: newGuestLunch,
        guestDinner: newGuestDinner,
        pendingGuestMorning: 0,
        pendingGuestLunch: 0,
        pendingGuestDinner: 0,
        mealCount: newMealCount,
        displayValue: newDisplayValue,
        updatedAt: serverTimestamp()
      });

      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        id: notifRef.id,
        userId: meal.memberId,
        messId: currentMess?.id,
        title: language === 'bn' ? 'গেস্ট মিল অনুমোদিত' : 'Guest Meal Approved',
        message: language === 'bn'
          ? `আপনার ${meal.date} তারিখের গেস্ট মিলের অনুরোধটি অনুমোদিত হয়েছে। (সকাল: ${pm}, দুপুর: ${pl}, রাত: ${pd})`
          : `Your guest meal request for ${meal.date} has been approved. (Morning: ${pm}, Lunch: ${pl}, Dinner: ${pd})`,
        type: 'MealUpdate',
        read: false,
        createdAt: serverTimestamp()
      });

      await batch.commit();
    } catch (error) {
      console.error("Error approving guest meal:", error);
    } finally {
      setActionId(null);
    }
  };

  // Handle Guest Meals Decline
  const handleDeclineGuest = async (meal: Meal) => {
    try {
      setActionId(meal.id);
      
      const batch = writeBatch(db);
      batch.update(doc(db, 'meals', meal.id), {
        pendingGuestMorning: 0,
        pendingGuestLunch: 0,
        pendingGuestDinner: 0,
        updatedAt: serverTimestamp()
      });

      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        id: notifRef.id,
        userId: meal.memberId,
        messId: currentMess?.id,
        title: language === 'bn' ? 'গেস্ট মিল প্রত্যাখ্যান' : 'Guest Meal Declined',
        message: language === 'bn'
          ? `আপনার ${meal.date} তারিখের গেস্ট মিলের অনুরোধটি প্রত্যাখ্যান করা হয়েছে।`
          : `Your guest meal request for ${meal.date} has been declined.`,
        type: 'MealUpdate',
        read: false,
        createdAt: serverTimestamp()
      });

      await batch.commit();
    } catch (error) {
      console.error("Error declining guest meal:", error);
    } finally {
      setActionId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center max-w-lg mx-auto">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          {language === 'bn' ? 'অনুমতি নেই' : 'Access Denied'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {language === 'bn'
            ? 'এই পেজটি শুধুমাত্র মেস ম্যানেজার এবং মিল ম্যানেজারদের জন্য উন্মুক্ত।'
            : 'This page is only accessible to Mess Managers and Meal Managers.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
              <ClipboardCheck className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {language === 'bn' ? 'অনুমোদন ডেক' : 'Approvals Panel'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {language === 'bn'
              ? 'মেসে ভর্তি এবং অতিরিক্ত গেস্ট মিলের অনুরোধগুলো এখান থেকে অনুমোদন বা বাতিল করুন।'
              : 'Review, approve, or decline pending member admissions and guest meal requests.'}
          </p>
        </div>

        {/* Counter Summary Pills */}
        <div className="flex flex-wrap gap-2.5">
          {isOverallManager && (
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl px-4 py-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-amber-800 dark:text-amber-400">
                {pendingMembers.length} {language === 'bn' ? 'আবেদন' : 'Admissions'}
              </span>
            </div>
          )}
          {(isOverallManager || isMealManager) && (
            <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl px-4 py-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="text-xs font-bold text-indigo-800 dark:text-indigo-400">
                {pendingMeals.length} {language === 'bn' ? 'গেস্ট মিল' : 'Guest Meals'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      {isOverallManager && (
        <div className="flex bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-1.5 rounded-2xl max-w-md">
          <button
            onClick={() => setActiveTab('admissions')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black rounded-xl transition-all cursor-pointer ${
              activeTab === 'admissions'
                ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-white shadow-md'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>{language === 'bn' ? 'ভর্তি অনুরোধ' : 'Pending Admissions'}</span>
            {pendingMembers.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-black bg-amber-500 text-white rounded-full leading-none">
                {pendingMembers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('guestMeals')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black rounded-xl transition-all cursor-pointer ${
              activeTab === 'guestMeals'
                ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-white shadow-md'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>{language === 'bn' ? 'গেস্ট মিল' : 'Guest Meal Requests'}</span>
            {pendingMeals.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-black bg-indigo-500 text-white rounded-full leading-none">
                {pendingMeals.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ── Active Tab Display Panel ── */}
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">{t('common.loading')}</p>
        </div>
      ) : activeTab === 'admissions' && isOverallManager ? (
        /* ──── ADMISSIONS TAB ──── */
        pendingMembers.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 transition-colors duration-200">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-850">
              <UserCheck className="w-6 h-6 text-slate-350 dark:text-slate-650" />
            </div>
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              {language === 'bn' ? 'কোনো নতুন আবেদনকারী নেই' : 'No Pending Admission Requests'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              {language === 'bn'
                ? 'বর্তমানে নতুন কোনো যোগদানের আবেদন নেই। ব্যবহারকারীরা মেস আইডিতে রিকোয়েস্ট পাঠালে এখানে প্রদর্শন করা হবে।'
                : 'All join requests for this mess have been reviewed. When new borders apply, they will appear here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-all duration-200"
              >
                <div>
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-sm shadow-blue-500/10">
                      {member.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-850 dark:text-white">{member.name || 'Anonymous User'}</h4>
                      <p className="text-[10px] font-bold text-blue-500 mt-0.5">{member.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-850 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{language === 'bn' ? 'ফোন নম্বর' : 'Phone'}</span>
                      <span className="text-slate-800 dark:text-slate-200">{member.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{language === 'bn' ? 'শিক্ষা প্রতিষ্ঠান' : 'Institution'}</span>
                      <span className="text-slate-800 dark:text-slate-200">{member.institution || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{language === 'bn' ? 'যোগদানের অনুরোধ' : 'Requested At'}</span>
                      <span className="text-slate-800 dark:text-slate-200">
                        {member.createdAt ? format(new Date(member.createdAt), 'PP p') : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-850">
                  <button
                    disabled={actionId !== null}
                    onClick={() => handleDeclineMember(member)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-500 text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{language === 'bn' ? 'বাতিল' : 'Decline'}</span>
                  </button>
                  <button
                    disabled={actionId !== null}
                    onClick={() => {
                      setAllocatingMember(member);
                      setRoomNumber(member.room || '');
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-md shadow-blue-500/10 active:scale-98 disabled:opacity-50"
                  >
                    {actionId === member.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>{language === 'bn' ? 'অনুমোদন দিন' : 'Approve'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* ──── GUEST MEALS TAB ──── */
        pendingMeals.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 transition-colors duration-200">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-850">
              <UtensilsCrossed className="w-6 h-6 text-slate-350 dark:text-slate-650" />
            </div>
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              {language === 'bn' ? 'কোনো অমীমাংসিত গেস্ট মিল নেই' : 'No Guest Meal Approvals'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              {language === 'bn'
                ? 'বর্তমানে কোনো গেস্ট মিলের অনুমোদনের অনুরোধ পেন্ডিং নেই। বর্ডাররা মিল ড্যাশবোর্ডে গেস্ট যোগ করলে এখানে দেখতে পাবেন।'
                : 'All guest meal approvals have been processed. When borders request guest tokens, they will appear here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingMeals.map((meal) => {
              const border = membersMap[meal.memberId];
              const pm = meal.pendingGuestMorning || 0;
              const pl = meal.pendingGuestLunch || 0;
              const pd = meal.pendingGuestDinner || 0;
              const total = pm + pl + pd;

              return (
                <div
                  key={meal.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-all duration-200"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-850">
                      <div>
                        <h4 className="text-sm font-black text-slate-850 dark:text-white">
                          {border?.name || 'Loading Name...'}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                          {border?.room ? `${language === 'bn' ? 'রুম' : 'Room'}: ${border.room}` : ''}
                        </p>
                      </div>
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 px-3 py-1.5 rounded-full font-mono">
                        {meal.date}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-3">
                      {language === 'bn'
                        ? 'গেস্ট মিল টোটাল: '
                        : 'Requested Guest Meal Allocation: '}
                      <span className="text-indigo-600 dark:text-indigo-400 font-black">{total}</span>
                    </p>

                    <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-850 mb-5">
                      <div className="flex flex-col items-center justify-center p-2 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">{language === 'bn' ? 'সকাল' : 'Morning'}</span>
                        <span className="text-base font-black text-slate-800 dark:text-slate-200 mt-0.5">{pm}</span>
                      </div>
                      <div className="flex flex-col items-center justify-center p-2 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">{language === 'bn' ? 'দুপুর' : 'Lunch'}</span>
                        <span className="text-base font-black text-slate-800 dark:text-slate-200 mt-0.5">{pl}</span>
                      </div>
                      <div className="flex flex-col items-center justify-center p-2 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">{language === 'bn' ? 'রাত' : 'Dinner'}</span>
                        <span className="text-base font-black text-slate-800 dark:text-slate-200 mt-0.5">{pd}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-850">
                    <button
                      disabled={actionId !== null}
                      onClick={() => handleDeclineGuest(meal)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-500 text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{language === 'bn' ? 'বাতিল' : 'Decline'}</span>
                    </button>
                    <button
                      disabled={actionId !== null}
                      onClick={() => handleApproveGuest(meal)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-md shadow-blue-500/10 active:scale-98 disabled:opacity-50"
                    >
                      {actionId === meal.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>{language === 'bn' ? 'অনুমোদন দিন' : 'Approve'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Room Allocation Modal Dialog */}
      {allocatingMember && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-scale-up border border-slate-100 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="p-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-blue-600">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {language === 'bn' ? 'রুম নাম্বার বরাদ্দ' : 'Allocate Room Number'}
              </h3>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              {language === 'bn'
                ? `অনুগ্রহ করে বর্ডার "${allocatingMember.name}" এর জন্য একটি রুম নম্বর প্রবেশ করান। পরবর্তীতে পরিবর্তন করতে পারবেন।`
                : `Please allocate a room number for "${allocatingMember.name}". You can always modify this later.`}
            </p>

            <div className="space-y-4">
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder={language === 'bn' ? 'যেমন: ৩০২-এ' : 'e.g., 302-A'}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setAllocatingMember(null);
                    setRoomNumber('');
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-750 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  onClick={() => handleApproveMember(allocatingMember, roomNumber)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                >
                  {language === 'bn' ? 'অনুমোদন দিন' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
