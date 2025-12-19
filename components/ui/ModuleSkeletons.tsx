import React from 'react';
import { Skeleton } from './Skeleton';

export const CenteredPanelSkeleton: React.FC<{
  titleLines?: number;
  bodyLines?: number;
  maxWidthClassName?: string;
}> = ({ titleLines = 1, bodyLines = 2, maxWidthClassName = 'max-w-lg' }) => {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-50/50 dark:bg-slate-900/20">
      <div className={`bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 w-full ${maxWidthClassName}`}>
        <div className="space-y-3">
          {Array.from({ length: titleLines }).map((_, idx) => (
            <Skeleton key={idx} className={`h-4 ${idx === 0 ? 'w-1/2' : 'w-2/3'}`} rounded="rounded-md" />
          ))}
          <div className="pt-2 space-y-2">
            {Array.from({ length: bodyLines }).map((_, idx) => (
              <Skeleton key={idx} className={`h-3 ${idx % 2 === 0 ? 'w-full' : 'w-5/6'}`} rounded="rounded-md" />
            ))}
          </div>
          <div className="pt-4 flex items-center gap-3">
            <Skeleton className="h-9 w-28 rounded-xl" rounded="rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" rounded="rounded-xl" />
          </div>
        </div>
        <div className="sr-only" role="status" aria-live="polite">
          Loading…
        </div>
      </div>
    </div>
  );
};

export const CardListSkeleton: React.FC<{
  rows?: number;
  showHeader?: boolean;
}> = ({ rows = 6, showHeader = true }) => {
  return (
    <div className="p-6 bg-slate-50/50 dark:bg-slate-950 flex-1 overflow-hidden">
      <div className="w-full max-w-5xl mx-auto space-y-4">
        {showHeader && (
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-44" rounded="rounded-md" />
            <Skeleton className="h-3 w-28" rounded="rounded-md" />
          </div>
        )}
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_10px_30px_-22px_rgba(15,23,42,0.35)] overflow-hidden"
            >
              <div className="px-5 py-4 flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-xl" rounded="rounded-xl" />
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className={`h-3 ${idx % 3 === 0 ? 'w-1/3' : idx % 3 === 1 ? 'w-1/2' : 'w-2/5'}`} rounded="rounded-md" />
                  <Skeleton className="h-3 w-2/3" rounded="rounded-md" />
                </div>
                <Skeleton className="h-7 w-16 rounded-full" rounded="rounded-full" />
              </div>
              <div className="px-5 pb-4">
                <Skeleton className="h-3 w-11/12" rounded="rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const KeyValueListSkeleton: React.FC<{ rows?: number }> = ({ rows = 10 }) => {
  return (
    <div className="p-4">
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="flex items-start gap-4">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className={`h-3 ${idx % 4 === 0 ? 'w-1/3' : idx % 4 === 1 ? 'w-1/2' : idx % 4 === 2 ? 'w-2/5' : 'w-3/5'}`} rounded="rounded-md" />
                <Skeleton className="h-5 w-14 rounded-full" rounded="rounded-full" />
              </div>
              <Skeleton className="h-3 w-11/12" rounded="rounded-md" />
              <Skeleton className="h-3 w-8/12" rounded="rounded-md" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Skeleton className="h-9 w-9 rounded-xl" rounded="rounded-xl" />
              <Skeleton className="h-9 w-9 rounded-xl" rounded="rounded-xl" />
              <Skeleton className="h-9 w-16 rounded-xl" rounded="rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const KnowledgeTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 8 }) => {
  return (
    <div className="flex-1 overflow-hidden flex bg-white dark:bg-slate-950">
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-10">
          <Skeleton className="h-3 w-40" rounded="rounded-md" />
          <Skeleton className="h-9 w-36 rounded-lg" rounded="rounded-lg" />
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/50 dark:bg-slate-950">
          <div className="space-y-3">
            {Array.from({ length: rows }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden"
              >
                <div className="px-5 py-4 flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-xl" rounded="rounded-xl" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className={`h-3 ${idx % 3 === 0 ? 'w-2/5' : idx % 3 === 1 ? 'w-1/3' : 'w-1/2'}`} rounded="rounded-md" />
                    <Skeleton className="h-3 w-10/12" rounded="rounded-md" />
                  </div>
                  <Skeleton className="h-6 w-14 rounded-full" rounded="rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="hidden lg:block w-1/3 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
        <Skeleton className="h-4 w-40" rounded="rounded-md" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-3 w-full" rounded="rounded-md" />
          <Skeleton className="h-3 w-11/12" rounded="rounded-md" />
          <Skeleton className="h-3 w-9/12" rounded="rounded-md" />
        </div>
      </div>
    </div>
  );
};


