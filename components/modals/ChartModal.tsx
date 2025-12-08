import React, { useEffect, useRef } from 'react';
import { X, Maximize2, Download } from 'lucide-react';
import { Chart, ChartRef } from '../ui/Chart';

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartOptions: any;
  title?: string;
}

export const ChartModal: React.FC<ChartModalProps> = ({ isOpen, onClose, chartOptions, title = 'Chart View' }) => {
  const chartRef = useRef<ChartRef>(null);

  const handleDownload = () => {
    const chartTitle = chartOptions?.title?.text || title || 'chart';
    const filename = `${chartTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
    chartRef.current?.downloadChart(filename);
  };
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-[90vw] h-[85vh] max-w-7xl flex flex-col animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-50 rounded-lg">
              <Maximize2 className="w-5 h-5 text-brand-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-2 text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-sm font-medium"
              title="Download Chart"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Close (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chart Container */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="w-full h-full bg-slate-50 rounded-xl p-4 border border-slate-200">
            {chartOptions && (
              <Chart 
                ref={chartRef}
                options={chartOptions} 
                height="100%" 
                className="w-full h-full"
                interactive={true}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

