import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Deposit, Member } from '../types';
import { Plus, Edit2, Trash2, Search, X, Wallet, DollarSign, Calendar, User, FileText, Landmark } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useMonth } from '../contexts/MonthContext';

export default function Deposits() {
  const { currentMess, userProfile, isSupreme } = useAuth();
  const { t, language } = useLanguage();
  const { selectedMonth } = useMonth();
  const isAdmin = userProfile?.role === 'Manager' || userProfile?.role === 'MealManager' || isSupreme;
  const [deposits, setDeposits] = useState<(Deposit & { memberName?: string })[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const getDefaultDate = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return today.startsWith(selectedMonth) ? today : `${selectedMonth}-01`;
  };

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<Deposit | null>(null);
  const [formData, setFormData] = useState({ memberId: '', amount: 0, paymentMethod: 'Cash', notes: '', date: getDefaultDate() });

  useEffect(() => {
    if (!currentMess) {
      setLoading(false);
      return;
    }
    // Fetch members for matching names
    const unsubMembers = onSnapshot(query(collection(db, 'users'), where('messId', '==', currentMess.id), where('role', 'in', ['Manager', 'Border', 'MealManager'])), (snapshot) => {
      const parts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
      setMembers(parts);
    }, (error) => {
      console.warn("unsubMembers onSnapshot error:", error);
    });

    const unsubDeposits = onSnapshot(query(collection(db, 'deposits'), where('messId', '==', currentMess.id)), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deposit));
      data.sort((a, b) => a.date.localeCompare(b.date));
      setDeposits(data);
      setLoading(false);
    }, (error) => {
      console.warn("unsubDeposits onSnapshot error:", error);
      setLoading(false);
    });

    return () => { unsubMembers(); unsubDeposits(); };
  }, [currentMess]);

  let depositsWithNames = deposits.map(d => ({
    ...d,
    memberName: members.find(m => m.id === d.memberId)?.name || 'Unknown'
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      if (editingDeposit) {
        await updateDoc(doc(db, 'deposits', editingDeposit.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'deposits'), {
          ...formData,
          messId: currentMess?.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving deposit", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (confirm('Are you sure you want to delete this deposit?')) {
      try {
        await deleteDoc(doc(db, 'deposits', id));
      } catch (error) {
        console.error("Error deleting deposit", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ memberId: '', amount: 0, paymentMethod: 'Cash', notes: '', date: getDefaultDate() });
    setEditingDeposit(null);
  };

  const openEditModal = (deposit: Deposit) => {
    setEditingDeposit(deposit);
    setFormData({ memberId: deposit.memberId, amount: deposit.amount, paymentMethod: deposit.paymentMethod || 'Cash', notes: deposit.notes || '', date: deposit.date });
    setIsModalOpen(true);
  };

  const filteredDeposits = depositsWithNames.filter(d => 
    d.date.startsWith(selectedMonth) &&
    (d.memberName.toLowerCase().includes(search.toLowerCase()) || 
    d.date.includes(search))
  );

  const totalAmount = filteredDeposits.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Premium Hero Stats Banner */}
      <div className="bg-gradient-to-r from-blue-750 via-indigo-850 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-indigo-900/10 relative overflow-hidden">
        {/* Subtle grid decoration */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                <Wallet className="w-6 h-6 text-blue-200" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white font-display">
                {t('deposits.title')}
              </h1>
            </div>
            <p className="text-blue-100 text-sm mt-2 max-w-xl leading-relaxed font-medium">
              {t('deposits.subtitle')}
            </p>
          </div>
          
          {isAdmin && (
            <button 
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="bg-white text-indigo-900 px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-50 transition-all duration-150 cursor-pointer text-sm font-bold shadow-lg shadow-black/10 active:scale-[0.98] w-full md:w-auto self-stretch md:self-auto h-fit"
            >
              <Plus className="w-4 h-4 text-indigo-900 stroke-[3]" /> {t('deposits.record_title')}
            </button>
          )}
        </div>

        {/* Stats Grid inside Hero Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/15 relative z-10">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider block">{t('deposits.table_amount')}</span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-3xl font-black text-white font-display tracking-tight">
                {totalAmount.toFixed(2)}
              </span>
              <span className="text-xs font-semibold text-blue-200">{t('common.currency')}</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider block">
              {language === 'bn' ? 'গড় ডিপোজিট' : 'Average Deposit'}
            </span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-3xl font-black text-white font-display tracking-tight">
                {filteredDeposits.length > 0 ? (totalAmount / filteredDeposits.length).toFixed(2) : '0.00'}
              </span>
              <span className="text-xs font-semibold text-blue-200">{t('common.currency')}</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider block">
              {language === 'bn' ? 'মোট লেনদেন সংখ্যা' : 'Total Deposits'}
            </span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-3xl font-black text-white font-display tracking-tight">
                {filteredDeposits.length}
              </span>
              <span className="text-xs font-semibold text-blue-200">{language === 'bn' ? 'টি' : 'records'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Filter Controls */}
      <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-xs max-w-md focus-within:ring-2 focus-within:ring-blue-600/20 focus-within:border-blue-600 transition-all">
        <Search className="w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder={`${t('deposits.table_member')} or date...`} 
          className="border-none bg-transparent focus:ring-0 w-full outline-none text-sm text-slate-800 placeholder-slate-400 font-bold"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Transactions Table Card Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="px-6 py-4"><span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{t('deposits.table_date')}</span></th>
                <th className="px-6 py-4"><span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{t('deposits.table_member')}</span></th>
                <th className="px-6 py-4"><span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" />{t('deposits.table_amount')}</span></th>
                <th className="px-6 py-4"><span className="flex items-center gap-1.5"><Landmark className="w-3.5 h-3.5" />{t('deposits.table_method')}</span></th>
                <th className="px-6 py-4"><span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />{t('deposits.notes')}</span></th>
                <th className="px-6 py-4">{language === 'bn' ? 'আপডেট সময়' : 'Last Updated'}</th>
                {isAdmin && <th className="px-6 py-4 text-right">{t('common.actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center text-sm text-slate-400 font-semibold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      {t('common.loading')}
                    </div>
                  </td>
                </tr>
              ) : filteredDeposits.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-16 text-center text-sm text-slate-400 font-semibold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Wallet className="w-12 h-12 text-slate-300 stroke-[1.5] mb-1" />
                      {t('deposits.empty')}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDeposits.map(deposit => {
                  const method = deposit.paymentMethod || 'Cash';
                  let methodBadgeColor = 'bg-slate-50 text-slate-700 ring-slate-100';
                  if (method.toLowerCase().includes('cash')) methodBadgeColor = 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-900/30';
                  if (method.toLowerCase().includes('mobile') || method.toLowerCase().includes('bkash') || method.toLowerCase().includes('nagad') || method.toLowerCase().includes('rocket')) methodBadgeColor = 'bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:ring-rose-900/30';
                  if (method.toLowerCase().includes('bank')) methodBadgeColor = 'bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:ring-blue-900/30';

                  return (
                    <tr key={deposit.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/10 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{deposit.date}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-slate-200">{deposit.memberName}</td>
                      <td className="px-6 py-4 font-mono text-sm font-black text-indigo-700 dark:text-indigo-400">{deposit.amount.toFixed(2)} {t('common.currency')}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg ring-1 ${methodBadgeColor}`}>
                          {method}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{deposit.notes || '-'}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        {(deposit as any).updatedAt ? format((deposit as any).updatedAt.toDate(), 'yy-MM-dd HH:mm') : '-'}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1.5">
                            <button 
                              onClick={() => openEditModal(deposit)} 
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 p-2 rounded-lg transition-colors cursor-pointer"
                              title="Edit record"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(deposit.id)} 
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
                {editingDeposit ? (language === 'bn' ? 'ডিপোজিট সংশোধন' : 'Modify Deposit') : t('deposits.record_title')}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('deposits.member')} *</label>
                <select 
                  required 
                  value={formData.memberId} 
                  onChange={e => setFormData({...formData, memberId: e.target.value})} 
                  className="w-full border-slate-200/80 rounded-xl shadow-xs px-3.5 py-2.5 border text-sm font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                >
                  <option value="" disabled>{t('deposits.choose_member')}</option>
                  {members.map(m => (
                     <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('deposits.table_amount')} *</label>
                  <input 
                    required 
                    min="1" 
                    type="number" 
                    value={formData.amount || ''} 
                    onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} 
                    className="w-full border-slate-200/80 rounded-xl shadow-xs px-3.5 py-2.5 border text-sm font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('deposits.table_date')} *</label>
                  <input 
                    required 
                    type="date" 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})} 
                    className="w-full border-slate-200/80 rounded-xl shadow-xs px-3.5 py-2.5 border text-sm font-mono font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('deposits.payment_method')}</label>
                <select 
                  value={formData.paymentMethod} 
                  onChange={e => setFormData({...formData, paymentMethod: e.target.value})} 
                  className="w-full border-slate-200/80 rounded-xl shadow-xs px-3.5 py-2.5 border text-sm font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                >
                  <option value="Cash">{t('deposits.cash')}</option>
                  <option value="Bank">{t('deposits.bank')}</option>
                  <option value="Mobile Banking">Mobile Banking (bKash/Nagad)</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('deposits.notes')}</label>
                <textarea 
                  rows={2} 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                  className="w-full border-slate-200/80 rounded-xl shadow-xs px-3.5 py-2.5 border text-sm text-slate-800 placeholder-slate-400 bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all" 
                  placeholder={`${t('deposits.notes')}...`}
                />
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
                  className="px-5 py-2.5 rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none font-bold text-sm cursor-pointer shadow-md shadow-blue-600/10 transition-colors"
                >
                  {t('deposits.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
