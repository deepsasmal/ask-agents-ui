import React, { useMemo, useRef } from 'react';
import { Maximize2, Download } from 'lucide-react';
import { Chart, ChartRef } from '../ui/Chart';

interface ChartRendererProps {
  toolResult: any;
  chartType: 'bar' | 'line' | 'pie';
  onExpand: (options: any) => void;
}

export const ChartRenderer: React.FC<ChartRendererProps> = React.memo(({ toolResult, chartType, onExpand }) => {
  const chartRef = useRef<ChartRef>(null);
  
  console.log('🎨 ChartRenderer mounted/updated', { chartType, toolResult });

  const chartOptions = useMemo(() => {
    try {
      console.log('🔍 Raw toolResult:', toolResult);
      console.log('🔍 toolResult type:', typeof toolResult);
      
      const parsed = typeof toolResult === 'string' ? JSON.parse(toolResult) : toolResult;
      console.log('🔍 Parsed result:', parsed);
      console.log('🔍 parsed.option:', parsed?.option);
      
      let options = parsed?.option || null;
      console.log('🔍 Extracted options:', options);
      
      if (!options) {
        console.warn('❌ No options found in tool result!');
        return null;
      }

      // Fix malformed pie chart data structure
      if (chartType === 'pie' && options.series && options.series.length > 0) {
        const firstSeries = options.series[0];
        
        // Check if data is in malformed format: [{value: [labels...], name: "labels"}, {value: [values...], name: "values"}]
        if (Array.isArray(firstSeries.data) && 
            firstSeries.data.length === 2 &&
            firstSeries.data[0].name === 'labels' &&
            firstSeries.data[1].name === 'values') {
          
          const labels = firstSeries.data[0].value;
          const values = firstSeries.data[1].value;
          
          console.log('🥧 Detected malformed pie chart data');
          console.log('Labels:', labels);
          console.log('Values:', values);
          
          // Transform to proper pie chart format: [{name: label, value: value}, ...]
          const properData = labels.map((label: string, idx: number) => ({
            name: label,
            value: values[idx]
          }));
          
          console.log('✅ Transformed pie data:', properData);
          
          // Reconstruct the options with proper structure
          options = {
            title: options.title,
            tooltip: {
              trigger: 'item',
              formatter: '{b}: {c} ({d}%)'
            },
            legend: options.legend,
            series: [{
              name: firstSeries.name || 'Data',
              type: 'pie',
              radius: '60%',
              data: properData,
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              }
            }]
          };
        }
      }

      // Fix malformed bar/line chart data structure where xAxis has ["categories", "values"]
      // and series data is [[categories...], [values...]]
      if ((chartType === 'bar' || chartType === 'line') && options.series && options.series.length > 0) {
        const firstSeries = options.series[0];
        
        // Check if data is in nested array format: [[categories], [values]]
        if (Array.isArray(firstSeries.data) && 
            firstSeries.data.length === 2 && 
            Array.isArray(firstSeries.data[0]) && 
            Array.isArray(firstSeries.data[1])) {
          
          const categories = firstSeries.data[0];
          const values = firstSeries.data[1];
          
          console.log('📊 Detected malformed bar/line chart data');
          console.log('Categories:', categories);
          console.log('Values:', values);
          
          // Reconstruct the options with proper structure
          options = {
            title: options.title,
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: chartType === 'bar' ? 'shadow' : 'cross'
              }
            },
            grid: {
              left: '3%',
              right: '4%',
              bottom: '3%',
              containLabel: true
            },
            xAxis: {
              type: 'category',
              data: categories,
              axisLabel: {
                interval: 0,
                rotate: categories.length > 5 ? 30 : 0
              }
            },
            yAxis: {
              type: 'value'
            },
            series: [{
              name: options.title?.text || 'Value',
              type: chartType,
              data: values,
              itemStyle: {
                color: '#14b8a6'
              },
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowColor: 'rgba(0, 0, 0, 0.3)'
                }
              }
            }]
          };
          
          console.log('✅ Transformed bar/line options:', JSON.stringify(options, null, 2));
        } else {
          console.log('ℹ️ Using bar/line options as-is (not malformed)');
        }
      }
      
      return options;
    } catch (e) {
      console.error(`Failed to parse ${chartType} chart options`, e);
      return null;
    }
  }, [toolResult, chartType]);

  const handleDownload = () => {
    const chartTitle = chartOptions?.title?.text || 'chart';
    const filename = `${chartTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
    chartRef.current?.downloadChart(filename);
  };

  if (!chartOptions) {
    console.warn('⚠️ ChartRenderer returning null - no chart options');
    return null;
  }
  
  console.log('✅ ChartRenderer rendering chart with options:', chartOptions);

  return (
    <div className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in group/chart">
      <div className="relative">
        {/* Action Buttons */}
        <div className="absolute top-3 right-3 z-10 flex gap-2 opacity-0 group-hover/chart:opacity-100 transition-all">
          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="p-2 bg-white/90 hover:bg-white text-slate-600 hover:text-green-600 rounded-lg shadow-md hover:shadow-lg transition-all border border-slate-200 hover:border-green-300"
            title="Download Chart"
          >
            <Download className="w-4 h-4" />
          </button>
          {/* Expand Button */}
          <button
            onClick={() => onExpand(chartOptions)}
            className="p-2 bg-white/90 hover:bg-white text-slate-600 hover:text-brand-600 rounded-lg shadow-md hover:shadow-lg transition-all border border-slate-200 hover:border-brand-300"
            title="Expand Chart"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
        {/* Chart */}
        <div className="p-4">
          <Chart 
            ref={chartRef}
            options={chartOptions} 
            height="400px"
            className="w-full" 
            interactive={true} 
            chartType={chartType}
          />
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent re-render if toolResult hasn't changed
  return prevProps.toolResult === nextProps.toolResult && 
         prevProps.chartType === nextProps.chartType;
});

ChartRenderer.displayName = 'ChartRenderer';

