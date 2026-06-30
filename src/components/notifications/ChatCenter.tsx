import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, X, Sparkles, Loader2, Smile } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useGamification } from '../../hooks/useGamification';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🙏', '🔥', '✅'];

const roleStyle: Record<string, string> = {
  Manager: 'bg-rose-100 text-rose-600',
  MealManager: 'bg-sky-100 text-sky-600',
  Border: 'bg-slate-100 text-slate-500',
};

function formatTime(ts: any) {
  if (!ts || typeof ts.toMillis !== 'function') return '';
  return new Date(ts.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ChatCenter() {
  const { userProfile, currentMess } = useAuth();
  const { language } = useLanguage();
  const { badges } = useGamification();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialLoadRef = useRef(true);
  const prevMsgCountRef = useRef(0);

  const scrollToBottom = useCallback((instant = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'instant' : 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => scrollToBottom(true), 80);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    if (!isOpen) return;
    if (messages.length > prevMsgCountRef.current) {
      scrollToBottom(false);
    }
    prevMsgCountRef.current = messages.length;
  }, [messages, isOpen, scrollToBottom]);

  useEffect(() => {
    if (!userProfile?.messId) return;
    const q = query(collection(db, 'chatMessages'), where('messId', '==', userProfile.messId));
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map(d => ({ id: d.id, ...(d.data() as any) }))
        .sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0));
      setMessages(msgs);
      if (!initialLoadRef.current && !isOpen) setUnreadCount(prev => prev + 1);
      initialLoadRef.current = false;
    });
    return unsub;
  }, [userProfile?.messId, isOpen]);

  const doSend = useCallback(async (content: string) => {
    if (!userProfile || !content.trim()) return;
    setIsSending(true);
    try {
      await addDoc(collection(db, 'chatMessages'), {
        messId: userProfile.messId || '',
        senderId: userProfile.id || '',
        senderName: userProfile.name || 'Unknown',
        senderRole: userProfile.role || 'Border',
        senderPhoto: (userProfile as any).photoURL || '',
        content: content.trim(),
        type: 'text',
        mediaUrl: '',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Send failed:', err);
    }
    setIsSending(false);
  }, [userProfile]);

  const handleSend = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || isSending) return;
    const msg = text;
    setText('');
    setShowEmojis(false);
    await doSend(msg);
    inputRef.current?.focus();
  }, [text, isSending, doSend]);

  const handleEmojiPick = useCallback(async (emoji: string) => {
    setShowEmojis(false);
    await doSend(emoji);
    inputRef.current?.focus();
  }, [doSend]);

  const open = () => { setIsOpen(true); setUnreadCount(0); };
  const close = () => { setIsOpen(false); setShowEmojis(false); };

  const grouped = messages.map((msg, i) => ({
    ...msg,
    isFirst: i === 0 || messages[i - 1].senderId !== msg.senderId,
    isLast: i === messages.length - 1 || messages[i + 1].senderId !== msg.senderId,
  }));

  const messName = currentMess?.name || (language === 'bn' ? 'মেস চ্যাট' : 'Mess Chat');

  const MessageBubble = ({ msg }: { msg: any }) => {
    const isSelf = msg.senderId === userProfile?.id;
    return (
      <div className={cn('flex gap-2', isSelf ? 'flex-row-reverse' : 'flex-row', msg.isFirst && 'mt-3')}>
        <div className="w-7 shrink-0 self-end">
          {msg.isLast && (
            msg.senderPhoto
              ? <img src={msg.senderPhoto} alt={msg.senderName} className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200" referrerPolicy="no-referrer" />
              : <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 text-white flex items-center justify-center font-bold text-xs">{msg.senderName?.charAt(0)?.toUpperCase()}</div>
          )}
        </div>
        <div className={cn('flex flex-col max-w-[75%]', isSelf ? 'items-end' : 'items-start')}>
          {msg.isFirst && !isSelf && (
            <div className="flex items-center gap-1.5 mb-1 ml-1">
              <span className="text-[11px] font-bold text-slate-600">{msg.senderName}</span>
              <span className={cn('text-[9px] font-semibold px-1.5 py-0.5 rounded-md uppercase', roleStyle[msg.senderRole] || roleStyle.Border)}>
                {msg.senderRole}
              </span>
              {badges[msg.senderId]?.map((b: string) => (
                <span key={b} className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-md uppercase">{b}</span>
              ))}
            </div>
          )}
          <div className={cn(
            'px-3.5 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap',
            isSelf ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20' : 'bg-white text-slate-800 border border-slate-100 shadow-sm',
            isSelf
              ? msg.isFirst && msg.isLast ? 'rounded-2xl rounded-tr-sm' : msg.isFirst ? 'rounded-2xl rounded-tr-sm' : msg.isLast ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-r-sm'
              : msg.isFirst && msg.isLast ? 'rounded-2xl rounded-tl-sm' : msg.isFirst ? 'rounded-2xl rounded-tl-sm' : msg.isLast ? 'rounded-2xl rounded-bl-sm' : 'rounded-2xl rounded-l-sm'
          )}>
            {msg.content}
          </div>
          {msg.isLast && <span className="text-[10px] text-slate-400 mt-1 px-1">{formatTime(msg.createdAt)}</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Floating Action Button */}
      <button
        onClick={open}
        className={cn(
          'relative w-14 h-14 rounded-2xl flex items-center justify-center cursor-pointer',
          'bg-gradient-to-br from-indigo-500 to-blue-600',
          'shadow-xl shadow-indigo-500/40',
          'hover:scale-110 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-indigo-500/50',
          'active:scale-95 transition-all duration-200',
          isOpen && 'scale-95'
        )}
        title={language === 'bn' ? 'মেস গ্রুপ চ্যাট' : 'Mess Chat'}
      >
        <MessageSquare className="w-6 h-6 text-white drop-shadow-sm" />
        {unreadCount > 0 && (
          <>
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-2xl bg-indigo-400 animate-ping opacity-30" />
            {/* Badge */}
            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-red-500 rounded-full text-white text-[10px] font-black flex items-center justify-center px-1.5 border-2 border-white shadow-md">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          /* ── Centered Modal (mobile + desktop) ── */
          <motion.div
            key="chat-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={close}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 16 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-black/30 flex flex-col overflow-hidden"
              style={{ height: 'min(600px, 82vh)' }}
            >
              {/* Header */}
              <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-white">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-slate-800 truncate">{messName}</h3>
                  <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    {language === 'bn' ? 'গ্রুপ চ্যাট' : 'Group Chat'}
                  </p>
                </div>
                <button
                  onClick={close}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-0.5 min-h-0 bg-slate-50/60">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-center p-8">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
                      <Sparkles className="w-7 h-7 text-indigo-300" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">{language === 'bn' ? 'কথোপকথন শুরু করুন' : 'Start the conversation'}</p>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-[200px] mx-auto">
                        {language === 'bn' ? 'মেসের সবাই এই চ্যাটে মেসেজ দেখতে পারবে।' : 'All mess members can see messages here in real-time.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  grouped.map(msg => <MessageBubble key={msg.id} msg={msg} />)
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick emojis */}
              <AnimatePresence>
                {showEmojis && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex-shrink-0 overflow-hidden"
                  >
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-t border-slate-100">
                      {QUICK_EMOJIS.map(e => (
                        <button key={e} onClick={() => handleEmojiPick(e)} className="text-xl hover:scale-125 transition-transform active:scale-95">{e}</button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input bar */}
              <form
                onSubmit={handleSend}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-3 bg-white border-t border-slate-100"
              >
                <button
                  type="button"
                  onClick={() => setShowEmojis(v => !v)}
                  className={cn('w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0', showEmojis ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 hover:text-slate-600')}
                >
                  <Smile className="w-4.5 h-4.5" />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={language === 'bn' ? 'ম্যাসেজ লিখুন...' : 'Message the mess...'}
                  className="flex-1 px-4 py-2.5 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:bg-white border border-transparent focus:border-indigo-200 transition-all"
                  maxLength={500}
                  disabled={isSending}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={isSending || !text.trim()}
                  className={cn(
                    'w-9 h-9 rounded-2xl flex items-center justify-center transition-all shrink-0',
                    text.trim() && !isSending
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-90 shadow-md shadow-indigo-500/25 cursor-pointer'
                      : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  )}
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 translate-x-px" />}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
