import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PieChart, Plus, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export function MealPollsWidget() {
  const { currentMess, userProfile } = useAuth();
  const { language } = useLanguage();
  const [polls, setPolls] = useState<any[]>([]);
  const isAdmin = userProfile?.role === 'Manager' || userProfile?.role === 'MealManager';

  const [isCreating, setIsCreating] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '']);

  useEffect(() => {
    if (!currentMess) return;
    const q = query(collection(db, 'polls'), where('messId', '==', currentMess.id));
    const unsub = onSnapshot(q, (snap) => {
       const data = snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a: any, b: any) => {
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
       });
       setPolls(data);
    }, (error) => {
       console.warn("MealPollsWidget onSnapshot error:", error);
    });
    return () => unsub();
  }, [currentMess]);

  const handleVote = async (pollId: string, optionIndex: number) => {
     if (!userProfile) return;
     const poll = polls.find(p => p.id === pollId);
     if (!poll) return;

     const ref = doc(db, 'polls', pollId);
     const currentVotes = poll.votes || {};
     
     // Remove previous vote if any
     Object.keys(currentVotes).forEach(idx => {
        if (currentVotes[idx]?.includes(userProfile.id)) {
           currentVotes[idx] = currentVotes[idx].filter((id: string) => id !== userProfile.id);
        }
     });

     // Add new vote
     if (!currentVotes[optionIndex]) currentVotes[optionIndex] = [];
     currentVotes[optionIndex].push(userProfile.id);

     await updateDoc(ref, { votes: currentVotes });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!currentMess || !newQuestion.trim() || newOptions.some(o => !o.trim())) return;
     try {
       await addDoc(collection(db, 'polls'), {
          messId: currentMess.id,
          question: newQuestion,
          options: newOptions,
          votes: {},
          createdAt: serverTimestamp(),
          active: true
       });
       setNewQuestion('');
       setNewOptions(['', '']);
       setIsCreating(false);
     } catch(e) {
       console.error("error creating poll", e);
     }
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
            <PieChart className="w-5 h-5" />
            </span>
            <h2 className="text-sm font-black tracking-widest text-slate-800 uppercase">{language === 'bn' ? 'খাবারের পোল' : "Meal Polls"}</h2>
        </div>
        {isAdmin && !isCreating && (
           <button onClick={() => setIsCreating(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold transition-all hover:bg-slate-800">
              <Plus className="w-4 h-4" />
              <span>{language === 'bn' ? 'নতুন পোল' : 'New Poll'}</span>
           </button>
        )}
      </div>

      {isCreating && (
         <form onSubmit={handleCreateSubmit} className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <input 
               type="text" required value={newQuestion} onChange={e => setNewQuestion(e.target.value)}
               placeholder={language === 'bn' ? "প্রশ্ন (যেমন: শুক্রবার কি খাবেন?)" : "Question (e.g. What to eat on Friday?)"}
               className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {newOptions.map((opt, i) => (
               <input 
                  key={i} type="text" required value={opt} onChange={e => {
                     const updated = [...newOptions];
                     updated[i] = e.target.value;
                     setNewOptions(updated);
                  }}
                  placeholder={`Option ${i+1}`}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500"
               />
            ))}
            <div className="flex items-center gap-2 pt-2">
               <button type="button" onClick={() => setNewOptions([...newOptions, ''])} className="px-3 py-1.5 text-xs font-bold text-slate-500 rounded-xl border border-slate-200 bg-white hover:bg-slate-50">+ Add Option</button>
               <div className="flex-1"></div>
               <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-xs font-bold text-slate-500">Cancel</button>
               <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700">Create</button>
            </div>
         </form>
      )}

      {polls.length === 0 && !isCreating ? (
         <p className="text-xs text-slate-400 text-center py-6">{language === 'bn' ? 'কোন সক্রিয় পোল নেই।' : 'No active polls right now.'}</p>
      ) : (
         <div className="space-y-4">
            {polls.map((poll) => {
               const totalVotes = Object.values(poll.votes || {}).reduce((acc: any, curr: any) => acc + curr.length, 0) as number;
               return (
                  <div key={poll.id} className="border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
                     <h3 className="font-bold text-slate-800 text-sm mb-3">{poll.question}</h3>
                     <div className="space-y-2">
                        {poll.options.map((opt: string, idx: number) => {
                           const voters = (poll.votes || {})[idx] || [];
                           const count = voters.length;
                           const isMyVote = voters.includes(userProfile?.id);
                           const percent = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
                           return (
                              <div key={idx} onClick={() => handleVote(poll.id, idx)} className={cn(
                                 "relative overflow-hidden p-2.5 rounded-xl border cursor-pointer transition-all flex justify-between items-center z-0",
                                 isMyVote ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50"
                              )}>
                                 <div className="absolute inset-y-0 left-0 bg-indigo-100 transition-all z-[-1]" style={{ width: `${percent}%`, opacity: isMyVote ? 0.6 : 0.3 }} />
                                 <div className="flex items-center gap-2">
                                    {isMyVote ? <CheckCircle2 className="w-4 h-4 text-indigo-600" /> : <div className="w-4 h-4 rounded-full border border-slate-300" />}
                                    <span className={cn("text-xs font-bold", isMyVote ? "text-indigo-900" : "text-slate-700")}>{opt}</span>
                                 </div>
                                 <span className="text-xs font-bold text-slate-500">{percent.toFixed(0)}% ({count})</span>
                              </div>
                           )
                        })}
                     </div>
                  </div>
               )
            })}
         </div>
      )}
    </div>
  )
}
