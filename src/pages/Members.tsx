import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, doc, updateDoc, deleteDoc, serverTimestamp, setDoc, getDocs, getDoc, writeBatch, orderBy, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, Member } from '../types';
import { Plus, Edit2, Trash2, Search, X, Check, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useGamification } from '../hooks/useGamification';

export default function Members() {
  const { currentMess, userProfile, isSupreme } = useAuth();
  const { t, language } = useLanguage();
  const { badges } = useGamification();
  const isMessManager = (currentMess?.managerIds || []).includes(userProfile?.id || '');
  const isAdmin = isMessManager || isSupreme;
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState<{ name: string; phone: string; room: string; status: 'Active' | 'Inactive' | 'Pending' }>({ name: '', phone: '', room: '', status: 'Active' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!currentMess) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, 'users'), 
      where('messId', '==', currentMess.id),
      where('role', 'in', ['Manager', 'Border', 'MealManager'])
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
      data.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });
      setMembers(data);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching members:', error);
      setLoading(false);
    });
    return unsubscribe;
  }, [currentMess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      if (editingMember) {
        await updateDoc(doc(db, 'users', editingMember.id), {
          name: formData.name,
          phone: formData.phone,
          room: formData.room,
          status: formData.status,
          updatedAt: serverTimestamp()
        });
        setIsModalOpen(false);
        resetForm();
      } else {
        const cleanName = formData.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        // Check if clean name is unique to prevent email collision
        const existingName = members.find(m => m.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanName);
        if (existingName) {
           setFormError('A border with a very similar name already exists. Please make it more unique.');
           return;
        }

        const userRef = doc(collection(db, 'users'));
        const newUid = userRef.id;

        await setDoc(userRef, {
          id: newUid,
          role: 'Border',
          messId: currentMess?.id,
          name: formData.name,
          phone: formData.phone,
          room: formData.room,
          status: 'Pending',
          isRegistered: false, // Start as unregistered
          createdAt: new Date().toISOString(),
          updatedAt: serverTimestamp()
        });
        
        setIsModalOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error saving member", error);
      setFormError('An unexpected error occurred.');
    }
  };

  const handleApprove = async (id: string) => {
     try {
       // if manager approves, then the border is fully active
       await updateDoc(doc(db, 'users', id), { status: 'Active' });

       // Send notification to the user
       await addDoc(collection(db, 'notifications'), {
         userId: id,
         messId: currentMess?.id,
         title: language === 'bn' ? 'অ্যাকাউন্ট অ্যাপ্রুভ হয়েছে' : 'Account Approved',
         message: language === 'bn' 
           ? `আপনার মেসে ভর্তির আবেদন মঞ্জুর করা হয়েছে। এখন আপনি ড্যাশবোর্ড ব্যবহার করতে পারবেন।` 
           : `Your request to join the mess has been approved. You can now access the dashboard.`,
         type: 'approval',
         read: false,
         createdAt: serverTimestamp()
       });
     } catch(err) {
       console.error("Error approving member", err);
     }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to completely remove this member and all their records from the mess? This action cannot be undone.')) {
      try {
        // Delete all associated meals
        const mealsQuery = query(collection(db, 'meals'), where('memberId', '==', id));
        const mealsSnap = await getDocs(mealsQuery);
        if (!mealsSnap.empty) {
          const mealsBatch = writeBatch(db);
          mealsSnap.docs.forEach(d => mealsBatch.delete(d.ref));
          await mealsBatch.commit();
        }

        // Delete all associated deposits
        const depsQuery = query(collection(db, 'deposits'), where('memberId', '==', id));
        const depsSnap = await getDocs(depsQuery);
        if (!depsSnap.empty) {
          const depsBatch = writeBatch(db);
          depsSnap.docs.forEach(d => depsBatch.delete(d.ref));
          await depsBatch.commit();
        }

        // Finally delete the user doc
        await deleteDoc(doc(db, 'users', id));
      } catch (error) {
        console.error("Error deleting member", error);
        alert("Failed to delete member records. Check permissions or network.");
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', room: '', status: 'Active' });
    setEditingMember(null);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setFormData({ name: member.name, phone: member.phone || '', room: member.room || '', status: (member.status as 'Active' | 'Inactive' | 'Pending') || 'Active' });
    setIsModalOpen(true);
  };

  const filteredMembers = members.filter(m => (m.name || '').toLowerCase().includes((search || '').toLowerCase()));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 font-display">{t('nav.members')}</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">{t('members.subtitle')}</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="bg-blue-600 text-white px-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all duration-150 cursor-pointer text-sm font-bold shadow-md shadow-blue-600/10 active:scale-[0.98] w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> {t('members.add_member')}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-sm max-w-md">
        <Search className="w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          placeholder={`${t('nav.members')}...`} 
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
                <th className="px-6 py-3">{t('members.name')}</th>
                <th className="px-6 py-3">{t('members.room')}</th>
                <th className="px-6 py-3">{t('members.phone')}</th>
                <th className="px-6 py-3">{t('members.institution')}</th>
                <th className="px-6 py-3">{t('common.status')}</th>
                <th className="px-6 py-3 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-500">{t('common.loading')}</td></tr>
              ) : filteredMembers.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-500">{t('members.no_active')}</td></tr>
              ) : filteredMembers.map(member => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3">
                     <span className="text-sm font-medium text-slate-900">{member.name}</span>
                     {badges[member.id] && badges[member.id].length > 0 && (
                        <div className="flex gap-1 mt-1">
                           {badges[member.id].map(b => (
                              <span key={b} className="px-1.5 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded text-[9px] font-bold">
                                 {b}
                              </span>
                           ))}
                        </div>
                     )}
                  </td>
                  <td className="px-6 py-3 font-mono text-sm text-slate-500">{member.room || '-'}</td>
                  <td className="px-6 py-3 font-mono text-sm text-slate-500">{member.phone || '-'}</td>
                  <td className="px-6 py-3 text-sm text-slate-500">{member.institution || '-'}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 inline-flex text-[10px] uppercase tracking-wider font-bold rounded ${
                      member.status === 'Active' ? 'bg-green-100 text-green-700 ring-1 ring-green-200' :
                      member.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200' :
                      'bg-red-100 text-red-700 ring-1 ring-red-200'
                    }`}>
                      {member.status === 'Active' ? t('common.approved') : member.status === 'Pending' ? t('common.pending') : member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    {isAdmin && (
                      <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                        {member.status === 'Pending' && (
                           <button onClick={() => handleApprove(member.id)} className="text-emerald-700 hover:text-emerald-900 transition-colors p-1.5 bg-emerald-100 hover:bg-emerald-200 rounded-md" title={t('members.approve')}><Check className="w-4 h-4" /></button>
                        )}
                        <button 
                          onClick={async () => {
                            const isCurrentlyManagerOfThisMess = (currentMess?.managerIds || []).includes(member.id);
                            if (window.confirm(`Are you sure you want to ${isCurrentlyManagerOfThisMess ? 'remove' : 'make'} this member as Manager of this mess?`)) {
                              try {
                                if (currentMess) {
                                  const messRef = doc(db, 'messes', currentMess.id);
                                  const existingManagers = currentMess.managerIds || [];
                                  let newManagers;
                                  
                                  const userRef = doc(db, 'users', member.id);
                                  const userSnap = await getDoc(userRef);
                                  const userData = userSnap.exists() ? userSnap.data() : member;
                                  const existingMessIds = (userData as any).messIds || [];

                                  if (isCurrentlyManagerOfThisMess) {
                                    newManagers = existingManagers.filter(id => id !== member.id);
                                    
                                    // If we are revoking, check if they manage anything else
                                    const otherMessesQuery = query(collection(db, 'messes'), 
                                      where('managerIds', 'array-contains', member.id)
                                    );
                                    const otherMessesSnap = await getDocs(otherMessesQuery);
                                    // We haven't updated this current mess document yet in the DB.
                                    // otherMessesSnap includes the current mess they are being removed from.
                                    // So if size > 1, they still manage something else.
                                    const stillManagesOther = otherMessesSnap.size > 1;

                                    await updateDoc(userRef, { 
                                      role: stillManagesOther ? 'Manager' : 'Border' 
                                    });
                                  } else {
                                    newManagers = Array.from(new Set([...existingManagers, member.id]));
                                    await updateDoc(userRef, { 
                                      role: 'Manager',
                                      messIds: Array.from(new Set([...existingMessIds, currentMess.id]))
                                    });
                                  }
                                  await updateDoc(messRef, { managerIds: newManagers });
                                }
                              } catch(e) {
                                console.error("Error toggling manager:", e);
                              }
                            }
                          }}
                          className={`transition-all p-1.5 px-2 text-xs font-bold rounded-md border ${(currentMess?.managerIds || []).includes(member.id) ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                          title="Toggle Manager"
                        >
                           {(currentMess?.managerIds || []).includes(member.id) ? 'Revoke Manager' : 'Make Manager'}
                        </button>
                        <button 
                          onClick={async () => {
                            if (window.confirm(`Are you sure you want to ${member.role === 'MealManager' ? 'remove' : 'make'} this member as Meal Manager?`)) {
                              try {
                                await updateDoc(doc(db, 'users', member.id), { role: member.role === 'MealManager' ? 'Border' : 'MealManager' });
                              } catch(e) {}
                            }
                          }}
                          className={`transition-all p-1.5 px-2 text-xs font-bold rounded-md border ${member.role === 'MealManager' ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                          title="Toggle Meal Manager"
                        >
                           {member.role === 'MealManager' ? 'Revoke Meal Mgr' : 'Make Meal Mgr'}
                        </button>
                        <button onClick={() => openEditModal(member)} className="text-blue-600 hover:text-blue-800 transition-colors p-1.5 bg-blue-50 hover:bg-blue-100 rounded-md" title="Edit"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(member.id)} className="text-red-500 hover:text-red-700 transition-colors p-1.5 bg-red-50 hover:bg-red-100 rounded-md" title="Remove"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">{editingMember ? t('members.title') : t('members.add_member')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                 <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
                    {formError}
                 </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('members.name')} *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-gray-300 rounded-lg shadow-sm px-3 py-2 border focus:ring-indigo-500 focus:border-indigo-500" disabled={!!editingMember} />
                {!editingMember && <p className="text-xs text-slate-500 mt-1">Must be unique per mess.</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('members.room')}</label>
                  <input type="text" value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} className="w-full border-gray-300 rounded-lg shadow-sm px-3 py-2 border focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.status')}</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as 'Active' | 'Inactive' | 'Pending'})} className="w-full border-gray-300 rounded-lg shadow-sm px-3 py-2 border focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="Active">{t('common.approved')}</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('members.phone')}</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border-gray-300 rounded-lg shadow-sm px-3 py-2 border focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none">{t('onboarding.back')}</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">{editingMember ? t('members.update_room') : t('members.add_member')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
