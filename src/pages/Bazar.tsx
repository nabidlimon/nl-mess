import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, orderBy, where, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BazarCost, Member } from '../types';
import { Plus, Edit2, Trash2, Search, X, ShoppingCart, DollarSign, Calendar, User, TrendingUp, UtensilsCrossed, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useMonth } from '../contexts/MonthContext';

export default function Bazar() {
  const { currentMess, userProfile, isSupreme } = useAuth();
  const { t, language } = useLanguage();
  const { selectedMonth } = useMonth();
  const isAdmin = userProfile?.role === 'Manager' || userProfile?.role === 'MealManager' || isSupreme;
  const [costs, setCosts] = useState<BazarCost[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const getDefaultDate = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return today.startsWith(selectedMonth) ? today : `${selectedMonth}-01`;
  };
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<BazarCost | null>(null);
  const [formData, setFormData] = useState({ totalPrice: 0, purchasedBy: '', date: getDefaultDate() });

  useEffect(() => {
    if (!currentMess) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'bazarCosts'), where('messId', '==', currentMess.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BazarCost));
      data.sort((a, b) => a.date.localeCompare(b.date));
      setCosts(data);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching bazar costs:', error);
      setLoading(false);
    });

    const mQ = query(collection(db, 'users'), where('messId', '==', currentMess.id), where('role', 'in', ['Border', 'MealManager']));
    const mUnsubscribe = onSnapshot(mQ, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
      setMembers(data);
    }, (error) => {
      console.warn("mUnsubscribe onSnapshot error:", error);
    });

    const mealsUnsubscribe = onSnapshot(query(collection(db, 'meals'), where('messId', '==', currentMess.id)), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMeals(data);
    }, (error) => {
      console.warn("mealsUnsubscribe onSnapshot error:", error);
    });

    return () => { unsubscribe(); mUnsubscribe(); mealsUnsubscribe(); };
  }, [currentMess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      if (editingCost) {
        await updateDoc(doc(db, 'bazarCosts', editingCost.id), {
          ...formData, // has totalPrice, purchasedBy, date
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'bazarCosts'), {
          ...formData, // has totalPrice, purchasedBy, date
          itemName: 'Daily Bazar',
          category: 'General',
          quantity: 1,
          unitPrice: formData.totalPrice,
          messId: currentMess?.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Broadcast notifications to active members
        const buyerName = getMemberName(formData.purchasedBy);
        const batch = writeBatch(db);
        const notifyTargets = members.filter(m => m.id !== userProfile?.id);

        notifyTargets.forEach(m => {
          const notifRef = doc(collection(db, 'notifications'));
          batch.set(notifRef, {
            id: notifRef.id,
            messId: currentMess?.id,
            title: language === 'bn' ? 'নতুন বাজার খরচ যুক্ত হয়েছে' : 'New Bazar Cost Logged',
            message: language === 'bn' 
              ? `${buyerName} এর নামে নতুন বাজার খরচ (${formData.totalPrice} টাকা) নথিভূক্ত হয়েছে (${formData.date})।`
              : `A new bazar expense of ${formData.totalPrice} logged under ${buyerName} (${formData.date}).`,
            type: 'BazarUpdate',
            read: false,
            createdAt: serverTimestamp()
          });
        });
        await batch.commit();
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving cost", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        await deleteDoc(doc(db, 'bazarCosts', id));
      } catch (error) {
        console.error("Error deleting cost", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ totalPrice: 0, purchasedBy: members[0]?.id || '', date: getDefaultDate() });
    setEditingCost(null);
  };

  const openEditModal = (cost: BazarCost) => {
    setEditingCost(cost);
    setFormData({ totalPrice: cost.totalPrice, purchasedBy: cost.purchasedBy, date: cost.date });
    setIsModalOpen(true);
  };

  const filteredCosts = costs.filter(c => c.date.startsWith(selectedMonth) && (c.date.includes(search) || getMemberName(c.purchasedBy).toLowerCase().includes(search.toLowerCase())));
  
  const getMealsForDay = (date: string) => {
    const activeMembers = members.filter(m => m.status === 'Active');
    let total = 0;
    activeMembers.forEach(member => {
      const exact = meals.find(m => m.memberId === member.id && m.date === date);
      if (exact) {
        total += exact.mealCount || 0;
      } else {
        const latest = meals
          .filter(m => m.memberId === member.id && m.date < date)
          .sort((a, b) => b.date.localeCompare(a.date))[0];
        if (latest) {
          total += latest.mealCount || 0;
        }
      }
    });
    return total;
  };

  const currentMonthTotal = costs
    .filter(c => c.date.startsWith(selectedMonth))
    .reduce((sum, c) => sum + c.totalPrice, 0);

  const getMemberName = (id: string) => {
    return members.find(m => m.id === id)?.name || id;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Premium Hero Stats Banner */}
      <div className="bg-gradient-to-r from-rose-700 via-pink-850 to-rose-950 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-rose-900/10 relative overflow-hidden">
        {/* Subtle grid decoration */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                <ShoppingCart className="w-6 h-6 text-rose-200" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white font-display">
                {t('bazar.title')}
              </h1>
            </div>
            <p className="text-rose-100 text-sm mt-2 max-w-xl leading-relaxed font-medium">
              {t('bazar.subtitle')}
            </p>
          </div>
          
          {isAdmin && (
            <button 
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="bg-white text-rose-950 px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-rose-50 transition-all duration-150 cursor-pointer text-sm font-bold shadow-lg shadow-black/10 active:scale-[0.98] w-full md:w-auto self-stretch md:self-auto h-fit"
            >
              <Plus className="w-4 h-4 text-rose-95 stroke-[3]" /> {t('bazar.add_cost')}
            </button>
          )}
        </div>

        {/* Stats Grid inside Hero Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/15 relative z-10">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] text-rose-200 font-bold uppercase tracking-wider block">{t('bazar.category')}</span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-3xl font-black text-white font-display tracking-tight">
                {currentMonthTotal.toFixed(2)}
              </span>
              <span className="text-xs font-semibold text-rose-200">{t('common.currency')}</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] text-rose-200 font-bold uppercase tracking-wider block">
              {language === 'bn' ? 'গড় বাজার খরচ' : 'Average Purchase'}
            </span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-3xl font-black text-white font-display tracking-tight">
                {filteredCosts.length > 0 ? (currentMonthTotal / filteredCosts.length).toFixed(2) : '0.00'}
              </span>
              <span className="text-xs font-semibold text-rose-200">{t('common.currency')}</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] text-rose-200 font-bold uppercase tracking-wider block">
              {language === 'bn' ? 'বাজার এন্ট্রি সংখ্যা' : 'Bazar Logs Count'}
            </span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-3xl font-black text-white font-display tracking-tight">
                {filteredCosts.length}
              </span>
              <span className="text-xs font-semibold text-rose-200">{language === 'bn' ? 'বার' : 'entries'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Filter Controls */}
      <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-xs max-w-md focus-within:ring-2 focus-within:ring-rose-600/20 focus-within:border-rose-600 transition-all">
        <Search className="w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search by date or buyer..." 
          className="border-none bg-transparent focus:ring-0 w-full outline-none text-sm text-slate-800 placeholder-slate-400 font-bold"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Bazar Costs Table Card Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="px-6 py-4"><span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{t('bazar.table_date')}</span></th>
                <th className="px-6 py-4"><span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{t('bazar.table_buyer')}</span></th>
                <th className="px-6 py-4"><span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" />{t('bazar.table_total')}</span></th>
                <th className="px-6 py-4"><span className="flex items-center gap-1.5"><UtensilsCrossed className="w-3.5 h-3.5" />Total Meals</span></th>
                <th className="px-6 py-4"><span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" />Meal Rate</span></th>
                <th className="px-6 py-4">{language === 'bn' ? 'আপডেট সময়' : 'Last Updated'}</th>
                {isAdmin && <th className="px-6 py-4 text-right">{t('common.actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center text-sm text-slate-400 font-semibold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                      {t('common.loading')}
                    </div>
                  </td>
                </tr>
              ) : filteredCosts.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-16 text-center text-sm text-slate-400 font-semibold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShoppingCart className="w-12 h-12 text-slate-300 stroke-[1.5] mb-1" />
                      {t('bazar.empty')}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCosts.map(cost => {
                  const dayMeals = getMealsForDay(cost.date);
                  const mealRate = dayMeals > 0 ? (cost.totalPrice / dayMeals).toFixed(2) : '0.00';

                  return (
                    <tr key={cost.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/10 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{cost.date}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-slate-200">{getMemberName(cost.purchasedBy)}</td>
                      <td className="px-6 py-4 font-mono text-sm font-black text-rose-700 dark:text-rose-400">{cost.totalPrice.toFixed(2)} {t('common.currency')}</td>
                      <td className="px-6 py-4 font-mono text-sm text-slate-600 dark:text-slate-400">{dayMeals}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:ring-blue-900/30">
                          {mealRate} {t('common.currency')}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        {(cost as any).updatedAt ? format((cost as any).updatedAt.toDate(), 'yy-MM-dd HH:mm') : '-'}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1.5">
                            <button 
                              onClick={() => openEditModal(cost)} 
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 p-2 rounded-lg transition-colors cursor-pointer"
                              title="Edit record"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(cost.id)} 
                              className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 p-2 rounded-lg transition-colors cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Redesigned Modal Form Sheet */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 transform scale-100 transition-all duration-300">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 font-display">
                {editingCost ? (language === 'bn' ? 'খরচ সংশোধন' : 'Modify Expense') : t('bazar.add_cost')}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('bazar.table_date')} *</label>
                  <input 
                    required 
                    type="date" 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})} 
                    className="w-full border-slate-200/80 rounded-xl shadow-xs px-3.5 py-2.5 border text-sm font-mono font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('bazar.table_total')} *</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    value={formData.totalPrice || ''} 
                    onChange={e => setFormData({...formData, totalPrice: parseFloat(e.target.value) || 0})} 
                    className="w-full border-slate-200/80 rounded-xl shadow-xs px-3.5 py-2.5 border text-sm font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('bazar.buyer')} *</label>
                  <select 
                    required 
                    value={formData.purchasedBy} 
                    onChange={e => setFormData({...formData, purchasedBy: e.target.value})} 
                    className="w-full border-slate-200/80 rounded-xl shadow-xs px-3.5 py-2.5 border text-sm font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                  >
                    <option value="" disabled>{t('deposits.choose_member')}</option>
                    {members.map(m => (
                       <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4.5 py-2.5 border border-slate-200 rounded-xl text-slate-700 bg-white hover:bg-slate-50 focus:outline-none font-bold text-sm cursor-pointer transition-colors"
                >
                  {t('onboarding.back')}
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 rounded-xl text-white bg-rose-600 hover:bg-rose-700 focus:outline-none font-bold text-sm cursor-pointer shadow-md shadow-rose-600/10 transition-colors"
                >
                  {t('bazar.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
