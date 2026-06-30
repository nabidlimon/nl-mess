import { useState, useEffect } from 'react';
import { Bell, Info, CheckCircle2, AlertTriangle, Trash2, X, UserPlus, BellRing, Utensils, ShoppingCart, Shield, Volume2, Home, Check } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, deleteDoc, writeBatch, arrayUnion, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Notification } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/firestore-error';

export function NotificationCenter() {
  const { userProfile, currentMess, isSupreme } = useAuth();
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isMessManager = (currentMess?.managerIds || []).includes(userProfile?.id || '');
  const canApproveDecline = isMessManager || isSupreme;

  const handleApproveJoin = async (notificationId: string, senderId: string, messId: string) => {
    try {
      // 1. Update user profile to status 'Active'
      await updateDoc(doc(db, 'users', senderId), { status: 'Active' });

      // 2. Send notification of type 'approval' to user
      await addDoc(collection(db, 'notifications'), {
        userId: senderId,
        messId: messId,
        title: language === 'bn' ? 'অ্যাকাউন্ট অ্যাপ্রুভ হয়েছে' : 'Account Approved',
        message: language === 'bn' 
          ? `আপনার মেসে ভর্তির আবেদন মঞ্জুর করা হয়েছে। এখন আপনি ড্যাশবোর্ড ব্যবহার করতে পারবেন।` 
          : `Your request to join the mess has been approved. You can now access the dashboard.`,
        type: 'approval',
        read: false,
        createdAt: new Date().toISOString()
      });

      // 3. Mark the join request notification as approved
      await updateDoc(doc(db, 'notifications', notificationId), {
        actionTaken: 'approved',
        readBy: arrayUnion(userProfile?.id || '')
      });
    } catch (error) {
      console.error("Error approving join request from notification", error);
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${notificationId}`);
    }
  };

  const handleDeclineJoin = async (notificationId: string, senderId: string) => {
    try {
      // 1. Decline user: set status to 'Inactive' and messId to null so they can join another mess
      await updateDoc(doc(db, 'users', senderId), {
        messId: null,
        status: 'Inactive'
      });

      // 2. Send private notification to user about the decline
      await addDoc(collection(db, 'notifications'), {
        userId: senderId,
        title: language === 'bn' ? 'আবেদন প্রত্যাখ্যান করা হয়েছে' : 'Request Declined',
        message: language === 'bn' 
          ? `আপনার মেসে যোগদানের অনুরোধ বাতিল করা হয়েছে। আপনি অন্য কোন মেসে যোগদানের চেষ্টা করতে পারেন।` 
          : `Your request to join the mess has been declined. You can try joining another mess.`,
        type: 'System',
        read: false,
        createdAt: new Date().toISOString()
      });

      // 3. Mark the join request notification as declined
      await updateDoc(doc(db, 'notifications', notificationId), {
        actionTaken: 'declined',
        readBy: arrayUnion(userProfile?.id || '')
      });
    } catch (error) {
      console.error("Error declining join request from notification", error);
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${notificationId}`);
    }
  };

  useEffect(() => {
    if (!userProfile?.id || !userProfile?.messId) return;

    // We query all notifications for the mess and filter in JS for role/user.
    // This avoids complex and expensive 'or' queries that often fail with 'invalid argument'.
    const q = query(
      collection(db, 'notifications'),
      where('messId', '==', userProfile.messId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => {
          const d = doc.data();
          // Filter: Role-based OR Personal
          const matches = (d.recipientRoles && d.recipientRoles.includes(userProfile.role)) || 
                          (d.userId === userProfile.id);
          
          if (!matches) return null;

          const isRead = d.read === true || (d.readBy && d.readBy.includes(userProfile.id));
          return {
            id: doc.id,
            ...d,
            isReadUnified: isRead
          } as any;
        })
        .filter(Boolean) as (Notification & { isReadUnified: boolean })[];
      
      setNotifications(data as any);
      const unread = data.filter(n => !n.isReadUnified).length;
      setUnreadCount(unread);
    }, (error) => {
      console.warn("NotificationCenter onSnapshot error:", error);
    });

    return () => unsubscribe();
  }, [userProfile?.id, userProfile?.messId, userProfile?.role]);

  const markAsRead = async (id: string) => {
    if (!userProfile?.id) return;
    const notif = notifications.find(n => n.id === id);
    if (!notif) return;

    const update: any = { 
      readBy: arrayUnion(userProfile.id) 
    };
    // Also update legacy 'read' if it exists and this was a personal notification
    if (notif.userId === userProfile.id) {
       update.read = true;
    }
    
    await updateDoc(doc(db, 'notifications', id), update);
  };

  const markAllAsRead = async () => {
    if (!userProfile?.id) return;
    const unread = (notifications as any[]).filter(n => !n.isReadUnified);
    const batch = writeBatch(db);
    
    unread.forEach(n => {
      const update: any = { 
        readBy: arrayUnion(userProfile.id) 
      };
      if (n.userId === userProfile.id) {
        update.read = true;
      }
      batch.update(doc(db, 'notifications', n.id), update);
    });
    
    await batch.commit();
  };

  const deleteNotification = async (id: string) => {
    await deleteDoc(doc(db, 'notifications', id));
  };

  const clearAll = async () => {
    const batch = writeBatch(db);
    notifications.forEach(n => {
      batch.delete(doc(db, 'notifications', n.id));
    });
    await batch.commit();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl transition-all hover:bg-slate-100 border border-transparent hover:border-slate-200 active:scale-95 cursor-pointer"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white ring-1 ring-red-500/20">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden origin-top-right"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900">
                    {language === 'bn' ? 'বিজ্ঞপ্তি' : 'Notifications'}
                  </h3>
                  {unreadCount > 0 && (
                    <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {unreadCount} {language === 'bn' ? 'নতুন' : 'NEW'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {notifications.length > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors uppercase tracking-wider"
                    >
                      {language === 'bn' ? 'সব পড়ুন' : 'Mark all read'}
                    </button>
                  )}
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-900">
                      {language === 'bn' ? 'কোন বিজ্ঞপ্তি নেই' : 'No notifications'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {language === 'bn' ? 'সবকিছু ঠিকঠাক আছে!' : 'Everything is all caught up.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {(notifications as any[]).map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          "p-4 hover:bg-slate-50 transition-all group relative cursor-pointer",
                          !n.isReadUnified && "bg-blue-50/30 ring-1 ring-inset ring-blue-500/5"
                        )}
                        onClick={() => !n.isReadUnified && markAsRead(n.id)}
                      >
                        <div className="flex gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-xl shrink-0 flex items-center justify-center",
                            n.type === 'JoinRequest' ? "bg-amber-100 text-amber-600" :
                            n.type === 'MealUpdate' ? "bg-emerald-100 text-emerald-600" :
                            n.type === 'BazarUpdate' ? "bg-sky-100 text-sky-600" :
                            n.type === 'notice' ? "bg-indigo-100 text-indigo-600" :
                            n.type === 'approval' ? "bg-teal-100 text-teal-600" :
                            n.type === 'registration' ? "bg-purple-100 text-purple-600" :
                            n.type === 'System' ? "bg-slate-100 text-slate-600" :
                            "bg-blue-100 text-blue-600"
                          )}>
                            {n.type === 'JoinRequest' ? <UserPlus className="w-4 h-4" /> :
                             n.type === 'MealUpdate' ? <Utensils className="w-4 h-4" /> :
                             n.type === 'BazarUpdate' ? <ShoppingCart className="w-4 h-4" /> :
                             n.type === 'notice' ? <Volume2 className="w-4 h-4" /> :
                             n.type === 'approval' ? <CheckCircle2 className="w-4 h-4" /> :
                             n.type === 'registration' ? <Home className="w-4 h-4" /> :
                             n.type === 'System' ? <Shield className="w-4 h-4" /> :
                             <Info className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={cn("text-sm font-bold truncate", n.isReadUnified ? "text-slate-700" : "text-slate-900")}>
                                {n.title}
                              </p>
                              <span className="text-[10px] text-slate-400 font-medium shrink-0">
                                {n.createdAt ? (typeof n.createdAt === 'string' ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (n.createdAt.toDate ? n.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now')) : 'Just now'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                              {n.message}
                            </p>
                            {n.type === 'JoinRequest' && (
                              <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                {n.actionTaken ? (
                                  <span className={cn(
                                    "px-2.5 py-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold rounded-lg border",
                                    n.actionTaken === 'approved' 
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                      : "bg-red-50 text-red-700 border-red-200"
                                  )}>
                                    {n.actionTaken === 'approved' ? (
                                      <>
                                        <Check className="w-3 h-3 shrink-0" />
                                        {language === 'bn' ? 'অনুমোদিত' : 'Approved'}
                                      </>
                                    ) : (
                                      <>
                                        <X className="w-3 h-3 shrink-0" />
                                        {language === 'bn' ? 'বাতিল করা হয়েছে' : 'Declined'}
                                      </>
                                    )}
                                  </span>
                                ) : (
                                  canApproveDecline ? (
                                    <>
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          if (n.senderId && n.messId) {
                                            await handleApproveJoin(n.id, n.senderId, n.messId);
                                          }
                                        }}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition active:scale-95 cursor-pointer shadow-sm shadow-emerald-600/10"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        {language === 'bn' ? 'অনুমোদন' : 'Approve'}
                                      </button>
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          if (n.senderId) {
                                            await handleDeclineJoin(n.id, n.senderId);
                                          }
                                        }}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-xl hover:bg-red-100 transition active:scale-95 cursor-pointer"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                        {language === 'bn' ? 'বাতিল' : 'Decline'}
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-medium italic">
                                      {language === 'bn' ? 'অনুমোদন পেন্ডিং' : 'Approval Pending'}
                                    </span>
                                  )
                                )}
                              </div>
                            )}
                            {!n.isReadUnified && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(n.id);
                                }}
                                className="mt-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline"
                              >
                                {language === 'bn' ? 'পঠিত হিসেবে চিহ্নিত করুন' : 'Mark as read'}
                              </button>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(n.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 transition-all rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 bg-slate-50/50 border-t border-slate-100">
                  <button
                    onClick={clearAll}
                    className="w-full py-2 text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-[0.1em] flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-3 h-3" />
                    {language === 'bn' ? 'সব মুছে ফেলুন' : 'Clear All Notifications'}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
