import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as echarts from 'echarts';

interface ChartProps {
  options: any; // EChartsOption
  height?: string;
  className?: string;
  interactive?: boolean; // Enable enhanced interactivity
  chartType?: 'bar' | 'line' | 'pie' | 'auto'; // Chart type for specialized enhancements
}

export interface ChartRef {
  downloadChart: (filename?: string) => void;
  getChartInstance: () => echarts.ECharts | null;
}

export const Chart = forwardRef<ChartRef, ChartProps>(({ options, height = '300px', className = '', interactive = true, chartType = 'auto' }, ref) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    downloadChart: (filename = 'chart.png') => {
      if (chartInstance.current) {
        const url = chartInstance.current.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: '#fff'
        });

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
    getChartInstance: () => chartInstance.current
  }));

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart only once
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // Enhance options with better interactivity
    if (options && interactive) {
      // Detect chart type from options if not specified
      const detectedType = chartType === 'auto'
        ? (options.series?.[0]?.type || 'bar')
        : chartType;

      const isLineChart = detectedType === 'line';
      const isPieChart = detectedType === 'pie';

      // Check if it's a grouped chart (multiple series)
      const isGroupedChart = options.series && options.series.length > 1 && !isPieChart;

      // Color palette for charts
      const chartColors = [
        '#14b8a6', // Brand teal
        '#3b82f6', // Blue
        '#8b5cf6', // Purple
        '#f59e0b', // Amber
        '#ef4444', // Red
        '#10b981', // Green
        '#ec4899', // Pink
        '#06b6d4'  // Cyan
      ];

      const enhancedOptions = {
        ...options,
        color: (isGroupedChart || isPieChart) ? chartColors : options.color || ['#14b8a6'],
        title: {
          ...options.title,
          left: 'center',
          top: 10,
          textStyle: {
            fontSize: 16,
            fontWeight: 600,
            color: '#1e293b',
            ...options.title?.textStyle
          }
        },
        xAxis: isPieChart ? undefined : {
          type: 'category',
          axisLine: {
            lineStyle: { color: '#cbd5e1' }
          },
          axisLabel: {
            color: '#334155',
            fontSize: 12,
            fontWeight: 500
          },
          ...options.xAxis
        },
        yAxis: isPieChart ? undefined : {
          type: 'value',
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            lineStyle: { color: '#f1f5f9' }
          },
          axisLabel: {
            color: '#334155',
            fontSize: 12,
            fontWeight: 500
          },
          ...options.yAxis
        },
        grid: isPieChart ? undefined : {
          top: options.title?.text ? 60 : 40,
          left: 50,
          right: 30,
          bottom: 50,
          containLabel: true,
          ...options.grid
        },
        tooltip: isPieChart ? {
          trigger: 'item',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          textStyle: {
            color: '#334155',
            fontSize: 12,
            fontWeight: 500
          },
          padding: [8, 12],
          extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); border-radius: 8px;',
          formatter: function (params: any) {
            const percent = params.percent || 0;
            const value = typeof params.value === 'number' ? params.value.toLocaleString() : params.value;
            return `<div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">${params.name}</div>
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${params.color};"></span>
                        <span style="color: #64748b; font-size: 11px;">Value</span>
                      </div>
                      <span style="font-weight: 700; color: #14b8a6;">${value}</span>
                    </div>
                    <div style="margin-top: 4px; text-align: right;">
                      <span style="color: #64748b; font-size: 11px;">Percentage: </span>
                      <span style="font-weight: 600; color: #8b5cf6;">${percent.toFixed(1)}%</span>
                    </div>`;
          },
          ...options.tooltip
        } : {
          trigger: 'axis',
          axisPointer: {
            type: isLineChart ? 'cross' : 'shadow',
            crossStyle: isLineChart ? {
              color: '#94a3b8',
              width: 1,
              type: 'dashed'
            } : undefined,
            shadowStyle: !isLineChart ? {
              color: 'rgba(20, 184, 166, 0.1)'
            } : undefined,
            label: isLineChart ? {
              backgroundColor: '#1e293b'
            } : undefined
          },
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          textStyle: {
            color: '#334155',
            fontSize: 12,
            fontWeight: 500
          },
          padding: [8, 12],
          extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); border-radius: 8px;',
          formatter: function (params: any) {
            // Enhanced formatter for grouped charts
            if (isGroupedChart && Array.isArray(params)) {
              let tooltip = `<div style="font-weight: 600; color: #1e293b; margin-bottom: 6px;">${params[0].name}</div>`;
              params.forEach((param: any) => {
                const value = typeof param.value === 'number' ? param.value.toLocaleString() : param.value;
                tooltip += `<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 4px;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${param.color};"></span>
                    <span style="color: #64748b; font-size: 11px;">${param.seriesName}</span>
                  </div>
                  <span style="font-weight: 700; color: #14b8a6; font-size: 12px;">${value}</span>
                </div>`;
              });
              return tooltip;
            } else {
              // Single series formatter
              const param = Array.isArray(params) ? params[0] : params;
              const value = typeof param.value === 'number' ? param.value.toLocaleString() : param.value;
              return `<div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">${param.name}</div>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${param.color};"></span>
                        <span style="font-weight: 700; color: #14b8a6;">${value}</span>
                      </div>`;
            }
          },
          ...options.tooltip
        },
        legend: isGroupedChart ? {
          top: 40,
          left: 'center',
          textStyle: {
            color: '#64748b',
            fontSize: 12
          },
          itemWidth: 14,
          itemHeight: 10,
          itemGap: 16,
          ...options.legend
        } : options.legend,
        emphasis: {
          focus: 'series',
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowOffsetY: 2,
            shadowColor: 'rgba(20, 184, 166, 0.3)'
          }
        }
      };

      // Enhance bar chart series specifically
      const isBarChart = detectedType === 'bar';
      if (isBarChart && enhancedOptions.series && Array.isArray(enhancedOptions.series)) {
        const hasMultipleSeries = enhancedOptions.series.length > 1;
        const isStacked = enhancedOptions.series.some((s: any) => !!s.stack);
        // If stacked, we treat it visually as single bar width-wise
        const shouldAutoSize = hasMultipleSeries && !isStacked;

        enhancedOptions.series = enhancedOptions.series.map((series: any, idx: number) => ({
          ...series,
          type: 'bar',
          // Auto-adjust width for grouped bars to prevent congestion
          // If grouped (not stacked), let ECharts handle width or restrict it
          barWidth: shouldAutoSize ? undefined : '60%',
          barMaxWidth: shouldAutoSize ? 30 : 80, // Restrict max width to prevent huge bars
          barGap: shouldAutoSize ? '20%' : undefined, // Gap between bars in a group
          barCategoryGap: '30%', // Gap between categories
          itemStyle: {
            // Use modulo to cycle through colors safely
            color: series.itemStyle?.color || chartColors[idx % chartColors.length] || '#14b8a6',
            borderRadius: [4, 4, 0, 0],
            ...series.itemStyle
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(20, 184, 166, 0.3)',
              ...series.emphasis?.itemStyle
            }
          },
          label: {
            show: false,
            position: 'top',
            ...series.label
          }
        }));
      }

      // Enhance line chart series specifically
      if (isLineChart && enhancedOptions.series) {
        enhancedOptions.series = enhancedOptions.series.map((series: any) => ({
          ...series,
          smooth: true, // Smooth curves
          symbolSize: 6, // Point size
          symbol: 'circle',
          lineStyle: {
            width: 2.5,
            ...series.lineStyle
          },
          itemStyle: {
            color: series.itemStyle?.color || '#14b8a6',
            borderWidth: 2,
            borderColor: '#fff',
            ...series.itemStyle
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(20, 184, 166, 0.2)' },
              { offset: 1, color: 'rgba(20, 184, 166, 0.02)' }
            ]),
            ...series.areaStyle
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(20, 184, 166, 0.5)',
              borderWidth: 3,
              ...series.emphasis?.itemStyle
            }
          }
        }));
      }

      // Enhance pie chart series specifically
      if (isPieChart && enhancedOptions.series) {
        enhancedOptions.series = enhancedOptions.series.map((series: any) => ({
          ...series,
          radius: series.radius || '55%',
          center: series.center || ['50%', '55%'],
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
            ...series.itemStyle
          },
          label: {
            show: true,
            fontSize: 11,
            color: '#64748b',
            formatter: '{b}: {d}%',
            ...series.label
          },
          labelLine: {
            show: true,
            length: 15,
            length2: 10,
            ...series.labelLine
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 15,
              shadowOffsetX: 0,
              shadowOffsetY: 2,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
              ...series.emphasis?.itemStyle
            },
            label: {
              show: true,
              fontSize: 13,
              fontWeight: 'bold',
              ...series.emphasis?.label
            }
          }
        }));
      }

      // Use notMerge: false to update without complete re-render
      chartInstance.current.setOption(enhancedOptions, { notMerge: false, lazyUpdate: true });
    } else if (options) {
      chartInstance.current.setOption(options, { notMerge: false, lazyUpdate: true });
    }

  }, [options, interactive, chartType]);

  // Separate effect for resize observer - only runs once
  useEffect(() => {
    if (!chartRef.current || !chartInstance.current) return;

    const resizeObserver = new ResizeObserver(() => {
      chartInstance.current?.resize();
    });
    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  return (
    <div
      ref={chartRef}
      className={`w-full ${className}`}
      style={{ height }}
    />
  );
});

Chart.displayName = 'Chart';
