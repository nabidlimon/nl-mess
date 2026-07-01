import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { AlertTriangle, RefreshCcw, WifiOff, Trash2 } from 'lucide-react';
import { ReactNode } from 'react';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const isNetworkError = error.message.toLowerCase().includes('network') || error.message.toLowerCase().includes('fetch');
  
  const handleHardRefresh = () => {
    // Clear local storages just in case it's a corrupted cache
    localStorage.clear();
    sessionStorage.clear();
    // Force hard reload bypassing cache
    window.location.href = window.location.origin + window.location.pathname + '?refresh=' + new Date().getTime();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-md w-full bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-500/20 shadow-inner">
          {isNetworkError ? <WifiOff className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
        </div>
        
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
          {isNetworkError ? 'Connection Lost' : 'App Needs an Update'}
        </h2>
        
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-8">
          {isNetworkError 
            ? "We couldn't connect to the server. Please check your internet connection and try again." 
            : "A new version of NL Mess Pro is available, but your browser is running an outdated cached version which caused a glitch."}
        </p>

        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl text-left border border-slate-100 dark:border-slate-800 mb-8 overflow-hidden">
          <p className="text-xs text-slate-400 font-mono break-all truncate">
            Error: {error.message}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleHardRefresh}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
          >
            <RefreshCcw className="w-5 h-5" />
            Clear Cache & Reload App
          </button>
          
          <button
            onClick={resetErrorBoundary}
            className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Try Again Softly
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset the state of your app so the error doesn't happen again
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
