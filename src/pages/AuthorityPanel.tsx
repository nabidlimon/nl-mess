import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, doc, writeBatch, updateDoc, deleteDoc, where, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Mess, Member, Meal, Deposit, BazarCost } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Crown, ShieldAlert, CheckCircle, RefreshCcw, 
  Trash2, Edit, Home, Users, Utensils, Wallet, 
  ShoppingCart, Search, X, Check, ShieldCheck, 
  User, Key, AlertTriangle, Settings, ChevronRight,
  Database, UserCheck, Eye, MapPin, Building
} from 'lucide-react';

export default function AuthorityPanel() {
  const navigate = useNavigate();
  const { userProfile, isSupreme, refreshProfile, setHasEntered } = useAuth();
  const { language } = useLanguage();

  const [messes, setMesses] = useState<Mess[]>([]);
  const [allUsers, setAllUsers] = useState<Member[]>([]);
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [allDeposits, setAllDeposits] = useState<Deposit[]>([]);
  const [allBazars, setAllBazars] = useState<BazarCost[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'messes' | 'users' | 'data'>('messes');
  
  // Detail selection states
  const [selectedMess, setSelectedMess] = useState<Mess | null>(null);
  const [selectedMessDetailTab, setSelectedMessDetailTab] = useState<'users' | 'meals' | 'deposits' | 'bazars'>('users');

  // Search & Filter state
  const [messSearch, setMessSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [dataSearch, setDataSearch] = useState('');
  const [dataSubTab, setDataSubTab] = useState<'meals' | 'deposits' | 'bazars'>('meals');

  // Modal Editing and Create states
  const [editingUser, setEditingUser] = useState<Member | null>(null);
  const [editingMess, setEditingMess] = useState<Mess | null>(null);

  // User form edits
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'Manager' | 'MealManager' | 'Border'>('Border');
  const [editStatus, setEditStatus] = useState<'Active' | 'Pending' | 'Inactive'>('Active');
  const [editRoom, setEditRoom] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editInstitution, setEditInstitution] = useState('');

  // Mess form edits
  const [editMessName, setEditMessName] = useState('');
  const [editMessBorders, setEditMessBorders] = useState(15);
  const [editMessPhone, setEditMessPhone] = useState('');
  const [editMessAddress, setEditMessAddress] = useState('');

  // New Mess Creation states
  const [isCreatingMess, setIsCreatingMess] = useState(false);
  const [newMessName, setNewMessName] = useState('');
  const [newMessManagerPhone, setNewMessManagerPhone] = useState('');
  const [newMessManagerEmail, setNewMessManagerEmail] = useState('');
  const [newMessCapacity, setNewMessCapacity] = useState(20);

  const t = (enValue: string, bnValue: string) => {
    return language === 'bn' ? bnValue : enValue;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const dbCollections = ['messes', 'users', 'meals', 'deposits', 'bazarCosts'];
      const [messesSnap, usersSnap, mealsSnap, depositsSnap, bazarsSnap] = await Promise.all([
        getDocs(query(collection(db, 'messes'))),
        getDocs(query(collection(db, 'users'))),
        getDocs(query(collection(db, 'meals'))),
        getDocs(query(collection(db, 'deposits'))),
        getDocs(query(collection(db, 'bazarCosts')))
      ]);
      
      setMesses(messesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Mess)));
      setAllUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Member)));
      setAllMeals(mealsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Meal)));
      setAllDeposits(depositsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Deposit)));
      setAllBazars(bazarsSnap.docs.map(d => ({ id: d.id, ...d.data() } as BazarCost)));
    } catch (err) {
      console.error("Error fetching admin stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSupreme) {
      fetchData();
    }
  }, [isSupreme]);

  // Deny layout for standard users
  if (!isSupreme) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[70vh] bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
        <ShieldAlert className="w-20 h-20 text-red-500 animate-bounce mb-4" />
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">{t('Access Denied', 'প্রবেশাধিকার সংরক্ষিত')}</h1>
        <p className="text-slate-500 mt-2 text-center max-w-md">
          {t('Only the supreme superadmin with email "nabidahamed2003@gmail.com" can view and manage all platform data.', 'শুধুমাত্র প্রধান সুপার-অ্যাডমিন "nabidahamed2003@gmail.com" এই প্রশাসনিক প্যানেলটি ব্যবহার করতে পারবেন।')}
        </p>
      </div>
    );
  }

  // --- ADMINISTRATOR FUNCTIONS ---

  // Approving a mess and its manager/creator
  const handleApproveMess = async (mess: Mess) => {
    if (!window.confirm(t(`Are you sure you want to approve "${mess.name}"?`, `আপনি কি নিশ্চিত যে আপনি "${mess.name}" মেসটি অনুমোদন করতে চান?`))) return;
    try {
      setActionLoading(true);
      
      // 1. Update Mess Status to Active
      await updateDoc(doc(db, 'messes', mess.id), {
        status: 'Active'
      });

      // 2. Find and update the creator/manager user doc
      const managerId = mess.managerIds?.[0];
      if (managerId) {
        const managerDocRef = doc(db, 'users', managerId);
        const managerSnap = await getDoc(managerDocRef);
        
        if (managerSnap.exists()) {
          const managerData = managerSnap.data();
          const memberships = managerData.memberships || {};
          if (memberships[mess.id]) {
            memberships[mess.id].status = 'Active';
          }
          await updateDoc(managerDocRef, {
            status: 'Active',
            memberships: memberships
          });
        } else {
          await updateDoc(managerDocRef, {
            status: 'Active'
          });
        }

        // 3. Send approval notification to manager
        await setDoc(doc(collection(db, 'notifications')), {
          userId: managerId,
          messId: mess.id,
          title: t('Mess Registration Approved!', 'মেস অনুমোদন সম্পন্ন হয়েছে!'),
          message: t(
            `Your mess "${mess.name}" registration request has been approved by the Supreme Admin. You can now access your mess workspace.`,
            `আপনার মেস "${mess.name}" খোলার আবেদন সুপ্রীম অ্যাডমিন কর্তৃক অনুমোদিত হয়েছে। এখন আপনি মেস ড্যাশবোর্ডে প্রবেশ করতে পারবেন।`
          ),
          type: 'approval',
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      alert(t('Mess successfully approved!', 'মেসটি সফলভাবে অনুমোদন করা হয়েছে!'));
      fetchData(); // Refresh list
    } catch (err) {
      console.error(err);
      alert("Failed to approve mess.");
    } finally {
      setActionLoading(false);
    }
  };

  // Entering a mess securely
  const handleEnterMess = async (messId: string) => {
    if (!userProfile) return;
    try {
      setActionLoading(true);
      const existingMessIds = userProfile.messIds || [];
      const memberships = (userProfile as any).memberships || {};
      
      // Inject Active Manager credentials for target spoofed mess
      memberships[messId] = {
        role: 'Manager',
        status: 'Active',
        room: ''
      };

      await updateDoc(doc(db, 'users', userProfile.id), {
        messId: messId,
        messIds: Array.from(new Set([...existingMessIds, messId])),
        role: 'Manager',
        status: 'Active',
        memberships: memberships
      });
      
      localStorage.setItem('hasEntered', 'true');
      setHasEntered(true);
      await refreshProfile();
      alert(t(`Masquerading as Manager for Mess ID ${messId}.`, `উক্ত মেস আইডির ম্যানেজার হিসেবে মেসে প্রবেশ করা হচ্ছে।`));
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert("Failed to spoof mess membership.");
    } finally {
      setActionLoading(false);
    }
  };

  // Modify user profile admin modal
  const openEditUser = (user: Member) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditPhone(user.phone || '');
    setEditEmail(user.email || '');
    setEditRole(user.role || 'Border');
    setEditStatus(user.status || 'Active');
    setEditRoom(user.room || '');
    setEditPin(user.plainPin || '');
    setEditInstitution(user.institution || '');
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setActionLoading(true);
      const userRef = doc(db, 'users', editingUser.id);
      const updates: any = {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
        role: editRole,
        status: editStatus,
        room: editRoom.trim(),
        plainPin: editPin.trim(),
        institution: editInstitution.trim()
      };
      
      await updateDoc(userRef, updates);
      alert(t("User updated successfully", "ব্যবহারকারী সফলভাবে আপডেট হয়েছে"));
      setEditingUser(null);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(t(`Are you absolutely SURE you want to delete user "${userName}"? This cannot be undone.`, `আপনি কি নিশ্চিতভাবে "${userName}" ব্যবহারকারীর অ্যাকাউন্টটি চিরতরে মুছে দিতে চান?`))) return;
    try {
      setActionLoading(true);
      await deleteDoc(doc(db, 'users', userId));
      alert(t("User profile deleted", "ব্যবহারকারীর অ্যাকাউন্ট মুছে ফেলা হয়েছে"));
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert("Delete failed: " + err?.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Edit Mess profile records
  const openEditMess = (mess: Mess) => {
    setEditingMess(mess);
    setEditMessName(mess.name || '');
    setEditMessBorders(mess.totalBorders || 15);
    setEditMessPhone(mess.managerPhone || '');
    setEditMessAddress(mess.location?.address || '');
  };

  const handleUpdateMess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMess) return;
    try {
      setActionLoading(true);
      const messRef = doc(db, 'messes', editingMess.id);
      await updateDoc(messRef, {
        name: editMessName.trim(),
        totalBorders: Number(editMessBorders) || 15,
        managerPhone: editMessPhone.trim(),
        'location.address': editMessAddress.trim()
      });
      alert(t("Mess updated successfully", "মেসের তথ্য সফলভাবে আপডেট হয়েছে"));
      setEditingMess(null);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateMess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessName || !newMessManagerPhone || !newMessManagerEmail) return;
    
    try {
      setActionLoading(true);
      const messRef = doc(collection(db, 'messes'));
      const newMess: Mess = {
        id: messRef.id,
        name: newMessName.trim(),
        managerIds: [], // Will be updated when manager joins or is assigned
        managerPhone: newMessManagerPhone.trim(),
        email: newMessManagerEmail.trim(),
        totalBorders: Number(newMessCapacity) || 20,
        location: { lat: 0, lng: 0, address: '' },
        photoUrl: '',
        createdAt: new Date().toISOString()
      };

      await setDoc(messRef, newMess);

      // We can also pre-create a shell user if needed, but usually onboarding handles it.
      // However, if the user already exists, we could update their messIds.
      const userQuery = query(collection(db, 'users'), where('email', '==', newMessManagerEmail.trim()));
      const userSnap = await getDocs(userQuery);
      
      if (!userSnap.empty) {
        const userId = userSnap.docs[0].id;
        const userData = userSnap.docs[0].data();
        const existingMessIds = userData.messIds || [];
        
        await updateDoc(doc(db, 'users', userId), {
          messId: messRef.id,
          messIds: Array.from(new Set([...existingMessIds, messRef.id])),
          role: 'Manager',
          status: 'Active'
        });
        await updateDoc(messRef, { managerIds: [userId] });
      }

      alert(t("Mess created successfully!", "নতুন মেস সফলভাবে তৈরি করা হয়েছে!"));
      setIsCreatingMess(false);
      // Reset form
      setNewMessName('');
      setNewMessManagerPhone('');
      setNewMessManagerEmail('');
      setNewMessCapacity(20);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert("Creation failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete individual records
  const handleDeleteRecord = async (collectionName: 'meals' | 'deposits' | 'bazarCosts', recordId: string) => {
    if (!window.confirm(t(`Are you sure you want to delete this specific ${collectionName} entry?`, `আপনি কি এই ${collectionName} এন্ট্রিটি চিরতরে মুছে ফেলতে চান?`))) return;
    try {
      setActionLoading(true);
      await deleteDoc(doc(db, collectionName, recordId));
      alert(t("Record deleted successfully", "তথ্যটি সফলভাবে মুছে ফেলা হয়েছে"));
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Wipe entire mess and everything inside it!
  const handleWipeMess = async (mess: Mess) => {
    const confirmKey = "DELETE";
    const value = window.prompt(t(
      `🚨 EXTREME DANGER ACTION 🚨\n\nThis will permanently delete the mess "${mess.name}" along with ALL its data.\n\nTo confirm, please type exactly:\n${confirmKey}`,
      `🚨 চরম বিপদজনক পদক্ষেপ 🚨\n\nউক্ত পদক্ষেপটি আপনার মেস "${mess.name}" এবং এর সংক্রান্ত সমস্ত ডাটা চিরতরে মুছে দেবে।\n\nনিশ্চিতকরণের জন্য টাইপ করুন:\n${confirmKey}`
    ));

    if (value?.trim().toUpperCase() !== confirmKey) {
      alert(t("Incorrect confirmation. Action aborted.", "সঠিক শব্দ বা বাক্য টাইপ করা হয়নি। ব্যবস্থা বাতিল করা হলো।"));
      return;
    }

    setLoading(true);
    try {
      // Fetch users, meals, deposits, bazars
      const usersSnap = await getDocs(query(collection(db, 'users'), where('messId', '==', mess.id)));
      const mealsSnap = await getDocs(query(collection(db, 'meals'), where('messId', '==', mess.id)));
      const depositsSnap = await getDocs(query(collection(db, 'deposits'), where('messId', '==', mess.id)));
      const bazarsSnap = await getDocs(query(collection(db, 'bazarCosts'), where('messId', '==', mess.id)));

      const deleteActions: Promise<any>[] = [];

      // Delete each
      usersSnap.forEach(d => deleteActions.push(deleteDoc(doc(db, 'users', d.id))));
      mealsSnap.forEach(d => deleteActions.push(deleteDoc(doc(db, 'meals', d.id))));
      depositsSnap.forEach(d => deleteActions.push(deleteDoc(doc(db, 'deposits', d.id))));
      bazarsSnap.forEach(d => deleteActions.push(deleteDoc(doc(db, 'bazarCosts', d.id))));
      
      // Delete mess itself
      deleteActions.push(deleteDoc(doc(db, 'messes', mess.id)));

      await Promise.all(deleteActions);
      alert(t(`Mess "${mess.name}" and all associated platform data have been permanently wiped!`, `মেস "${mess.name}" এবং এর সাথে সম্পর্কিত সকল ডাটা চিরতরে মুছে ফেলা হয়েছে!`));
      setSelectedMess(null);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert("Wipe failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter computation
  const filteredMesses = messes.filter(m => 
    (m.name || '').toLowerCase().includes((messSearch || '').toLowerCase()) ||
    (m.id || '').toLowerCase().includes((messSearch || '').toLowerCase()) ||
    (m.managerPhone || '').includes(messSearch || '')
  );

  const filteredUsers = allUsers.filter(u => 
    (u.name || '').toLowerCase().includes((userSearch || '').toLowerCase()) ||
    (u.email || '').toLowerCase().includes((userSearch || '').toLowerCase()) ||
    (u.phone || '').includes(userSearch || '') ||
    (u.messId || '').toLowerCase().includes((userSearch || '').toLowerCase()) ||
    (u.role || '').toLowerCase().includes((userSearch || '').toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-4 sm:px-6 lg:px-8 animate-fade-in antialiased">
      
      {/* Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-rose-950 bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-3.5 z-10">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase text-red-400">
            <Crown className="w-4 h-4 text-rose-500" /> {t('Platform Supreme Dashboard', 'প্ল্যাটফর্ম সর্বোচ্চ প্যানেল')}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-display">
            {t('Administrative Control', 'প্রশাসনিক নিয়ন্ত্রণ ড্যাশবোর্ড')}
          </h1>
          <p className="text-sm font-medium text-slate-300 max-w-xl leading-relaxed">
            {t('Oversee all mess groups, modify live profiles, audit records, delete erroneous logs, or clean/wipe whole database segments securely.', 'প্ল্যাটফর্মের সকল তথ্য পরিচালনা বা ডিলিট করার সুপার প্রশাসনিক ড্যাশবোর্ড। সতর্কতার সাথে পরিবর্তন করুন।')}
          </p>
        </div>

        <div className="flex gap-3 z-10 shrink-0">
          <button 
            onClick={fetchData}
            disabled={loading || actionLoading}
            className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl flex items-center gap-2 border border-white/10 transition active:scale-[0.98] shadow-md cursor-pointer disabled:opacity-50 text-xs"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('Sync Server', 'সার্ভার সিঙ্ক')}
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: t('All Messes', 'মেস সংখ্যা'), value: messes.length, color: 'border-l-blue-500', icon: Home, bg: 'bg-blue-50 text-blue-700' },
          { label: t('Platform Users', 'মোট ইউজার'), value: allUsers.length, color: 'border-l-indigo-500', icon: Users, bg: 'bg-indigo-50 text-indigo-700' },
          { label: t('Total Meals', 'মোট মিল'), value: allMeals.length, color: 'border-l-amber-500', icon: Utensils, bg: 'bg-amber-50 text-amber-700' },
          { label: t('Total Deposits', 'জমা ট্রানজেকশন'), value: allDeposits.length, color: 'border-l-emerald-500', icon: Wallet, bg: 'bg-emerald-50 text-emerald-700' },
          { label: t('Bazar Logs', 'মোট বাজার খরচ'), value: allBazars.length, color: 'border-l-rose-500', icon: ShoppingCart, bg: 'bg-rose-50 text-rose-700' }
        ].map((item, id) => {
          const Icon = item.icon;
          return (
            <div key={id} className={`bg-white p-5 rounded-2xl border-l-[4px] ${item.color} border-y border-r border-slate-200 shadow-sm flex items-center justify-between gap-3 ${id === 4 ? 'col-span-2 md:col-span-1' : ''}`}>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{item.label}</p>
                <p className="text-2xl font-black text-slate-800 font-display mt-1">{item.value}</p>
              </div>
              <span className={`p-2.5 ${item.bg} rounded-xl hidden sm:inline-block`}>
                <Icon className="w-5 h-5" />
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Tabs Segment */}
      <div className="flex overflow-x-auto scrollbar-none gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm whitespace-nowrap">
        <button
          onClick={() => { setActiveTab('messes'); setSelectedMess(null); }}
          className={`flex-1 min-w-[150px] py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'messes' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Home className="w-4 h-4" />
          {t('Messes list', 'মেসসমূহ')}
        </button>
        <button
          onClick={() => { setActiveTab('users'); setSelectedMess(null); }}
          className={`flex-1 min-w-[150px] py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'users' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          {t('Users Directory', 'ইউজারস তালিকা')}
        </button>
        <button
          onClick={() => { setActiveTab('data'); setSelectedMess(null); }}
          className={`flex-1 min-w-[150px] py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'data' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Database className="w-4 h-4" />
          {t('Platform Logs', 'র ডাটা লগস')}
        </button>
      </div>

      {loading ? (
        <div className="bg-white border-slate-200 border rounded-3xl py-24 text-center shadow-sm">
          <RefreshCcw className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-500 tracking-wide">{t('Querying platform data records...', 'সার্ভার ডাটাবেস চেক করা হচ্ছে...')}</p>
        </div>
      ) : (
        <>
          {/* TAB 1: MESS LIMIT */}
          {activeTab === 'messes' && !selectedMess && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors shadow-sm w-full">
                  <Search className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder={t("Search by mess name, unique ID, manager phone...", "মেস নাম, আইডি অথবা ফোন নম্বর টাইপ করে সার্চ করুন...")}
                    value={messSearch}
                    onChange={(e) => setMessSearch(e.target.value)}
                    className="border-none bg-transparent focus:ring-0 w-full outline-none text-sm text-slate-800 placeholder-slate-400 font-semibold"
                  />
                </div>
                <button 
                  onClick={() => setIsCreatingMess(true)}
                  className="shrink-0 px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Building className="w-4 h-4" />
                  {t('Register New Mess', 'নতুন মেস খুলুন')}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMesses.map(item => {
                  const manager = allUsers.find(u => (item.managerIds || []).includes(u.id));
                  const borders = allUsers.filter(u => u.messId === item.id);
                  const meals = allMeals.filter(m => m.messId === item.id);
                  const deposits = allDeposits.filter(d => d.messId === item.id);
                  const costCount = allBazars.filter(b => b.messId === item.id).length;

                  return (
                    <div key={item.id} className="bg-white rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden">
                      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <div className="flex flex-wrap gap-1.5 items-center mb-2">
                              <span className="inline-block px-2.5 py-0.5 text-[9px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md">
                                {t('ID:', 'আইডি:')} {item.id}
                              </span>
                              {item.status === 'Pending' && (
                                <span className="inline-block px-2 py-0.5 text-[9px] font-black uppercase text-amber-755 bg-amber-50 border border-amber-250 rounded-md animate-pulse">
                                  {t('Pending Approval', 'অনুমোদন পেন্ডিং')}
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-black text-slate-800 line-clamp-1 font-display">{item.name}</h3>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2.5 text-xs">
                          <div className="flex justify-between py-1.5 border-b border-dashed border-slate-150">
                            <span className="text-slate-400 font-bold uppercase tracking-wider">{t('Manager', 'ম্যানেজার')}</span>
                            <span className="font-extrabold text-slate-700 truncate max-w-[150px]">{manager ? manager.name : t('Unassigned', 'এসাইন করা নেই')}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-dashed border-slate-150">
                            <span className="text-slate-400 font-bold uppercase tracking-wider">{t('Borders capacity', 'সীমানা ক্যাপাসিটি')}</span>
                            <span className="font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg font-mono">{borders.length} / {item.totalBorders}</span>
                          </div>
                          <div className="flex justify-between py-1.5">
                            <span className="text-slate-400 font-bold uppercase tracking-wider">{t('Address', 'ঠিকানা')}</span>
                            <span className="font-semibold text-slate-500 truncate max-w-[170px]" title={item.location?.address}>{item.location?.address || '-'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Detail Statistics banner */}
                      <div className="px-6 py-4 bg-slate-50/30 border-b border-slate-100 grid grid-cols-3 text-center text-xs">
                        <div className="border-r border-slate-100">
                          <p className="font-black text-slate-400 text-[10px] uppercase tracking-wide">{t('Meals', 'মিলস')}</p>
                          <p className="text-slate-800 font-black mt-1 font-display">{meals.length}</p>
                        </div>
                        <div className="border-r border-slate-100">
                          <p className="font-black text-slate-400 text-[10px] uppercase tracking-wide">{t('Deposits', 'ডিপোজিট')}</p>
                          <p className="text-slate-800 font-black mt-1 font-display">{deposits.length}</p>
                        </div>
                        <div>
                          <p className="font-black text-slate-400 text-[10px] uppercase tracking-wide">{t('Bazars', 'বাজার')}</p>
                          <p className="text-slate-800 font-black mt-1 font-display">{costCount}</p>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="p-5 bg-white grid grid-cols-2 gap-2">
                        {item.status === 'Pending' ? (
                          <button
                            onClick={() => handleApproveMess(item)}
                            className="col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-3 rounded-xl text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/10 active:scale-[0.98] transition-all"
                          >
                            <ShieldCheck className="w-4 h-4" /> {t('Approve Mess', 'মেস অনুমোদন করুন')}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => { setSelectedMess(item); setSelectedMessDetailTab('users'); }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-3 rounded-xl text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/10 active:scale-[0.98] transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" /> {t('Show Info', 'ডাটা এন্ট্রি')}
                            </button>
                            
                            <button
                              onClick={() => openEditMess(item)}
                              className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-3 rounded-xl text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                            >
                              <Edit className="w-3.5 h-3.5" /> {t('Config', 'কনফিগ')}
                            </button>

                            <button
                              onClick={() => handleEnterMess(item.id)}
                              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-3 rounded-xl text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> {t('Login As', 'প্রবেশ')}
                            </button>

                            <button
                              onClick={() => handleWipeMess(item)}
                              className="bg-red-50 hover:bg-red-100 text-red-700 font-bold py-2.5 px-3 rounded-xl text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer border border-red-100 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> {t('Wipe Out', 'মুছুন')}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredMesses.length === 0 && (
                  <div className="col-span-full py-20 bg-white border border-dashed border-slate-200 rounded-3xl text-center text-slate-400">
                    <Home className="w-12 h-12 mx-auto mb-3 opacity-45" />
                    <p className="text-sm font-extrabold">{t('No messes found matching filters.', 'উক্ত তথ্য বা আইডি সম্বলিত কোনো মেসের রেকর্ড পাওয়া যায়নি।')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SINGLE MESS DEEP RECORDS VIEWER */}
          {activeTab === 'messes' && selectedMess && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-6 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full">{selectedMess.id}</span>
                    <h2 className="text-xl font-extrabold text-slate-800">{selectedMess.name}</h2>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{t('Interactive records management interface for this mess.', 'উক্ত মেসের সর্বমোট ইন্টারঅ্যাকটিভ তথ্য ও রেকর্ড কন্ট্রোল সুবিধা।')}</p>
                </div>
                <button
                  onClick={() => setSelectedMess(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border transition-all cursor-pointer"
                >
                  {t('Back to Messes list', 'পিছনে যান')}
                </button>
              </div>

              {/* Sub tabs inside selected mess */}
              <div className="flex gap-1 border-b border-slate-100 pb-2">
                {(['users', 'meals', 'deposits', 'bazars'] as const).map(tabKey => (
                  <button
                    key={tabKey}
                    onClick={() => setSelectedMessDetailTab(tabKey)}
                    className={`py-2 px-4 rounded-xl text-xs font-bold uppercase transition ${
                      selectedMessDetailTab === tabKey
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {tabKey === 'users' ? t('Borders List', 'মেস মেম্বাররা') : 
                     tabKey === 'meals' ? t('Calculated Meals', 'মিল সংখ্যা') :
                     tabKey === 'deposits' ? t('Deposited transactions', 'জমা হিসাব') : t('Bazar bills', 'বাজার লিস্ট')}
                  </button>
                ))}
              </div>

              {/* Inner lists */}
              <div className="space-y-4 pt-2">
                {/* 1. Mapped Borders */}
                {selectedMessDetailTab === 'users' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-extrabold border-b border-slate-100">
                        <tr>
                          <th className="p-4">{t('Profile Name', 'নাম')}</th>
                          <th className="p-4">{t('Role', 'পদবী')}</th>
                          <th className="p-4">{t('Approved Status', 'স্ট্যাটাস')}</th>
                          <th className="p-4">{t('Contact Information', 'যোগাযোগ')}</th>
                          <th className="p-4 text-center">{t('Room & Room PIN', 'রুম ও পিন')}</th>
                          <th className="p-4 text-right">{t('Administrative Tools', 'পরিবর্তন/রিমুভ')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {allUsers.filter(u => u.messId === selectedMess.id).map(u => (
                          <tr key={u.id}>
                            <td className="p-4">
                              <div>
                                <p className="font-extrabold text-slate-800">{u.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{u.id}</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                                u.role === 'Manager' ? 'bg-indigo-500/10 text-indigo-600' :
                                u.role === 'MealManager' ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`inline-block px-2.5 py-0.5 text-[10px] rounded-full uppercase tracking-wider ${
                                u.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                              }`}>
                                {u.status || 'Active'}
                              </span>
                            </td>
                            <td className="p-4">
                              <p>{u.email || 'No email'}</p>
                              <p className="text-xs text-slate-500">{u.phone || 'No phone'}</p>
                            </td>
                            <td className="p-4 text-center">
                              <p className="font-mono text-xs">{t('Room', 'রুম')}: {u.room || 'N/A'}</p>
                              <p className="text-[11px] text-slate-400 font-mono tracking-widest">PIN: {u.plainPin || 'N/A'}</p>
                            </td>
                            <td className="p-4 text-right space-x-1.5">
                              <button
                                onClick={() => openEditUser(u)}
                                className="p-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 hover:border-indigo-200 rounded-lg text-xs leading-relaxed inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Edit className="w-3 h-3" />
                                {t('Modify', 'এডিট')}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="p-1 px-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 hover:border-red-200 rounded-lg text-xs leading-relaxed inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                {t('Delete', 'মুছুন')}
                              </button>
                            </td>
                          </tr>
                        ))}

                        {allUsers.filter(u => u.messId === selectedMess.id).length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                              {t('No registered users found in this mess.', 'উক্ত মেসে এখনো কোনো মেম্বার নিবন্ধিত হয়নি।')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 2. Mapped Meals */}
                {selectedMessDetailTab === 'meals' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-extrabold border-b border-slate-100">
                        <tr>
                          <th className="p-4">{t('Border Name', 'সদস্য')}</th>
                          <th className="p-4">{t('Date', 'তারিখ')}</th>
                          <th className="p-4">{t('Meal Count', 'মিল সংখ্যা')}</th>
                          <th className="p-4">{t('Description Detail', 'ডেসক্রিপশন')}</th>
                          <th className="p-4 text-right">{t('Actions', 'পদক্ষেপ')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                        {allMeals.filter(m => m.messId === selectedMess.id).map(m => {
                          const border = allUsers.find(u => u.id === m.memberId);
                          return (
                            <tr key={m.id}>
                              <td className="p-4">
                                <p className="font-bold text-slate-800">{border ? border.name : t('Removed Member', 'মুছে ফেলা সদস্য')}</p>
                                <p className="text-[10px] font-mono text-slate-400">UID: {m.memberId}</p>
                              </td>
                              <td className="p-4 font-mono">{m.date}</td>
                              <td className="p-4 text-indigo-600 font-extrabold text-base">{m.mealCount}</td>
                              <td className="p-4 text-xs font-mono text-slate-500">
                                {m.morning ? '🌅Morning ' : ''}
                                {m.lunch ? '☀️Lunch ' : ''}
                                {m.dinner ? '🌙Dinner ' : ''}
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => handleDeleteRecord('meals', m.id)}
                                  className="p-1 px-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs leading-relaxed inline-flex items-center gap-1 border border-red-100 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" /> {t('Delete', 'মুছুন')}
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {allMeals.filter(m => m.messId === selectedMess.id).length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                              {t('No meal logs recorded for this mess.', 'মেসে কোনো মিল হিসাব নথিবদ্ধ করা নেই।')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 3. Mapped Deposits */}
                {selectedMessDetailTab === 'deposits' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-extrabold border-b border-slate-100">
                        <tr>
                          <th className="p-4">{t('Border Name', 'সদস্য')}</th>
                          <th className="p-4">{t('Date', 'তারিখ')}</th>
                          <th className="p-4">{t('Deposit Amount', 'টাকার পরিমাণ')}</th>
                          <th className="p-4">{t('Payment Method', 'পেমেন্ট মাধ্যম')}</th>
                          <th className="p-4">{t('Additional note', 'নোট')}</th>
                          <th className="p-4 text-right">{t('Actions', 'পদক্ষেপ')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                        {allDeposits.filter(d => d.messId === selectedMess.id).map(d => {
                          const border = allUsers.find(u => u.id === d.memberId);
                          return (
                            <tr key={d.id}>
                              <td className="p-4">
                                <p className="font-bold text-slate-850">{border ? border.name : t('Removed Member', 'মুছে ফেলা সদস্য')}</p>
                                <p className="text-[10px] text-slate-400 font-mono">UID: {d.memberId}</p>
                              </td>
                              <td className="p-4 font-mono text-xs">{d.date}</td>
                              <td className="p-4 text-emerald-600 font-extrabold text-base">৳ {d.amount}</td>
                              <td className="p-4 text-xs font-mono">{d.paymentMethod}</td>
                              <td className="p-4 text-xs max-w-[150px] truncate" title={d.notes || 'None'}>{d.notes || '-'}</td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => handleDeleteRecord('deposits', d.id)}
                                  className="p-1 px-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs leading-relaxed inline-flex items-center gap-1 border border-red-100 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" /> {t('Delete', 'মুছুন')}
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {allDeposits.filter(d => d.messId === selectedMess.id).length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                              {t('No deposit transactions found inside this mess.', 'মেসে কোনো ডিপোজিট হিস্ট্রি রেকর্ড পাওয়া যায়নি।')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 4. Mapped Bazar costs */}
                {selectedMessDetailTab === 'bazars' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-extrabold border-b border-slate-100">
                        <tr>
                          <th className="p-4">{t('Item Bought', 'বাজার পণ্য')}</th>
                          <th className="p-4">{t('Purchased By', 'কে কিনেছে')}</th>
                          <th className="p-4">{t('Date / Category', 'তারিখ / ক্যাটাগরি')}</th>
                          <th className="p-4">{t('Amount', 'টাকার পরিমাণ')}</th>
                          <th className="p-4 text-right">{t('Actions', 'পদক্ষেপ')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold font-mono text-xs">
                        {allBazars.filter(b => b.messId === selectedMess.id).map(b => (
                          <tr key={b.id} className="not-italic">
                            <td className="p-4">
                              <p className="font-extrabold text-slate-800 text-sm">{b.itemName}</p>
                              <p className="text-[10px] text-slate-400">Qty: {b.quantity || 1}</p>
                            </td>
                            <td className="p-4 text-sm font-semibold">{b.purchasedBy}</td>
                            <td className="p-4 text-xs font-semibold text-slate-500">
                              <p>{b.date}</p>
                              <span className="inline-block px-1.5 py-0.5 text-[9px] bg-indigo-50 text-indigo-700 rounded-md uppercase mt-0.5">{b.category || 'Food'}</span>
                            </td>
                            <td className="p-4 text-sm font-extrabold text-red-600">৳ {b.totalPrice}</td>
                            <td className="p-4 text-right">
                              <button
                                  onClick={() => handleDeleteRecord('bazarCosts', b.id)}
                                  className="p-1 px-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs leading-relaxed inline-flex items-center gap-1 border border-red-100 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" /> {t('Delete', 'মুছুন')}
                              </button>
                            </td>
                          </tr>
                        ))}

                        {allBazars.filter(b => b.messId === selectedMess.id).length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                              {t('No bazar cost listings for this mess yet.', 'মেসে কোনো বাজারের তালিকা এন্ট্রি করা হয়নি।')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GLOBAL USERS DIRECTORY */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <Search className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  placeholder={t("Search all global platform users by name, email, phone, role, mess sequential ID...", "প্ল্যাটফর্মের সকল ইউজারদের নাম, মোবাইল, ইমেল, পদবী অথবা মেস আইডি দিয়ে সন্ধান করুন...")}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium shadow-sm"
                />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="p-4">{t('User Name', 'ইউজার নাম')} *</th>
                        <th className="p-4">{t('Role Tiers', 'পদবী')}</th>
                        <th className="p-4">{t('Associated Mess ID', 'নিবন্ধিত মেস')}</th>
                        <th className="p-4">{t('Contact Detail', 'যোগাযোগ')}</th>
                        <th className="p-4">{t('App status', 'স্ট্যাটাস')}</th>
                        <th className="p-4 text-right">{t('System Management', 'মুছে ফেলা / পরিবর্তন')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                      {filteredUsers.map(u => {
                        const messObj = messes.find(m => m.id === u.messId);
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/50">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-slate-100 text-slate-600 font-black flex items-center justify-center rounded-xl border border-slate-200">
                                  {u.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <p className="font-extrabold text-slate-800">{u.name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono tracking-tighter">UID: {u.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                u.role === 'Manager' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                u.role === 'MealManager' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {u.role || 'Border'}
                              </span>
                            </td>
                            <td className="p-4">
                              {u.messIds && u.messIds.length > 0 ? (
                                <div className="flex flex-col gap-1 max-w-[200px]">
                                   {u.messIds.map(mid => {
                                      const m = messes.find(mess => mess.id === mid);
                                      return (
                                        <div key={mid} className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-100 rounded-lg">
                                           <Home className="w-2.5 h-2.5 text-slate-400" />
                                           <div className="flex flex-col overflow-hidden">
                                              <span className="text-[10px] font-black text-slate-700 truncate">{m ? m.name : 'Unknown'}</span>
                                              <span className="text-[8px] font-mono text-slate-400 truncate">{mid}</span>
                                           </div>
                                        </div>
                                      );
                                   })}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs italic">{t('Unassigned', 'কোনো মেসে যুক্ত নেই')}</span>
                              )}
                            </td>
                            <td className="p-4 text-xs">
                              <p className="font-bold text-slate-700">{u.email || '-'}</p>
                              <p className="text-slate-400 font-mono">{u.phone || '-'}</p>
                            </td>
                            <td className="p-4">
                              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                                u.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                                u.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                              }`}>
                                {u.status || 'Active'}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-1.5">
                              <button
                                onClick={() => openEditUser(u)}
                                className="p-1 px-3 bg-white hover:bg-slate-50 text-indigo-700 border border-slate-200 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer shadow-sm inline-flex"
                              >
                                <Edit className="w-3.5 h-3.5" /> {t('Edit profile', 'এডিট')}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="p-1 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer inline-flex"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> {t('Hard delete', 'ডিলিট')}
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                            {t('No registered players or managers matched your search query in the system.', 'কোনো মেম্বার বা ইউজারের তথ্য পাওয়া যায়নি।')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PLATFORM-WIDE UNIFIED DATA LOGS */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              {/* Inner Tabs and Search bar */}
              <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                <div className="flex overflow-x-auto scrollbar-none gap-1 bg-white p-1 rounded-xl border border-slate-200 w-full md:w-auto whitespace-nowrap">
                  {(['meals', 'deposits', 'bazars'] as const).map(subKey => (
                    <button
                      key={subKey}
                      onClick={() => setDataSubTab(subKey)}
                      className={`flex-1 md:flex-none py-2 px-4 rounded-lg text-xs font-bold uppercase transition cursor-pointer whitespace-nowrap ${
                        dataSubTab === subKey
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {subKey === 'meals' ? t('Meals Logs', 'মিলনালিকা') :
                       subKey === 'deposits' ? t('Deposits Ledger', 'ডিপোজিট খাতা') : t('Bazar lists', 'বাজার তালিকা')}
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-80">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder={t("Filter by Mess ID or date...", "আইডি অথবা তারিখ দিয়ে সার্চ করুন...")}
                    value={dataSearch}
                    onChange={(e) => setDataSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl outline-none text-xs shadow-sm font-semibold text-slate-700"
                  />
                </div>
              </div>

              {/* Mapped Explorer List */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {dataSubTab === 'meals' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="p-4">{t('Mess ID', 'মেস')}</th>
                          <th className="p-4">{t('Border Name', 'সদস্য')}</th>
                          <th className="p-4">{t('Date', 'তারিখ')}</th>
                          <th className="p-4">{t('Count', 'সংখ্যা')}</th>
                          <th className="p-4 text-right">{t('Erase Record', 'মুছে দিন')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold font-mono text-xs">
                        {allMeals.filter(m => (m.messId || '').toLowerCase().includes((dataSearch || '').toLowerCase()) || (m.date || '').includes(dataSearch)).map(m => {
                          const userObj = allUsers.find(u => u.id === m.memberId);
                          const messObj = messes.find(me => me.id === m.messId);
                          return (
                            <tr key={m.id} className="hover:bg-slate-50/50">
                              <td className="p-4">
                                <p className="font-bold text-slate-800 text-xs">{messObj ? messObj.name : 'Unknown'}</p>
                                <span className="inline-block px-1.5 py-0.5 text-[10px] bg-indigo-50 text-indigo-700 rounded-md mt-0.5">{m.messId}</span>
                              </td>
                              <td className="p-4 not-italic">
                                <p className="font-extrabold text-slate-800">{userObj ? userObj.name : t('Removed Member', 'মুছে ফেলা সদস্য')}</p>
                                <p className="text-[9px] text-slate-400">UID: {m.memberId}</p>
                              </td>
                              <td className="p-4">{m.date}</td>
                              <td className="p-4 text-indigo-600 font-black text-sm not-italic">{m.mealCount}</td>
                              <td className="p-4 text-right whitespace-nowrap">
                                <button
                                  onClick={() => handleDeleteRecord('meals', m.id)}
                                  className="p-1 px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 hover:border-red-200 rounded-xl text-xs leading-relaxed inline-flex items-center gap-1 cursor-pointer font-bold"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> {t('Delete', 'মুছুন')}
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {allMeals.filter(m => (m.messId || '').toLowerCase().includes((dataSearch || '').toLowerCase()) || (m.date || '').includes(dataSearch)).length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                              {t('No system meal records matched your query filter.', 'সিস্টেমে কোনো মিলের তথ্য পাওয়া যায়নি।')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {dataSubTab === 'deposits' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="p-4">{t('Mess ID', 'মেস')}</th>
                          <th className="p-4">{t('Sender Border', 'সদস্য')}</th>
                          <th className="p-4">{t('Date / Method', 'তারিখ / মাধ্যম')}</th>
                          <th className="p-4">{t('Amount Deposited', 'পরিমাণ')}</th>
                          <th className="p-4 text-right">{t('Erase Record', 'মুছে দিন')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold font-mono text-xs">
                        {allDeposits.filter(d => (d.messId || '').toLowerCase().includes((dataSearch || '').toLowerCase()) || (d.date || '').includes(dataSearch)).map(d => {
                          const userObj = allUsers.find(u => u.id === d.memberId);
                          const messObj = messes.find(me => me.id === d.messId);
                          return (
                            <tr key={d.id} className="hover:bg-slate-50/50">
                              <td className="p-4">
                                <p className="font-bold text-slate-800 text-xs">{messObj ? messObj.name : 'Unknown'}</p>
                                <span className="inline-block px-1.5 py-0.5 text-[10px] bg-indigo-50 text-indigo-700 rounded-md mt-0.5">{d.messId}</span>
                              </td>
                              <td className="p-4 not-italic">
                                <p className="font-extrabold text-slate-800">{userObj ? userObj.name : t('Removed Member', 'মুছে ফেলা সদস্য')}</p>
                                <p className="text-[9px] text-slate-400">UID: {d.memberId}</p>
                              </td>
                              <td className="p-4 not-italic">
                                <p>{d.date}</p>
                                <span className="inline-block px-1 text-[9px] bg-slate-100 text-slate-600 rounded uppercase font-bold">{d.paymentMethod}</span>
                              </td>
                              <td className="p-4 text-emerald-600 font-black text-sm not-italic">৳ {d.amount}</td>
                              <td className="p-4 text-right whitespace-nowrap">
                                <button
                                  onClick={() => handleDeleteRecord('deposits', d.id)}
                                  className="p-1 px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 hover:border-red-200 rounded-xl text-xs leading-relaxed inline-flex items-center gap-1 cursor-pointer font-bold"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> {t('Delete', 'মুছুন')}
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {allDeposits.filter(d => (d.messId || '').toLowerCase().includes((dataSearch || '').toLowerCase()) || (d.date || '').includes(dataSearch)).length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                              {t('No system deposit records matched your query filter.', 'সিস্টেমে কোনো ডিপোজিট রেকর্ড পাওয়া যায়নি।')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {dataSubTab === 'bazars' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="p-4">{t('Mess ID', 'মেস')}</th>
                          <th className="p-4">{t('Purchased item', 'বাজার পণ্য')}</th>
                          <th className="p-4">{t('Date / Category', 'তারিখ / ক্যাটাগরি')}</th>
                          <th className="p-4">{t('Total cost', 'টাকা')}</th>
                          <th className="p-4 text-right">{t('Erase Record', 'মুছে দিন')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold font-mono text-xs">
                        {allBazars.filter(b => (b.messId || '').toLowerCase().includes((dataSearch || '').toLowerCase()) || (b.date || '').includes(dataSearch)).map(b => {
                          const messObj = messes.find(me => me.id === b.messId);
                          return (
                            <tr key={b.id} className="hover:bg-slate-50/50">
                              <td className="p-4">
                                <p className="font-bold text-slate-800 text-xs">{messObj ? messObj.name : 'Unknown'}</p>
                                <span className="inline-block px-1.5 py-0.5 text-[10px] bg-indigo-50 text-indigo-700 rounded-md mt-0.5">{b.messId}</span>
                              </td>
                              <td className="p-4 not-italic">
                                <p className="font-extrabold text-slate-800 text-sm">{b.itemName}</p>
                                <p className="text-[10px] text-slate-400">Buyer: {b.purchasedBy}</p>
                              </td>
                              <td className="p-4">
                                <p>{b.date}</p>
                                <span className="inline-block px-1.5 py-0.5 text-[9px] bg-rose-50 text-rose-700 rounded-full">{b.category || 'Food'}</span>
                              </td>
                              <td className="p-4 text-red-600 font-black text-sm not-italic">৳ {b.totalPrice}</td>
                              <td className="p-4 text-right whitespace-nowrap">
                                <button
                                  onClick={() => handleDeleteRecord('bazarCosts', b.id)}
                                  className="p-1 px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 hover:border-red-200 rounded-xl text-xs leading-relaxed inline-flex items-center gap-1 cursor-pointer font-bold"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> {t('Delete', 'মুছুন')}
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {allBazars.filter(b => (b.messId || '').toLowerCase().includes((dataSearch || '').toLowerCase()) || (b.date || '').includes(dataSearch)).length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                              {t('No system bazar logs matched your query filter.', 'সিস্টেমে কোনো বাজার খরচের রেকর্ড পাওয়া যায়নি।')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

          {/* Create Mess Modal */}
          {isCreatingMess && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
                <div className="bg-rose-600 p-6 text-white flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black tracking-tight">{t('Create New Mess', 'নতুন মেস যোগ করুন')}</h3>
                    <p className="text-rose-100 text-[10px] font-bold uppercase tracking-widest mt-1">{t('System Administrator Exclusive', 'সিস্টেম অ্যাডমিনিস্ট্রেটর অ্যাক্সেস')}</p>
                  </div>
                  <button onClick={() => setIsCreatingMess(false)} className="p-2 hover:bg-white/10 rounded-xl transition cursor-pointer">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <form onSubmit={handleCreateMess} className="p-6 space-y-5">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('Mess Name', 'মেসের নাম')}</label>
                      <input 
                        type="text" 
                        required
                        value={newMessName}
                        onChange={e => setNewMessName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 transition-all outline-none font-semibold" 
                        placeholder="e.g. Dream House Mess"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('Manager Email', 'ম্যানেজারের ইমেইল')}</label>
                      <input 
                        type="email" 
                        required
                        value={newMessManagerEmail}
                        onChange={e => setNewMessManagerEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 transition-all outline-none font-semibold font-mono" 
                        placeholder="manager@example.com"
                      />
                      <p className="text-[9px] text-slate-400 mt-1 italic">{t('Manager will use this Google account to login', 'এই ইমেইল দিয়ে ম্যানেজার লগইন করবেন')}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('Manager Phone', 'ফোন নম্বর')}</label>
                        <input 
                          type="tel" 
                          required
                          value={newMessManagerPhone}
                          onChange={e => setNewMessManagerPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 transition-all outline-none font-semibold" 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('Border Capacity', 'সদস্য সংখ্যা')}</label>
                        <input 
                          type="number" 
                          required
                          value={newMessCapacity}
                          onChange={e => setNewMessCapacity(parseInt(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 transition-all outline-none font-semibold" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-2xl font-black tracking-widest uppercase text-xs flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      {actionLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      {actionLoading ? t('Creating...', 'তৈরি হচ্ছে...') : t('Provision Mess', 'মেসটি তৈরি করুন')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

      {/* MODAL 1: SYSTEM USER EDIT COMPONENT */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-150 animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-800 text-base">{t('System Config: User Profile', 'সিস্টেম এডিট: ইউজার প্রোফাইল')}</h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">{t('User Name', 'ইউজার নাম')}</label>
                <input
                  required
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">{t('Mobile Number', 'মোবাইল নম্বর')}</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">{t('Email Address', 'ইমেইল এড্রেস')}</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">{t('System Role', 'সিস্টেম পদবী')}</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs"
                  >
                    <option value="Border">Border (Member)</option>
                    <option value="MealManager">Meal Manager</option>
                    <option value="Manager">Mess Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">{t('Status Indicator', 'অনুমোদন স্ট্যাটাস')}</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs"
                  >
                    <option value="Active">Active (অনুমোদিত)</option>
                    <option value="Pending">Pending (অপেক্ষমান)</option>
                    <option value="Inactive">Inactive (বাতিলকৃত)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-2 border-b border-dashed border-slate-100">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">{t('Room Name / Number', 'রুম নম্বর')}</label>
                  <input
                    type="text"
                    value={editRoom}
                    onChange={(e) => setEditRoom(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">{t('6-Digit Quick PIN', '৬-ডিজিট সিকিউরিটি পিন')}</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={editPin}
                    onChange={(e) => setEditPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm tracking-widest font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">{t('Education / Workplace Institution', 'অন্যান্য তথ্য / প্রতিষ্ঠান')}</label>
                <input
                  type="text"
                  value={editInstitution}
                  onChange={(e) => setEditInstitution(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-sm"
                />
              </div>

              {/* Multiple Mess Management Section */}
              <div className="pt-4 border-t border-slate-100">
                 <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Building className="w-3.5 h-3.5" />
                    {t('Mess Memberships', 'যুক্ত থাকা মেসসমূহ')}
                 </h4>
                 
                 <div className="space-y-2 mb-4">
                    {(editingUser.messIds || []).map(mid => {
                       const m = messes.find(mess => mess.id === mid);
                       const isManager = m?.managerIds?.includes(editingUser.id);
                       return (
                          <div key={mid} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-xl">
                             <div className="flex items-center gap-2 overflow-hidden">
                                <Home className="w-4 h-4 text-slate-400 shrink-0" />
                                <div className="flex flex-col overflow-hidden">
                                   <span className="text-xs font-bold text-slate-800 truncate">{m ? m.name : 'Unknown Mess'}</span>
                                   <span className="text-[10px] text-slate-400 font-mono">{mid}</span>
                                </div>
                             </div>
                             <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${isManager ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                   {isManager ? t('Manager', 'ম্যানেজার') : t('Border', 'বর্ডার')}
                                </span>
                                <button 
                                   type="button"
                                   onClick={async () => {
                                      if (confirm(t('Remove user from this mess?', 'উক্ত মেস থেকে ইউজারকে রিমুভ করবেন?'))) {
                                         try {
                                            const newMessIds = (editingUser.messIds || []).filter(id => id !== mid);
                                            await updateDoc(doc(db, 'users', editingUser.id), { messIds: newMessIds });
                                            
                                            // Also remove from managerIds if they were there
                                            if (m) {
                                               const newManagers = (m.managerIds || []).filter(id => id !== editingUser.id);
                                               await updateDoc(doc(db, 'messes', mid), { managerIds: newManagers });
                                            }
                                            
                                            alert(t('User removed from mess', 'মেস থেকে ইউজারকে রিমুভ করা হয়েছে'));
                                            fetchData();
                                            setEditingUser(prev => prev ? { ...prev, messIds: newMessIds } : null);
                                         } catch (err) {
                                            console.error(err);
                                            alert('Failed to remove from mess');
                                         }
                                      }
                                   }}
                                   className="p-1 text-red-500 hover:bg-red-100 rounded-lg transition"
                                >
                                   <Trash2 className="w-3.5 h-3.5" />
                                </button>
                             </div>
                          </div>
                       );
                    })}
                    {(editingUser.messIds || []).length === 0 && (
                       <p className="text-[10px] text-slate-400 italic text-center py-2">{t('No messes assigned', 'কোনো মেস এসাইন করা নেই')}</p>
                    )}
                 </div>

                 <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-2">{t('Assign to another mess', 'নতুন মেসে যুক্ত করুন')}</p>
                    <div className="flex gap-2">
                       <select 
                          id="mess-assign-selector"
                          className="flex-1 bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                       >
                          <option value="">{t('Select Mess...', 'মেস সিলেক্ট করুন...')}</option>
                          {messes.filter(m => !(editingUser.messIds || []).includes(m.id)).map(m => (
                             <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                          ))}
                       </select>
                       <button 
                          type="button"
                          onClick={async () => {
                             const select = document.getElementById('mess-assign-selector') as HTMLSelectElement;
                             const mid = select.value;
                             if (!mid) return;
                             
                             try {
                                const newMessIds = Array.from(new Set([...(editingUser.messIds || []), mid]));
                                await updateDoc(doc(db, 'users', editingUser.id), { 
                                   messIds: newMessIds,
                                   messId: mid, // Set as active if they were unassigned
                                   status: 'Active'
                                });
                                
                                // Default assign as manager if supreme adds them? Or border?
                                // User said "set any user to multiple mess manager"
                                const targetMess = messes.find(m => m.id === mid);
                                if (targetMess) {
                                   const newManagers = Array.from(new Set([...(targetMess.managerIds || []), editingUser.id]));
                                   await updateDoc(doc(db, 'messes', mid), { managerIds: newManagers });
                                }
                                
                                alert(t('User assigned as Manager of new mess', 'ইউজারকে নতুন মেসের ম্যানেজার হিসেবে যুক্ত করা হয়েছে'));
                                fetchData();
                                setEditingUser(prev => prev ? { ...prev, messIds: newMessIds } : null);
                                select.value = "";
                             } catch (err) {
                                console.error(err);
                                alert('Failed to assign mess');
                             }
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition active:scale-95 cursor-pointer"
                       >
                          {t('Assign', 'যুক্ত করুন')}
                       </button>
                    </div>
                 </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition"
                >
                  {t('Cancel Changes', 'বাতিল')}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow transition disabled:opacity-50"
                >
                  {actionLoading ? t('Updating...', 'আপডেট হচ্ছে...') : t('Apply Settings', 'তথ্য সংরক্ষণ করুন')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SYSTEM MESS EDIT COMPONENT */}
      {editingMess && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-150 animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-rose-600" />
                <h3 className="font-extrabold text-slate-800 text-base">{t('System Config: Mess Properties', 'সিস্টেম এডিট: মেস প্রোফাইল')}</h3>
              </div>
              <button onClick={() => setEditingMess(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateMess} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">{t('Mess Name / Brand', 'মেস নাম')}</label>
                <input
                  required
                  type="text"
                  value={editMessName}
                  onChange={(e) => setEditMessName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">{t('Total Border Cap', 'সর্বোচ্চ সীমানা বর্ডার')}</label>
                  <input
                    type="number"
                    value={editMessBorders}
                    onChange={(e) => setEditMessBorders(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">{t('Manager Contact Phone', 'ম্যানেজার ফোন নম্বর')}</label>
                  <input
                    type="tel"
                    value={editMessPhone}
                    onChange={(e) => setEditMessPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">{t('Full Visual Address', 'সম্পূর্ণ ঠিকানা')}</label>
                <textarea
                  value={editMessAddress}
                  onChange={(e) => setEditMessAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-sm h-20 resize-none"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingMess(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition"
                >
                  {t('Cancel Changes', 'বাতিল')}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow transition disabled:opacity-50"
                >
                  {actionLoading ? t('Updating...', 'আপডেট হচ্ছে...') : t('Apply Settings', 'তথ্য সংরক্ষণ করুন')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
