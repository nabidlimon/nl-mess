import { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Member, Meal, Deposit, BazarCost } from '../types';
import { format } from 'date-fns';
import { Download, FileText, Image as ImageIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useMonth } from '../contexts/MonthContext';

export default function Settlement() {
  const { currentMess } = useAuth();
  const { t } = useLanguage();
  const { selectedMonth } = useMonth();
  const [members, setMembers] = useState<Member[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [costs, setCosts] = useState<BazarCost[]>([]);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentMess) {
      setLoading(false);
      return;
    }
    const unsubMembers = onSnapshot(query(collection(db, 'users'), where('messId', '==', currentMess.id), where('role', 'in', ['Manager', 'Border', 'MealManager'])), (snap) => setMembers(snap.docs.map(d => ({id:d.id, ...d.data()} as Member))), (error) => {
      console.warn("unsubMembers onSnapshot error:", error);
    });
    const unsubMeals = onSnapshot(query(collection(db, 'meals'), where('messId', '==', currentMess.id)), (snap) => setMeals(snap.docs.map(d => ({id:d.id, ...d.data()} as Meal))), (error) => {
      console.warn("unsubMeals onSnapshot error:", error);
    });
    const unsubDeposits = onSnapshot(query(collection(db, 'deposits'), where('messId', '==', currentMess.id)), (snap) => setDeposits(snap.docs.map(d => ({id:d.id, ...d.data()} as Deposit))), (error) => {
      console.warn("unsubDeposits onSnapshot error:", error);
    });
    const unsubCosts = onSnapshot(query(collection(db, 'bazarCosts'), where('messId', '==', currentMess.id)), (snap) => {
      setCosts(snap.docs.map(d => ({id:d.id, ...d.data()} as BazarCost)));
      setLoading(false);
    }, (error) => {
      console.warn("unsubCosts onSnapshot error:", error);
      setLoading(false);
    });

    return () => { unsubMembers(); unsubMeals(); unsubDeposits(); unsubCosts(); };
  }, [currentMess]);


  const currentMonthPrefix = selectedMonth;
  
  const currentMonthMeals = meals.filter(m => m.date.startsWith(currentMonthPrefix));
  const totalMeals = currentMonthMeals.reduce((sum, m) => sum + m.mealCount, 0);
  
  const currentMonthDeposits = deposits.filter(d => d.date.startsWith(currentMonthPrefix));
  
  const currentMonthCosts = costs.filter(c => c.date.startsWith(currentMonthPrefix));
  const totalBazarCost = currentMonthCosts.reduce((sum, c) => sum + c.totalPrice, 0);
  
  const mealRate = totalMeals > 0 ? totalBazarCost / totalMeals : 0;

  const settlementData = members.map(member => {
    const memberMeals = currentMonthMeals.filter(m => m.memberId === member.id).reduce((sum, m) => sum + m.mealCount, 0);
    const memberDeposits = currentMonthDeposits.filter(d => d.memberId === member.id).reduce((sum, d) => sum + d.amount, 0);
    const mealCost = memberMeals * mealRate;
    const balance = memberDeposits - mealCost;
    
    let status = 'Settled';
    if (balance > 1) status = 'Advance';
    if (balance < -1) status = 'Due';

    return {
      member,
      totalMeals: memberMeals,
      deposit: memberDeposits,
      mealCost,
      balance,
      status
    };
  });

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(settlementData.map(d => ({
      Name: d.member.name,
      'Total Meals': d.totalMeals,
      Deposit: d.deposit,
      'Meal Cost': d.mealCost.toFixed(2),
      Balance: d.balance.toFixed(2),
      Status: d.status
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Settlement");
    XLSX.writeFile(wb, `Settlement_${currentMonthPrefix}.xlsx`);
  };

  const captureFullReport = async (): Promise<string | null> => {
    if (!reportRef.current) return null;
    
    const target = reportRef.current;
    const scrollContainers = target.querySelectorAll('.overflow-x-auto');
    const table = target.querySelector('table');
    
    // Temporarily make container overflow visible so everything renders
    scrollContainers.forEach((el) => {
      (el as HTMLElement).style.overflow = 'visible';
    });

    const containerStyle = target.style.cssText;
    const fullWidth = table ? Math.max(target.offsetWidth, table.offsetWidth) : target.offsetWidth;
    
    // For mobile or small screens, enforce actual table width
    target.style.width = `${fullWidth}px`;

    try {
      const imgData = await toPng(target, { 
        pixelRatio: 2,
        width: fullWidth,
        style: { transform: 'none' }
      });
      return imgData;
    } catch (err) {
      console.error('Capture error:', err);
      return null;
    } finally {
      target.style.cssText = containerStyle;
      scrollContainers.forEach((el) => {
        (el as HTMLElement).style.overflow = '';
      });
    }
  };

  const exportToPDF = async () => {
    const imgData = await captureFullReport();
    if (!imgData) return;
    try {
      const img = new Image();
      img.src = imgData;
      await new Promise(resolve => { img.onload = resolve; });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (img.height * pdfWidth) / img.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Settlement_${currentMonthPrefix}.pdf`);
    } catch (err) {
      console.error('Error generating PDF', err);
    }
  };

  const exportToImage = async () => {
    const imgData = await captureFullReport();
    if (!imgData) return;
    try {
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `Settlement_${currentMonthPrefix}.png`;
      link.click();
    } catch (err) {
      console.error('Error generating Image', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('settlement.title')}</h1>
          <p className="text-sm text-gray-500">{t('settlement.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <button 
             onClick={exportToExcel}
             className="bg-white border text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition text-sm font-medium cursor-pointer"
           >
             <Download className="w-4 h-4" /> Excel
           </button>
           <button 
             onClick={exportToPDF}
             className="bg-white border text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition text-sm font-medium cursor-pointer"
           >
             <FileText className="w-4 h-4" /> PDF
           </button>
           <button 
             onClick={exportToImage}
             className="bg-red-600 border border-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition text-sm font-medium cursor-pointer"
           >
             <ImageIcon className="w-4 h-4" /> Photo
           </button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-6 bg-white p-2 sm:p-4 rounded-xl">

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-8">
        <div>
          <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">{t('settlement.meal_rate')}</p>
          <p className="text-2xl font-bold text-blue-900">{mealRate.toFixed(2)} {t('common.currency')}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">{t('settlement.total_bazar')}</p>
          <p className="text-2xl font-bold text-blue-900">{totalBazarCost.toFixed(2)} {t('common.currency')}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{t('settlement.individual_ledger')}</h4>
          </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="px-6 py-3">{t('settlement.table_member')}</th>
                <th className="px-6 py-3 text-center">{t('settlement.table_meals')}</th>
                <th className="px-6 py-3 text-right">{t('settlement.table_deposit')}</th>
                <th className="px-6 py-3 text-right">{t('settlement.table_cost')}</th>
                <th className="px-6 py-3 text-right">{t('settlement.table_balance')}</th>
                <th className="px-6 py-3 text-right">{t('settlement.table_status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-500">{t('common.loading')}</td></tr>
              ) : settlementData.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-500">No data found.</td></tr>
              ) : settlementData.map(data => (
                <tr key={data.member.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-900 text-sm">{data.member.name}</td>
                  <td className="px-6 py-3 text-center font-mono text-sm">{data.totalMeals}</td>
                  <td className="px-6 py-3 text-right font-mono text-slate-500 text-sm">{data.deposit.toFixed(2)} {t('common.currency')}</td>
                  <td className="px-6 py-3 text-right font-mono text-slate-500 text-sm">{data.mealCost.toFixed(2)} {t('common.currency')}</td>
                  <td className={`px-6 py-3 text-right font-mono text-sm ${
                    data.balance > 0 ? 'text-green-600 font-bold' : data.balance < 0 ? 'text-red-600 font-bold' : 'text-slate-500'
                  }`}>
                    {data.balance > 0 ? '+' : ''}{data.balance.toFixed(2)} {t('common.currency')}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className={`px-2 py-1 inline-flex text-[10px] font-bold rounded uppercase tracking-wider ${
                      data.status === 'Advance' ? 'bg-green-100 text-green-700 ring-1 ring-green-200' : 
                      data.status === 'Due' ? 'bg-red-100 text-red-700 ring-1 ring-red-200' : 
                      'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
                    }`}>
                      {data.status === 'Advance' ? t('settlement.status_receive') : data.status === 'Due' ? t('settlement.status_must_pay') : t('settlement.status_cleared')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
