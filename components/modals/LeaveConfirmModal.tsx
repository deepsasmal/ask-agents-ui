import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '../ui/Common';

interface LeaveConfirmModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  onStay: () => void;
  onLeave: () => void;
  onDiscard: () => void;
}

export const LeaveConfirmModal: React.FC<LeaveConfirmModalProps> = ({
  isOpen,
  title = 'Leave Data Insights?',
  description = 'You have changes in progress. If you leave now, you may lose your place in the flow.',
  onStay,
  onLeave,
  onDiscard
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onStay();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onStay]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        aria-label="Close modal"
        onClick={onStay}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-fade-in motion-reduce:animate-none">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-200 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-extrabold text-slate-900 dark:text-white truncate">{title}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {description}
              </div>
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                Tip: your draft is kept locally so your AI/manual descriptions will be there when you return.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onStay}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30 p-4 text-sm text-slate-600 dark:text-slate-300">
            Leaving won’t publish anything yet. You can come back and continue, or discard your draft if you want a clean slate.
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onDiscard}
            className="text-left text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            Discard draft &amp; leave
          </button>

          <div className="flex items-center gap-2 justify-end">
            <Button variant="secondary" onClick={onLeave}>
              Leave
            </Button>
            <Button onClick={onStay} className="shadow-brand-600/20">
              Stay
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};


