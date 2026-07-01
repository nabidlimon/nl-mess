import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, orderBy, where, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BazarCost, Member } from '../types';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
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
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 font-display">{t('bazar.title')}</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">{t('bazar.subtitle')}</p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="bg-blue-50 border border-blue-100 px-5 py-3 rounded-2xl shadow-sm flex-1 sm:flex-none">
            <span className="text-[10px] text-blue-600 font-black uppercase tracking-wider block">{t('bazar.category')}</span>
            <span className="text-2xl font-black text-blue-900 font-display mt-0.5 block">{currentMonthTotal.toFixed(2)} {t('common.currency')}</span>
          </div>
          {isAdmin && (
            <button 
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="bg-blue-600 text-white px-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all duration-150 cursor-pointer text-sm font-bold shadow-md shadow-blue-600/10 active:scale-[0.98] h-full"
            >
              <Plus className="w-4 h-4" /> {t('bazar.add_cost')}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-350 transition-colors shadow-sm max-w-md">
        <Search className="w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search by date or buyer..." 
          className="border-none bg-transparent focus:ring-0 w-full outline-none text-sm text-slate-800 placeholder-slate-400 font-semibold"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <th className="px-6 py-3">{t('bazar.table_date')}</th>
                <th className="px-6 py-3">{t('bazar.table_buyer')}</th>
                <th className="px-6 py-3">{t('bazar.table_total')}</th>
                <th className="px-6 py-3">Total Meals</th>
                <th className="px-6 py-3">Meal Rate</th>
                <th className="px-6 py-3">{language === 'bn' ? 'আপডেট' : 'Modified'}</th>
                {isAdmin && <th className="px-6 py-3 text-right">{t('common.actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={isAdmin ? 7 : 6} className="px-6 py-4 text-center text-sm text-slate-500">{t('common.loading')}</td></tr>
              ) : filteredCosts.length === 0 ? (
                <tr><td colSpan={isAdmin ? 7 : 6} className="px-6 py-4 text-center text-sm text-slate-500">{t('bazar.empty')}</td></tr>
              ) : filteredCosts.map(cost => {
                const dayMeals = getMealsForDay(cost.date);
                const mealRate = dayMeals > 0 ? (cost.totalPrice / dayMeals).toFixed(2) : '0.00';
                return (
                <tr key={cost.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3 font-mono text-sm text-slate-500">{cost.date}</td>
                  <td className="px-6 py-3 text-sm font-medium text-slate-900">{getMemberName(cost.purchasedBy)}</td>
                  <td className="px-6 py-3 font-mono text-sm font-bold text-slate-900">{cost.totalPrice} {t('common.currency')}</td>
                  <td className="px-6 py-3 font-mono text-sm text-slate-500">{dayMeals}</td>
                  <td className="px-6 py-3 font-mono text-sm font-bold text-blue-600">{mealRate} {t('common.currency')}</td>
                  <td className="px-6 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">{(cost as any).updatedAt ? format((cost as any).updatedAt.toDate(), 'yy-MM-dd HH:mm') : '-'}</td>
                  {isAdmin && (
                    <td className="px-6 py-3 text-right whitespace-nowrap">
                      <button onClick={() => openEditModal(cost)} className="text-blue-600 hover:text-blue-800 transition-colors mx-2 p-1"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(cost.id)} className="text-slate-400 hover:text-red-600 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  )}
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">{editingCost ? t('bazar.submit') : t('bazar.add_cost')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('bazar.table_date')} *</label>
                  <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border-gray-300 rounded-lg shadow-sm px-3 py-2 border focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('bazar.table_total')} *</label>
                  <input required type="number" step="0.01" min="0" value={formData.totalPrice || ''} onChange={e => setFormData({...formData, totalPrice: parseFloat(e.target.value) || 0})} className="w-full border-gray-300 rounded-lg shadow-sm px-3 py-2 border focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('bazar.buyer')}</label>
                  <select required value={formData.purchasedBy} onChange={e => setFormData({...formData, purchasedBy: e.target.value})} className="w-full border-gray-300 rounded-lg shadow-sm px-3 py-2 border focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">{t('deposits.choose_member')}</option>
                    {members.map(m => (
                       <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">{t('onboarding.back')}</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none">{t('bazar.submit')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
