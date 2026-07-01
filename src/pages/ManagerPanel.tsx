import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  orderBy, 
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-error';
import { RentRecord, EssentialCost, Member, BazarCost } from '../types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  X, 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Briefcase, 
  ShieldCheck, 
  CreditCard,
  Layers,
  Sparkles,
  Printer,
  Calendar,
  AlertTriangle,
  Bell
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useMonth } from '../contexts/MonthContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Extend jsPDF types for autotable support safely
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ManagerPanel() {
  const { currentMess, userProfile, isSupreme } = useAuth();
  const { t, language } = useLanguage();
  const { selectedMonth } = useMonth();
  const isManager = userProfile?.role === 'Manager' || isSupreme;
  const canManageNotices = userProfile?.role === 'Manager' || userProfile?.role === 'MealManager' || isSupreme;

  // State Management
  const [activeTab, setActiveTab] = useState<'rent' | 'costs' | 'report' | 'notices'>('rent');
  const [rentRecords, setRentRecords] = useState<RentRecord[]>([]);
  const [essentialCosts, setEssentialCosts] = useState<EssentialCost[]>([]);
  const [bazarCosts, setBazarCosts] = useState<BazarCost[]>([]);
  const [borders, setBorders] = useState<Member[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and Filters
  const [rentSearch, setRentSearch] = useState('');
  const [costSearch, setCostSearch] = useState('');

  // Default dates matching selectedMonth
  const getDefaultDate = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return today.startsWith(selectedMonth) ? today : `${selectedMonth}-01`;
  };

  // Rent Entry Modal / Form
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [editingRent, setEditingRent] = useState<RentRecord | null>(null);
  const [rentForm, setRentForm] = useState({
    roomNo: '',
    borderName: '',
    allocatedRent: '',
    rentPaid: '',
    notes: ''
  });

  // Essential Cost Modal / Form
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<EssentialCost | null>(null);
  const [costForm, setCostForm] = useState({
    title: '',
    amount: '',
    notes: ''
  });

  // Notice Modal / Form
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any | null>(null);
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '' });

  // Synchronise forms defaults when selectedMonth changes
  useEffect(() => {
    setRentForm(prev => ({ ...prev, date: getDefaultDate() }));
    setCostForm(prev => ({ ...prev, date: getDefaultDate() }));
  }, [selectedMonth]);

  // Fetch all collections
  useEffect(() => {
    if (!currentMess) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Rent Payments
    const qRent = query(
      collection(db, 'rentPayments'), 
      where('messId', '==', currentMess.id)
    );
    const unsubscribeRent = onSnapshot(qRent, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as RentRecord));
      data.sort((a, b) => {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return timeA - timeB;
      });
      setRentRecords(data);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'rentPayments'));

    // 2. Essential costs
    const qCost = query(
      collection(db, 'essentialCosts'), 
      where('messId', '==', currentMess.id)
    );
    const unsubscribeCost = onSnapshot(qCost, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as EssentialCost));
      data.sort((a, b) => {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return timeA - timeB;
      });
      setEssentialCosts(data);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'essentialCosts'));

    // 3. Bazar costs (for unified monthly reporting)
    const qBazar = query(
      collection(db, 'bazarCosts'), 
      where('messId', '==', currentMess.id)
    );
    const unsubscribeBazar = onSnapshot(qBazar, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BazarCost));
      data.sort((a, b) => {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return timeA - timeB;
      });
      setBazarCosts(data);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'bazarCosts'));

    // 4. Approved borders of the mess (for autocomplete name support)
    const qBorders = query(
      collection(db, 'users'), 
      where('messId', '==', currentMess.id), 
      where('role', 'in', ['Manager', 'Border', 'MealManager']),
      where('status', '==', 'Active')
    );
    const unsubscribeBorders = onSnapshot(qBorders, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Member));
      setBorders(data);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'users'));

    // 5. Notices
    const qNotice = query(
      collection(db, 'notices'),
      where('messId', '==', currentMess.id)
    );
    const unsubscribeNotice = onSnapshot(qNotice, (snapshot) => {
      const data = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .sort((a: any, b: any) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });
      setNotices(data);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'notices'));

    return () => {
      unsubscribeRent();
      unsubscribeCost();
      unsubscribeBazar();
      unsubscribeBorders();
      unsubscribeNotice();
    };
  }, [currentMess]);

  // Filtering list data based on state configurations
  const activeMonthRentRecords = rentRecords.filter(r => r.date.startsWith(selectedMonth));
  const activeMonthEssentialCosts = essentialCosts.filter(c => c.date.startsWith(selectedMonth));
  const activeMonthBazarCosts = bazarCosts.filter(b => b.date.startsWith(selectedMonth));

  // Search Filtered Data
  const searchedRentRecords = activeMonthRentRecords.filter(r => 
    r.roomNo.toLowerCase().includes(rentSearch.toLowerCase()) ||
    (r.borderName || '').toLowerCase().includes(rentSearch.toLowerCase()) ||
    (r.notes || '').toLowerCase().includes(rentSearch.toLowerCase()) ||
    r.serialNo.toLowerCase().includes(rentSearch.toLowerCase())
  );

  const searchedEssentialCosts = activeMonthEssentialCosts.filter(c => 
    c.title.toLowerCase().includes(costSearch.toLowerCase()) ||
    (c.notes || '').toLowerCase().includes(costSearch.toLowerCase())
  );

  // Totals calculations
  const totalRentAllocated = activeMonthRentRecords.reduce((sum, r) => sum + Number(r.allocatedRent || 0), 0);
  const totalRentReceived = activeMonthRentRecords.reduce((sum, r) => sum + Number(r.rentPaid || 0), 0);
  const totalEssentialCosts = activeMonthEssentialCosts.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const totalBazarCosts = activeMonthBazarCosts.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);
  const totalExpenditure = totalEssentialCosts;
  const netMarginalBalance = totalRentReceived - totalExpenditure;

  // Handle Border Select from presets to auto-fill details
  const handleBorderSelection = (borderId: string) => {
    if (!borderId) return;
    const selected = borders.find(b => b.id === borderId);
    if (selected) {
      setRentForm(prev => ({
        ...prev,
        borderName: selected.name,
        roomNo: selected.room || prev.roomNo,
      }));
    }
  };

  // Quick Preset tags for essential costs
  const essentialCostPresets = [
    { title: 'Electricity/WASA Bill', subtitle: 'বিদ্যুৎ/পানি বিল' },
    { title: 'WiFi Internet Router', subtitle: 'ওয়াইফাই ব্রডব্যান্ড' },
    { title: 'Chef/Cook Salary', subtitle: 'বাবুর্চির মাসিক বেতন' },
    { title: 'LPG Gas Cylinder Refill', subtitle: 'এলপিজি গ্যাস বিল' },
    { title: 'House Cleaning & Supplies', subtitle: 'মেস পরিষ্কার সামগ্রী' },
  ];

  // Save Rent Record
  const handleSaveRent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMess || !isManager) return;
    
    const docPayload = {
      serialNo: editingRent ? editingRent.serialNo : (format(new Date(), 'mss-yyMM') + '-' + Math.floor(10 + Math.random() * 90)),
      roomNo: rentForm.roomNo,
      borderName: rentForm.borderName,
      allocatedRent: Number(rentForm.allocatedRent || 0),
      rentPaid: Number(rentForm.rentPaid || 0),
      notes: rentForm.notes,
      date: editingRent ? editingRent.date : format(new Date(), 'yyyy-MM-dd'),
      messId: currentMess.id,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingRent) {
        await updateDoc(doc(db, 'rentPayments', editingRent.id), docPayload);
      } else {
        await addDoc(collection(db, 'rentPayments'), {
          ...docPayload,
          createdAt: serverTimestamp()
        });
      }
      setIsRentModalOpen(false);
      resetRentForm();
    } catch (err) {
      console.error("Error saving rent payments details: ", err);
    }
  };

  // Delete Rent
  const handleDeleteRent = async (id: string) => {
    if (!isManager) return;
    const isConfirmed = window.confirm(language === 'bn' ? 'আপনি কি আসলেই এই ভাড়ার রেকর্ডটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this rent record?');
    if (isConfirmed) {
      try {
        await deleteDoc(doc(db, 'rentPayments', id));
      } catch (err) {
        console.error("Error deleting rent record", err);
      }
    }
  };

  // Save Essential Cost
  const handleSaveCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMess || !isManager) return;

    const docPayload = {
      title: costForm.title,
      amount: Number(costForm.amount || 0),
      notes: costForm.notes,
      date: editingCost ? editingCost.date : format(new Date(), 'yyyy-MM-dd'),
      messId: currentMess.id,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingCost) {
        await updateDoc(doc(db, 'essentialCosts', editingCost.id), docPayload);
      } else {
        await addDoc(collection(db, 'essentialCosts'), {
          ...docPayload,
          createdAt: serverTimestamp()
        });
      }
      setIsCostModalOpen(false);
      resetCostForm();
    } catch (err) {
      console.error("Error saving essential cost", err);
    }
  };

  // Delete Cost
  const handleDeleteCost = async (id: string) => {
    if (!isManager) return;
    const isConfirmed = window.confirm(language === 'bn' ? 'আপনি কি আসলেই এই খরচের রেকর্ডটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this essential cost record?');
    if (isConfirmed) {
      try {
        await deleteDoc(doc(db, 'essentialCosts', id));
      } catch (err) {
        console.error("Error deleting essential cost document", err);
      }
    }
  };

  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMess || !canManageNotices) return;

    const docPayload = {
      title: noticeForm.title,
      content: noticeForm.content,
      author: userProfile?.name || 'Manager',
      messId: currentMess.id,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingNotice) {
        await updateDoc(doc(db, 'notices', editingNotice.id), {
          ...docPayload,
          createdAt: editingNotice.createdAt
        });
      } else {
        await addDoc(collection(db, 'notices'), {
          ...docPayload,
          createdAt: serverTimestamp()
        });
        
        // Notify all active borders
        const batchSize = 500;
        for (let i = 0; i < borders.length; i += batchSize) {
          const chunk = borders.slice(i, i + batchSize);
          const batch = writeBatch(db);
          chunk.forEach(border => {
            const notifRef = doc(collection(db, 'notifications'));
            batch.set(notifRef, {
              userId: border.id,
              messId: currentMess.id,
              title: language === 'bn' ? 'নতুন নোটিশ' : 'New Notice',
              message: noticeForm.title,
              type: 'notice',
              read: false,
              createdAt: serverTimestamp()
            });
          });
          await batch.commit();
        }
      }
      setIsNoticeModalOpen(false);
      setNoticeForm({ title: '', content: '' });
      setEditingNotice(null);
    } catch (err) {
      console.error("Error saving notice", err);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!canManageNotices) return;
    const isConfirmed = window.confirm(language === 'bn' ? 'আপনি কি আসলেই এই নোটিশটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this notice?');
    if (isConfirmed) {
      try {
        await deleteDoc(doc(db, 'notices', id));
      } catch (err) {
        console.error("Error deleting notice", err);
      }
    }
  };

  const resetRentForm = () => {
    setEditingRent(null);
    setRentForm({
      roomNo: '',
      borderName: '',
      allocatedRent: '',
      rentPaid: '',
      notes: ''
    });
  };

  const resetCostForm = () => {
    setEditingCost(null);
    setCostForm({
      title: '',
      amount: '',
      notes: ''
    });
  };

  // Download Excel Spreadsheet
  const downloadExcel = () => {
    if (!currentMess) return;

    // Create workbook
    const wb = XLSX.utils.book_new();

    // 1. Summary Sheet
    const summaryData = [
      { [language === 'bn' ? 'বিবরণ' : 'Description']: language === 'bn' ? 'মেসের নাম' : 'Mess Name', [language === 'bn' ? 'পরিমাণ/তথ্য' : 'Value']: currentMess.name },
      { [language === 'bn' ? 'বিবরণ' : 'Description']: language === 'bn' ? 'রিপোর্ট মাস' : 'Report Month', [language === 'bn' ? 'পরিমাণ/তথ্য' : 'Value']: selectedMonth },
      { [language === 'bn' ? 'বিবরণ' : 'Description']: language === 'bn' ? 'মোট বরাদ্দকৃত ঘরভাড়া' : 'Total Allocated Rent', [language === 'bn' ? 'পরিমাণ/তথ্য' : 'Value']: totalRentAllocated },
      { [language === 'bn' ? 'বিবরণ' : 'Description']: language === 'bn' ? 'মোট সংগৃহীত ঘরভাড়া (Vara)' : 'Total Collected Rent (Vara)', [language === 'bn' ? 'পরিমাণ/তথ্য' : 'Value']: totalRentReceived },
      { [language === 'bn' ? 'বিবরণ' : 'Description']: language === 'bn' ? 'মোট অপরিহার্য ও ইউটিলিটি খরচ' : 'Total Essential Operating Costs', [language === 'bn' ? 'পরিমাণ/তথ্য' : 'Value']: totalEssentialCosts },
      { [language === 'bn' ? 'বিবরণ' : 'Description']: language === 'bn' ? 'অবশিষ্ট লাভ/মেস ব্যালেন্স' : 'Net Remaining Cash Margin', [language === 'bn' ? 'পরিমাণ/তথ্য' : 'Value']: netMarginalBalance },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, language === 'bn' ? "হিসাব সারসংক্ষেপ" : "Summary Balance");

    // 2. Rent Sheet
    const rentRows = activeMonthRentRecords.map((r, i) => ({
      'No.': r.serialNo,
      [language === 'bn' ? 'তারিখ' : 'Date']: r.date,
      [language === 'bn' ? 'রুম নম্বর' : 'Room No']: r.roomNo,
      [language === 'bn' ? 'বর্ডার নাম' : 'Border Name']: r.borderName || 'N/A',
      [language === 'bn' ? 'নির্ধারিত ভাড়া' : 'Allocated Rent']: r.allocatedRent,
      [language === 'bn' ? 'ভাড়া দিয়েছে' : 'Rent Paid']: r.rentPaid,
      [language === 'bn' ? 'বকেয়া' : 'Due']: Math.max(0, r.allocatedRent - r.rentPaid),
      [language === 'bn' ? 'মন্তব্য' : 'Remarks/Montobbo']: r.notes || ''
    }));
    const wsRent = XLSX.utils.json_to_sheet(rentRows);
    XLSX.utils.book_append_sheet(wb, wsRent, language === 'bn' ? "ভাড়া আদায় বিবরণী" : "Rent Ledgers");

    // 3. Costs Sheet
    const costRows = activeMonthEssentialCosts.map((c, i) => ({
      'Sl.': i + 1,
      [language === 'bn' ? 'তারিখ' : 'Date']: c.date,
      [language === 'bn' ? 'খরচ বা খাতের বিবরণ' : 'Cost Details']: c.title,
      [language === 'bn' ? 'টাকার পরিমাণ' : 'Amount']: c.amount,
      [language === 'bn' ? 'সংক্ষিপ্ত মন্তব্য' : 'Notes/Remarks']: c.notes || ''
    }));
    const wsCosts = XLSX.utils.json_to_sheet(costRows);
    XLSX.utils.book_append_sheet(wb, wsCosts, language === 'bn' ? "প্রয়োজনীয় অন্যান্য ব্যয়" : "Essential Utility Expenses");

    // Compile to download file
    XLSX.writeFile(wb, `Mess_Manager_Total_Report_${selectedMonth}.xlsx`);
  };

  // Download PDF Report with jsPDF Autotable
  const downloadPDF = () => {
    if (!currentMess) return;

    // Standard constructor
    const doc = new jsPDF() as jsPDFWithAutoTable;
    
    // Set Document Metadata
    const isBn = language === 'bn';
    const reportTitle = isBn ? currentMess.name + " - মাসিক আর্থিক ও ভাড়া আদায় বিবরণী" : currentMess.name + " - Monthly Financial & Rent Statement";
    const dateStr = format(new Date(), 'yyyy-MM-dd HH:mm');

    // Header Panel
    doc.setFillColor(30, 41, 59); // Indigo/slate 800 background
    doc.rect(0, 0, 210, 38, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(20);
    doc.text(currentMess.name.toUpperCase(), 14, 15);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.text(isBn ? `ম্যানেজার প্যানেল থেকে জেনারেটকৃত অফিসিয়াল মাসিক স্টেটমেন্ট` : `Official statement generated securely for managing hostel/mess operations`, 14, 21);
    doc.text(isBn ? `রিপোর্ট মাস: ${selectedMonth} | তারিখ: ${dateStr}` : `Statement Month: ${selectedMonth} | Generated: ${dateStr}`, 14, 27);

    // Summary Section
    doc.setTextColor(30, 41, 59);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text(isBn ? "১. চলতি মাসের সার্বিক আর্থিক সারসংক্ষেপ" : "1. Consolidated Statement Summary", 14, 48);

    // Summary block content variables
    const summaryHeaders = [
      [isBn ? "খাত বিবরণ" : "Ledger Item", isBn ? "পরিমাণ (টাকা)" : "Amount (TK)"]
    ];
    const summaryRows = [
      [isBn ? "মোট বরাদ্দকৃত রুম ভাড়া" : "Gross Room Rent Scheduled", `${totalRentAllocated} TK`],
      [isBn ? "মোট সংগৃহীত রুম ভাড়া (আদায়)" : "Gross Room Rent Collected", `${totalRentReceived} TK`],
      [isBn ? "মোট মেস বা ইউটিলিটি অপরিহার্য খরচ" : "Total Essential Utility Expenses", `${totalEssentialCosts} TK`],
      [isBn ? "মেস ম্যানেজারের অবশিষ্টাংশ ক্যাশ ব্যালেন্স" : "Net Rent Remaining Balance", `${netMarginalBalance} TK`]
    ];

    doc.autoTable({
      startY: 53,
      head: summaryHeaders,
      body: summaryRows,
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2.5 },
      columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 60, halign: 'right' } }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 12;

    // Rent Table
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text(isBn ? "২. সীমানা রুম ভাড়া আদায় বিবরণী (Vara)" : "2. Boarder Rent Collection Register", 14, currentY);

    const rentHeaders = [
      ['No.', isBn ? 'তারিখ' : 'Date', isBn ? 'রুম নং' : 'Room', isBn ? 'বর্ডার নাম' : 'Border Name', isBn ? 'নির্ধারিত ভাড়া' : 'Allocated', isBn ? 'ভাড়া আদায়' : 'Paid', isBn ? 'মন্তব্য' : 'Remarks']
    ];

    const rentBodyRows = activeMonthRentRecords.map(r => [
      r.serialNo,
      r.date,
      r.roomNo,
      r.borderName || 'N/A',
      `${r.allocatedRent} Tk`,
      `${r.rentPaid} Tk`,
      r.notes || '-'
    ]);

    doc.autoTable({
      startY: currentY + 5,
      head: rentHeaders,
      body: rentBodyRows,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 2 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;

    // Essential Costs Table
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text(isBn ? "৩. অপরিহার্য মেস বা ইউটিলিটি খরচ বিবরণী" : "3. Essential & Utility Expenses Register", 14, currentY);

    const costHeaders = [
      ['Sl.', isBn ? 'তারিখ' : 'Date', isBn ? 'খরচ বিবরণী' : 'Expense Details', isBn ? 'মোট খরচ' : 'Spent Amount', isBn ? 'স্মারক/মন্তব্য' : 'Comments']
    ];

    const costBodyRows = activeMonthEssentialCosts.map((c, i) => [
      String(i + 1),
      c.date,
      c.title,
      `${c.amount} Tk`,
      c.notes || '-'
    ]);

    doc.autoTable({
      startY: currentY + 5,
      head: costHeaders,
      body: costBodyRows,
      theme: 'striped',
      headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 2 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 25;

    // Check if we need to add another page or place signature
    if (finalY < 270) {
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.line(14, finalY, 70, finalY);
      doc.line(140, finalY, 196, finalY);
      doc.text(isBn ? "মেস ম্যানেজারের স্বাক্ষর" : "Mess Manager Signature", 14, finalY + 5);
      doc.text(isBn ? "আবাসিক প্রতিনিধি স্বাক্ষর" : "Border Representative Signature", 140, finalY + 5);
    }

    doc.save(`Mess_Financial_Report_${selectedMonth}.pdf`);
  };

  if (!isManager) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white border border-slate-200 rounded-3xl mt-12 shadow-xs">
        <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
          {language === 'bn' ? 'অননুমোদিত প্রবেশ!' : 'Access Restricted'}
        </h2>
        <p className="mt-2 text-slate-500">
          {language === 'bn' 
            ? 'এই সেকশনটি শুধুমাত্র মেস ম্যানেজারদের জন্য বরাদ্দকৃত। আপনি যদি বর্ডার হয়ে থাকেন তবে মেসের ভাড়ার রেকর্ড এডিট করতে পারবেন না।' 
            : 'This section is secure and reserved for authenticated Mess Managers only. Border residents cannot log rent ledger parameters.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* Banner Title */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-slate-700/50">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 font-extrabold text-[10px] uppercase tracking-widest rounded-full border border-blue-500/20 mb-3.5">
              <ShieldCheck className="h-3 w-3" />
              {language === 'bn' ? 'ম্যানেজার রেস্ট্রিক্টেড জোন' : 'Authenticated Manager Zone'}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-2 leading-none">
              {t('manager.title')}
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              {t('manager.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/40 p-2 border border-slate-700/40 rounded-2xl shrink-0 self-start md:self-auto">
            <Calendar className="h-5 w-5 text-blue-400 ml-2" />
            <div className="text-right">
              <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Month</span>
              <span className="text-sm font-black text-white">{selectedMonth}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Numerical Summary Overview banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Total Collected Rent */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs relative flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">{t('manager.total_received')}</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 leading-none">
              {totalRentReceived} <span className="text-sm font-semibold text-slate-500">{t('common.currency')}</span>
            </h2>
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-bold text-slate-600">{totalRentAllocated} Tk</span> {language === 'bn' ? 'নির্ধারিত ভাড়ার মাঝে' : 'from fixed total'}
            </div>
          </div>
        </div>

        {/* Essential Operating Costs */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs relative flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">{t('manager.total_costs')}</span>
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 leading-none">
              {totalEssentialCosts} <span className="text-sm font-semibold text-slate-500">{t('common.currency')}</span>
            </h2>
            <span className="mt-2.5 block text-xs text-slate-500 font-medium">
              {language === 'bn' ? 'ইউটিলিটি, ইন্টারনেট, বাবুর্চি বেতন ইত্যাদি' : 'Utilities, wifi router, cleaners, chef'}
            </span>
          </div>
        </div>

        {/* Remaining margin balance state */}
        <div className={cn(
          "border rounded-2xl p-5 shadow-xs relative flex flex-col justify-between overflow-hidden transition-colors",
          netMarginalBalance >= 0 
            ? "bg-slate-900 text-white border-slate-800" 
            : "bg-red-950/20 text-red-950 border-red-200"
        )}>
          <div className="flex items-center justify-between mb-4">
            <span className={cn(
              "text-xs font-extrabold uppercase tracking-wider",
              netMarginalBalance >= 0 ? "text-slate-400" : "text-red-700"
            )}>{t('manager.net_balance')}</span>
            <div className={cn(
              "p-2.5 rounded-xl border",
              netMarginalBalance >= 0 
                ? "bg-slate-800 text-slate-100 border-slate-700" 
                : "bg-red-105 text-red-600 border-red-200"
            )}>
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black leading-none">
              {netMarginalBalance} <span className="text-sm font-semibold opacity-70">{t('common.currency')}</span>
            </h2>
            <span className={cn(
              "mt-2.5 block text-xs",
              netMarginalBalance >= 0 ? "text-emerald-400font-bold" : "text-red-600 font-bold"
            )}>
              {netMarginalBalance >= 0 
                ? (language === 'bn' ? 'মেস ক্যাশ উদ্বৃত্ত আছে' : 'Surplus cash available') 
                : (language === 'bn' ? 'মেস ব্যালেন্স ঘাটতি আছে!' : 'Financial deficit recorded!')}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs list bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex bg-white border border-slate-200 p-1.5 rounded-2xl shadow-inner max-w-md w-full">
          <button
            onClick={() => setActiveTab('rent')}
            className={cn(
              "flex-1 py-2.5 px-4 text-xs font-black tracking-wide rounded-xl transition-all cursor-pointer text-center",
              activeTab === 'rent' 
                ? "bg-slate-900 text-white shadow-md shadow-slate-950/15" 
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            {t('manager.rent_tab')}
          </button>
          
          <button
            onClick={() => setActiveTab('costs')}
            className={cn(
              "flex-1 py-2.5 px-4 text-xs font-black tracking-wide rounded-xl transition-all cursor-pointer text-center",
              activeTab === 'costs' 
                ? "bg-slate-900 text-white shadow-md shadow-slate-950/15" 
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            {t('manager.costs_tab')}
          </button>

          <button
            onClick={() => setActiveTab('notices')}
            className={cn(
              "flex-1 py-2.5 px-4 text-xs font-black tracking-wide rounded-xl transition-all cursor-pointer text-center",
              activeTab === 'notices' 
                ? "bg-slate-900 text-white shadow-md shadow-slate-950/15" 
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            {language === 'bn' ? 'নোটিশ বোর্ড' : 'Notices'}
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={cn(
              "flex-1 py-2.5 px-4 text-xs font-black tracking-wide rounded-xl transition-all cursor-pointer text-center",
              activeTab === 'report' 
                ? "bg-slate-900 text-white shadow-md shadow-slate-950/15" 
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            {t('manager.reports_tab')}
          </button>
        </div>

        {/* Quick action triggers depending on active tab */}
        {activeTab === 'rent' && (
          <button
            onClick={() => { resetRentForm(); setIsRentModalOpen(true); }}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-5 text-xs font-black rounded-xl transition shadow-md cursor-pointer self-start sm:self-auto active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            {t('manager.add_rent')}
          </button>
        )}

        {activeTab === 'costs' && (
          <button
            onClick={() => { resetCostForm(); setIsCostModalOpen(true); }}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-5 text-xs font-black rounded-xl transition shadow-md cursor-pointer self-start sm:sm:self-auto active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            {t('manager.add_cost')}
          </button>
        )}

        {activeTab === 'notices' && canManageNotices && (
          <button
            onClick={() => { setEditingNotice(null); setNoticeForm({ title: '', content: '' }); setIsNoticeModalOpen(true); }}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-5 text-xs font-black rounded-xl transition shadow-md cursor-pointer self-start sm:self-auto active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            {language === 'bn' ? 'নতুন নোটিশ' : 'Create Notice'}
          </button>
        )}
      </div>

      {/* Loading state indicator */}
      {loading ? (
        <div className="py-20 text-center bg-white border border-slate-200 rounded-3xl">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{t('common.loading')}</p>
        </div>
      ) : (
        <>
          {/* TAB 1: RENT LISTING */}
          {activeTab === 'rent' && (
            <div className="space-y-4">
              
              {/* Table search filter bar */}
              <div className="flex bg-white items-center gap-2 border border-slate-200 px-4 py-3 rounded-2xl shadow-inner max-w-lg">
                <Search className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder={language === 'bn' ? 'রুম নম্বর, বর্ডার নাম বা মন্তব্য খুঁজে বের করুন...' : 'Search Room, Border, or Serial/Remarks...'}
                  value={rentSearch}
                  onChange={(e) => setRentSearch(e.target.value)}
                  className="bg-transparent text-sm text-slate-700 outline-none w-full"
                />
              </div>

              {/* Data Table */}
              {searchedRentRecords.length === 0 ? (
                <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-700 font-bold text-sm">{t('manager.no_rent_records')}</p>
                  <p className="text-slate-400 text-xs mt-1">{language === 'bn' ? 'ভাড়া রেকর্ড যোগ করতে ওপরে ডান পাশের বাটনে ক্লিক করুন।' : 'Add new entries by using the top right button.'}</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-200/60 font-mono">
                          <th className="px-6 py-4">{t('manager.serial_no')}</th>
                          <th className="px-6 py-4">{t('manager.date')}</th>
                          <th className="px-6 py-4">{t('manager.room_no')}</th>
                          <th className="px-6 py-4">{t('manager.border_name')}</th>
                          <th className="px-6 py-4 text-right">{t('manager.allocated_rent')}</th>
                          <th className="px-6 py-4 text-right">{t('manager.rent_paid')}</th>
                          <th className="px-6 py-4 text-right">{language === 'bn' ? 'বকেয়া' : 'Due'}</th>
                          <th className="px-6 py-4">{t('manager.notes')}</th>
                          <th className="px-6 py-4">{language === 'bn' ? 'আপডেট' : 'Modified'}</th>
                          <th className="px-6 py-4 text-center">{t('manager.table_actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {searchedRentRecords.map((r) => {
                          const due = Math.max(0, r.allocatedRent - r.rentPaid);
                          return (
                            <tr key={r.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-mono font-bold text-xs text-slate-500 whitespace-nowrap">{r.serialNo}</td>
                              <td className="px-6 py-4 font-bold text-slate-600 whitespace-nowrap">{r.date}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 text-xs font-black rounded-lg">
                                  {r.roomNo}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">{r.borderName || 'N/A'}</td>
                              <td className="px-6 py-4 text-right font-black text-slate-700 whitespace-nowrap">{r.allocatedRent} Tk</td>
                              <td className="px-6 py-4 text-right whitespace-nowrap">
                                <span className={cn(
                                  "font-black",
                                  r.rentPaid >= r.allocatedRent ? "text-emerald-600" : "text-amber-600"
                                )}>
                                  {r.rentPaid} Tk
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right whitespace-nowrap font-mono">
                                {due > 0 ? (
                                  <span className="text-red-500 font-extrabold">{due} Tk</span>
                                ) : (
                                  <span className="text-emerald-500 font-extrabold">Paid</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-slate-500 italic max-w-xs truncate" title={r.notes}>{r.notes || '-'}</td>
                              <td className="px-6 py-4 font-mono text-xs text-slate-400 whitespace-nowrap">{(r as any).updatedAt ? format((r as any).updatedAt.toDate(), 'yy-MM-dd HH:mm') : '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="inline-flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingRent(r);
                                      setRentForm({
                                        roomNo: r.roomNo,
                                        borderName: r.borderName || '',
                                        allocatedRent: String(r.allocatedRent),
                                        rentPaid: String(r.rentPaid),
                                        notes: r.notes || ''
                                      });
                                      setIsRentModalOpen(true);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                    title="Edit"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRent(r.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ESSENTIAL COSTS LISTING */}
          {activeTab === 'costs' && (
            <div className="space-y-4">
              
              {/* Cost Search input structure */}
              <div className="flex bg-white items-center gap-2 border border-slate-200 px-4 py-3 rounded-2xl shadow-inner max-w-lg">
                <Search className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder={language === 'bn' ? 'অন্যান্য অপরিহার্য মেস খরচের বিবরণী খুঁজুন...' : 'Search list titles or notes ...'}
                  value={costSearch}
                  onChange={(e) => setCostSearch(e.target.value)}
                  className="bg-transparent text-sm text-slate-700 outline-none w-full"
                />
              </div>

              {/* Data Table */}
              {searchedEssentialCosts.length === 0 ? (
                <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-700 font-bold text-sm">{t('manager.no_cost_records')}</p>
                  <p className="text-slate-400 text-xs mt-1">{language === 'bn' ? 'নতুন ইউটিলিটি/মেস খরচ যুক্ত করতে ওপরে ডান পাশে বাটনে ক্লিক করুন।' : 'Submit detailed utility entries using the top button.'}</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-200/60 font-mono">
                          <th className="px-6 py-4">Sl.</th>
                          <th className="px-6 py-4">{t('manager.date')}</th>
                          <th className="px-6 py-4">{language === 'bn' ? 'খরচের বিবরণ' : 'Description Details'}</th>
                          <th className="px-6 py-4 text-right">{language === 'bn' ? 'টাকার পরিমাণ' : 'Spent Amount'}</th>
                          <th className="px-6 py-4">{t('manager.notes')}</th>
                          <th className="px-6 py-4">{language === 'bn' ? 'আপডেট' : 'Modified'}</th>
                          <th className="px-6 py-4 text-center">{t('manager.table_actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {searchedEssentialCosts.map((c, i) => (
                          <tr key={c.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-xs text-slate-400 whitespace-nowrap">{i + 1}</td>
                            <td className="px-6 py-4 font-bold text-slate-600 whitespace-nowrap">{c.date}</td>
                            <td className="px-6 py-4 font-black text-slate-900 whitespace-nowrap">{c.title}</td>
                            <td className="px-6 py-4 text-right font-black text-slate-800 whitespace-nowrap">{c.amount} Tk</td>
                            <td className="px-6 py-4 text-slate-500 italic max-w-xs truncate" title={c.notes}>{c.notes || '-'}</td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-400 whitespace-nowrap">{(c as any).updatedAt ? format((c as any).updatedAt.toDate(), 'yy-MM-dd HH:mm') : '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="inline-flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingCost(c);
                                    setCostForm({
                                      title: c.title,
                                      amount: String(c.amount),
                                      notes: c.notes || ''
                                    });
                                    setIsCostModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCost(c.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: NOTICES LISTING */}
          {activeTab === 'notices' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notices.length === 0 ? (
                <div className="col-span-full py-16 text-center bg-white border border-slate-200 rounded-3xl font-sans">
                  <Bell className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-700 font-bold text-sm">No notices yet</p>
                  <p className="text-slate-400 text-xs mt-1">Create announcements for all mess members.</p>
                </div>
              ) : (
                notices.map(notice => (
                  <div key={notice.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden font-sans">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Bell className="w-12 h-12" />
                    </div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                       <div>
                         <h3 className="text-lg font-black text-slate-900 pr-12 leading-tight">{notice.title}</h3>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                           {notice.createdAt?.toDate ? format(notice.createdAt.toDate(), 'PPP') : 'Just now'} • by {notice.author}
                         </p>
                       </div>
                       {canManageNotices && (
                         <div className="flex gap-2 shrink-0">
                           <button 
                             onClick={() => { setEditingNotice(notice); setNoticeForm({ title: notice.title, content: notice.content }); setIsNoticeModalOpen(true); }}
                             className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                           >
                             <Edit2 className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => handleDeleteNotice(notice.id)}
                             className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                       )}
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap relative z-10">{notice.content}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: REPORT DOWNLOADS SECTION */}
          {activeTab === 'report' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Balances list sheet */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                  {language === 'bn' ? 'চলতি রিপোর্ট বিবরণী হিসাব' : 'Monthly Financial Balance Registers'}
                </h3>

                <div className="space-y-4 select-none font-mono text-sm border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between py-1 bg-slate-50/50 px-3.5 rounded-xl">
                    <span className="text-slate-500">{language === 'bn' ? 'আদায়ের জন্য মোট ধার্য ভাড়া:' : 'Gross Scheduled Monthly Rent:'}</span>
                    <span className="font-extrabold text-slate-700">{totalRentAllocated} Tk</span>
                  </div>

                  <div className="flex items-center justify-between py-1 bg-emerald-50/40 px-3.5 rounded-xl">
                    <span className="text-slate-500 font-bold">{language === 'bn' ? 'বাস্তব সংগৃহীত মোট ভাড়া:' : 'Actual Rent Collected:'}</span>
                    <span className="font-black text-emerald-600">{totalRentReceived} Tk</span>
                  </div>

                  <div className="flex items-center justify-between py-1 bg-red-50/40 px-3.5 rounded-xl">
                    <span className="text-slate-500">{language === 'bn' ? 'মেস কস্ট বা অপরিহার্য ইউটিলিটি ব্যয়নামা:' : 'Total Rent & Utility Costs:'}</span>
                    <span className="font-extrabold text-red-600">{totalEssentialCosts} Tk</span>
                  </div>



                  <div className="flex items-center justify-between py-1.5 bg-slate-900 text-white px-3.5 rounded-xl font-sans mt-4">
                    <span className="font-semibold text-xs uppercase tracking-wide">{language === 'bn' ? 'মোট অবশিষ্টাংশ মেস ব্যালেন্স:' : 'Consolidated Net Balance Margin:'}</span>
                    <span className="font-black text-base">{netMarginalBalance} Tk</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3">
                  <div className="p-3 bg-blue-10/20 text-blue-600 rounded-2xl border border-blue-50/20">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {language === 'bn' 
                      ? 'রিপোর্টটি সরাসরি ডাউনলোড করার পূর্বে অনুগ্রহ করে নির্বাচিত মাসের সকল ভাড়া আদায় এবং অপরিহার্য খরচসমূহ সযত্নে ইনপুট করে মিলিয়ে নিন।' 
                      : 'Ensure all Border rent ledgers and Essential monthly utility payments are logged accurately for the statement month.'}
                  </p>
                </div>
              </div>

              {/* Download Trigger Buttons Panels */}
              <div className="space-y-6">
                
                {/* PDF generation option */}
                <div 
                  onClick={downloadPDF}
                  className="bg-white hover:bg-slate-50/60 border border-slate-200/80 rounded-3xl p-6 shadow-xs cursor-pointer hover:border-blue-300 transition-all active:scale-[0.99] flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 group-hover:scale-105 transition-transform">
                      <FileText className="h-7 w-7" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900 leading-tight">
                        {language === 'bn' ? 'অফিসিয়াল পিডিএফ (PDF) ডাউনলোড' : 'Download Complete PDF Statement'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        {language === 'bn' 
                          ? 'অনুমোদিত ডাবল কলামযুক্ত প্রিন্ট-যোগ্য অফিসিয়াল পিডিএফ স্টেটমেন্ট ডাউনলোড করুন স্বাক্ষর প্যানেল সহ।' 
                          : 'Generates polished multi-section audit statement with room logs, utility ledgers, totals, and signatures.'}
                      </p>
                    </div>
                  </div>
                  <Download className="h-5 w-5 text-slate-400 group-hover:text-slate-800 transition-colors shrink-0" />
                </div>

                {/* Excel Export options */}
                <div 
                  onClick={downloadExcel}
                  className="bg-white hover:bg-slate-50/60 border border-slate-200/80 rounded-3xl p-6 shadow-xs cursor-pointer hover:border-emerald-300 transition-all active:scale-[0.99] flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 group-hover:scale-105 transition-transform">
                      <Layers className="h-7 w-7" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900 leading-tight">
                        {language === 'bn' ? 'মাল্টি-শীট এক্সেল (XLSX) ডাউনলোড' : 'Export Complete Multi-Sheet Excel'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        {language === 'bn' 
                          ? 'এক্সেলে রো বিশ্লেষণ করার জন্য ক্যাটাগরি অনুসারে মোট ৩টি অনন্য ডেটা টেবল শীট সম্বলিত হিসাব বিবরণী।' 
                          : 'Generates structural spreadsheet with unique worksheets for Summary, Rent Logs, and Essential Expenses.'}
                      </p>
                    </div>
                  </div>
                  <Download className="h-5 w-5 text-slate-400 group-hover:text-slate-800 transition-colors shrink-0" />
                </div>

                {/* PDF Print format direct trigger */}
                <div 
                  onClick={() => window.print()}
                  className="bg-white hover:bg-slate-50 hover:border-slate-300 border border-slate-200 rounded-3xl p-5 shadow-xs cursor-pointer transition-all active:scale-[0.99] flex items-center gap-3 select-none"
                >
                  <Printer className="h-4.5 w-4.5 text-slate-500" />
                  <span className="text-xs font-bold text-slate-600">
                    {language === 'bn' ? 'ব্রাউজার উইন্ডো প্রিন্ট মোড চালু করুন' : 'Print page directly using system print dialog'}
                  </span>
                </div>
              </div>

            </div>
          )}
        </>
      )}

      {/* RENT RECORD MODAL */}
      {isRentModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="bg-slate-50 border-b border-slate-200/85 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">
                {editingRent ? (language === 'bn' ? 'ভাড়া তথ্য এডিট করুন' : 'Edit Rent Record') : t('manager.add_rent')}
              </h3>
              <button 
                onClick={() => setIsRentModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRent} className="p-6 space-y-4">
              
              {/* Optional border picker for speed autofills */}
              {!editingRent && borders.length > 0 && (
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    {language === 'bn' ? 'বর্ডার প্রোফাইল অটো-ফিল' : 'Quick Autofill from border info'}
                  </label>
                  <select
                    onChange={(e) => handleBorderSelection(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="">{language === 'bn' ? '-- সিলেক্ট বর্ডার বা খালি রাখুন --' : '-- Optional: select to auto fill details --'}</option>
                    {borders.map(b => (
                      <option key={b.id} value={b.id}>{b.name} (Room {b.room || 'N/A'})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {/* Room No */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    {t('manager.room_no')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 403-B"
                    value={rentForm.roomNo}
                    onChange={(e) => setRentForm(prev => ({ ...prev, roomNo: e.target.value }))}
                    className="w-full text-sm rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  />
                </div>

                {/* Border Name */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    {t('manager.border_name')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nabid Ahamed"
                    value={rentForm.borderName}
                    onChange={(e) => setRentForm(prev => ({ ...prev, borderName: e.target.value }))}
                    className="w-full text-sm rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Allocated Rent */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    {t('manager.allocated_rent')}
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 5000"
                    value={rentForm.allocatedRent}
                    onChange={(e) => setRentForm(prev => ({ ...prev, allocatedRent: e.target.value }))}
                    className="w-full text-sm rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white font-mono"
                  />
                </div>

                {/* Rent paid */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    {t('manager.rent_paid')}
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 3500"
                    value={rentForm.rentPaid}
                    onChange={(e) => setRentForm(prev => ({ ...prev, rentPaid: e.target.value }))}
                    className="w-full text-sm rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white font-mono"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  {t('manager.notes')}
                </label>
                <textarea
                  placeholder={language === 'bn' ? 'জুন ঘরভাড়া পরিশোধ বকেয়া আংশিক' : 'e.g. Partially paid, due 1500'}
                  value={rentForm.notes}
                  onChange={(e) => setRentForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full text-sm rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white h-20"
                />
              </div>

              {/* Submit panel buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRentModalOpen(false)}
                  className="px-4.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-xs font-bold rounded-xl text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition shadow-md active:scale-[0.98]"
                >
                  {t('manager.submit')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ESSENTIAL COST MODAL */}
      {isCostModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="bg-slate-50 border-b border-slate-200/85 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">
                {editingCost ? (language === 'bn' ? 'অপরিহার্য খরচ সংশোধন' : 'Edit Essential Expense') : t('manager.add_cost')}
              </h3>
              <button 
                onClick={() => setIsCostModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCost} className="p-6 space-y-4">
              
              {/* Presets picker button lists */}
              {!editingCost && (
                <div>
                  <span className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                    {language === 'bn' ? 'সহজ খরচের বিবরণী ক্লিক করুন (প্রিসেট)' : 'Quick Preset Utility Templates'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {essentialCostPresets.map((preset) => (
                      <button
                        key={preset.title}
                        type="button"
                        onClick={() => setCostForm(prev => ({
                          ...prev,
                          title: language === 'bn' ? preset.subtitle : preset.title
                        }))}
                        className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-650 text-[11px] font-semibold rounded-xl cursor-pointer transition-all"
                      >
                        {language === 'bn' ? preset.subtitle : preset.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Title Input */}
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  {language === 'bn' ? 'ইউটিলিটি বা খরচের নাম' : 'Utility Description/Cost Title'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WiFi Bill June, Cleaning Lady"
                  value={costForm.title}
                  onChange={(e) => setCostForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full text-sm rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  {language === 'bn' ? 'টাকার পরিমাণ' : 'Cost Amount'}
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1500"
                  value={costForm.amount}
                  onChange={(e) => setCostForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full text-sm rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white font-mono"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  {t('manager.notes')}
                </label>
                <textarea
                  placeholder={language === 'bn' ? 'খরচের বিশেষ নোট' : 'e.g. Shared equally, invoice attached'}
                  value={costForm.notes}
                  onChange={(e) => setCostForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full text-sm rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white h-20"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCostModalOpen(false)}
                  className="px-4.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-xs font-bold rounded-xl text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition shadow-md active:scale-[0.98]"
                >
                  {t('manager.submit')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Notice Management Modal */}
      {isNoticeModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {editingNotice ? 'Edit Notice' : 'Create New Notice'}
              </h3>
              <button 
                onClick={() => setIsNoticeModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveNotice} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Notice Title *</label>
                <input
                  required
                  type="text"
                  value={noticeForm.title}
                  onChange={e => setNoticeForm({...noticeForm, title: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  placeholder="e.g. Month End Bill Payment"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Notice Content *</label>
                <textarea
                  required
                  rows={6}
                  value={noticeForm.content}
                  onChange={e => setNoticeForm({...noticeForm, content: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                  placeholder="Explain the notice in detail..."
                />
              </div>

              {!editingNotice && (
                 <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
                    <p className="text-[11px] text-indigo-700 font-bold flex items-start gap-2">
                       <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                       Saving this will automatically notify all <strong>{borders.length}</strong> active members in your mess.
                    </p>
                 </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsNoticeModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
                >
                  {editingNotice ? 'Update Notice' : 'Post Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
