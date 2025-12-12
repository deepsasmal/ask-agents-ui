import React from 'react';
import { BarChart2, Construction } from 'lucide-react';

export const DataInsightsModule: React.FC = () => {
    return (
        <div className="flex-1 h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 flex-col">
            <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center mb-6 shadow-sm dark:bg-brand-900/20">
                <BarChart2 className="w-12 h-12 text-brand-600 dark:text-brand-400" />
            </div>

            <h2 className="text-3xl font-bold text-slate-900 mb-3 dark:text-white">Data Insights</h2>

            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full border border-amber-200 text-amber-700 text-sm font-medium mb-6 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400">
                <Construction className="w-4 h-4" />
                <span>Coming Soon</span>
            </div>

            <p className="text-slate-500 max-w-md text-center leading-relaxed dark:text-slate-400">
                Experience AI-driven auto insights. Automatically visualize trends and uncover hidden patterns. Get ready for advanced charting and predictive analytics.
            </p>
        </div>
    );
};
