import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

const CandlestickChart = ({ data, width = 600, height = 400 }) => {
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const candlestickSeriesRef = useRef(null);

  useEffect(() => {
    // Create chart instance
    const chart = createChart(chartContainerRef.current, {
      width,
      height,
      layout: {
        backgroundColor: '#ffffff',
        textColor: '#333',
      },
      grid: {
        vertLines: {
          color: '#eee',
        },
        horzLines: {
          color: '#eee',
        },
      },
      crosshair: {
        mode: 1, // Crosshair mode
      },
      priceScale: {
        borderColor: '#ccc',
      },
      timeScale: {
        borderColor: '#ccc',
        timeVisible: true,
        secondsVisible: false,
      },
      localization: {
        locale: 'ko-KR',
        dateFormat: 'yyyy-MM-dd',
        timeFormatter: (timestamp) => new Date(timestamp * 1000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),   // crossline의 시간 표현
      },
    });

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#f44336',
      downColor: '#0033ff',
      borderUpColor: '#f44336',
      borderDownColor: '#0033ff',
      wickUpColor: '#f44336',
      wickDownColor: '#0033ff',
    });

    candlestickSeries.setData(data);

    // Save references
    chartInstanceRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    return () => {
      chart.remove();
    };
  }, [width, height]);

  // Handle updates to data
  useEffect(() => {
    if (candlestickSeriesRef.current) {
      candlestickSeriesRef.current.setData(data);
    }
  }, [data]);

  return <div ref={chartContainerRef} />;
};

export default CandlestickChart;
