import React from 'react';
import { Skeleton } from './Skeleton';

export const ChatListSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-transparent"
        >
          <Skeleton className="w-4 h-4 rounded-md" />
          <Skeleton className={`h-3 ${idx % 3 === 0 ? 'w-3/5' : idx % 3 === 1 ? 'w-4/5' : 'w-2/3'}`} rounded="rounded-md" />
        </div>
      ))}
    </div>
  );
};

export const ChatThreadSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="sr-only" role="status" aria-live="polite">
        Loading chat…
      </div>

      {Array.from({ length: rows }).map((_, idx) => {
        const isUser = idx % 2 === 1;
        return (
          <div key={idx} className="w-full">
            {isUser ? (
              <div className="flex gap-4 flex-row-reverse">
                <div className="max-w-[85%] w-full flex justify-end">
                  <div className="w-full sm:w-2/3">
                    <Skeleton className="h-10 w-full rounded-2xl rounded-tr-sm" rounded="rounded-2xl" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 items-start">
                <Skeleton className="w-7 h-7 rounded-full shrink-0" rounded="rounded-full" />
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-3 w-1/3" rounded="rounded-md" />
                  <Skeleton className="h-3 w-11/12" rounded="rounded-md" />
                  <Skeleton className="h-3 w-9/12" rounded="rounded-md" />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};


