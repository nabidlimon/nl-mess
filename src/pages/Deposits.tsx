import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Deposit, Member } from '../types';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
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
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 font-display">{t('deposits.title')}</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">{t('deposits.subtitle')}</p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="bg-emerald-50 border border-emerald-100 px-5 py-3 rounded-2xl shadow-sm flex-1 sm:flex-none">
            <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider block">{t('deposits.table_amount')}</span>
            <span className="text-2xl font-black text-emerald-800 font-display mt-0.5 block">{totalAmount.toFixed(2)} {t('common.currency')}</span>
          </div>
          {isAdmin && (
            <button 
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="bg-blue-600 text-white px-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all duration-150 cursor-pointer text-sm font-bold shadow-md shadow-blue-600/10 active:scale-[0.98] h-full"
            >
              <Plus className="w-4 h-4" /> {t('deposits.record_title')}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-350 transition-colors shadow-sm max-w-md">
        <Search className="w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          placeholder={`${t('deposits.table_member')}...`} 
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
                <th className="px-6 py-3">{t('deposits.table_date')}</th>
                <th className="px-6 py-3">{t('deposits.table_member')}</th>
                <th className="px-6 py-3">{t('deposits.table_amount')}</th>
                <th className="px-6 py-3">{t('deposits.table_method')}</th>
                <th className="px-6 py-3">{t('deposits.notes')}</th>
                <th className="px-6 py-3">{language === 'bn' ? 'আপডেট' : 'Modified'}</th>
                {isAdmin && <th className="px-6 py-3 text-right">{t('common.actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={isAdmin ? 7 : 6} className="px-6 py-4 text-center text-sm text-slate-500">{t('common.loading')}</td></tr>
              ) : filteredDeposits.length === 0 ? (
                <tr><td colSpan={isAdmin ? 7 : 6} className="px-6 py-4 text-center text-sm text-slate-500">{t('deposits.empty')}</td></tr>
              ) : filteredDeposits.map(deposit => (
                <tr key={deposit.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3 font-mono text-sm text-slate-500">{deposit.date}</td>
                  <td className="px-6 py-3 text-sm font-medium text-slate-900">{deposit.memberName}</td>
                  <td className="px-6 py-3 font-mono text-sm font-bold text-slate-900">{deposit.amount} {t('common.currency')}</td>
                  <td className="px-6 py-3 text-sm text-slate-500">
                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-slate-100 text-slate-600 ring-1 ring-slate-200">{deposit.paymentMethod}</span>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-500 truncate max-w-[200px]">{deposit.notes || '-'}</td>
                  <td className="px-6 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">{(deposit as any).updatedAt ? format((deposit as any).updatedAt.toDate(), 'yy-MM-dd HH:mm') : '-'}</td>
                  {isAdmin && (
                    <td className="px-6 py-3 text-right whitespace-nowrap">
                      <button onClick={() => openEditModal(deposit)} className="text-blue-600 hover:text-blue-800 transition-colors mx-2 p-1"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(deposit.id)} className="text-slate-400 hover:text-red-600 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">{editingDeposit ? t('deposits.submit') : t('deposits.record_title')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('deposits.member')} *</label>
                <select required value={formData.memberId} onChange={e => setFormData({...formData, memberId: e.target.value})} className="w-full border-gray-300 rounded-lg shadow-sm px-3 py-2 border focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="" disabled>{t('deposits.choose_member')}</option>
                  {members.map(m => (
                     <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('deposits.table_amount')} *</label>
                  <input required min="1" type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} className="w-full border-gray-300 rounded-lg shadow-sm px-3 py-2 border focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('deposits.table_date')} *</label>
                  <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border-gray-300 rounded-lg shadow-sm px-3 py-2 border focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('deposits.payment_method')}</label>
                <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="w-full border-gray-300 rounded-lg shadow-sm px-3 py-2 border focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="Cash">{t('deposits.cash')}</option>
                  <option value="Bank">{t('deposits.bank')}</option>
                  <option value="Mobile Banking">Mobile Banking (bKash/Nagad)</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('deposits.notes')}</label>
                <textarea rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full border-gray-300 rounded-lg shadow-sm px-3 py-2 border focus:ring-indigo-500 focus:border-indigo-500" placeholder={`${t('deposits.notes')}...`}></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none">{t('onboarding.back')}</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">{t('deposits.submit')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
