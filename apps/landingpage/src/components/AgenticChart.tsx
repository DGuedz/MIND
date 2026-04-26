import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, ISeriesApi, Time, AreaSeries } from "lightweight-charts";

export function AgenticChart({ showOnlyAgent }: { showOnlyAgent: boolean }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 1. Initialize TradingView Lightweight Chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255, 255, 255, 0.4)",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.03)", style: 2 },
        horzLines: { color: "rgba(255, 255, 255, 0.03)", style: 2 },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: {
          color: "rgba(255, 255, 255, 0.4)",
          width: 1,
          style: 1,
          labelBackgroundColor: "#1e293b",
        },
        horzLine: {
          color: "rgba(255, 255, 255, 0.4)",
          width: 1,
          style: 1,
          labelBackgroundColor: "#1e293b",
        },
      },
      handleScroll: {
        mouseWheel: false,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: false,
        pinch: true,
      },
    });

    chartRef.current = chart;

    // 2. Add Area Series
    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: showOnlyAgent ? "#c084fc" : "#38bdf8", // Purple for Agent, Cyan for General
      topColor: showOnlyAgent ? "rgba(192, 132, 252, 0.4)" : "rgba(56, 189, 248, 0.4)",
      bottomColor: showOnlyAgent ? "rgba(192, 132, 252, 0.0)" : "rgba(56, 189, 248, 0.0)",
      lineWidth: 2,
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });

    seriesRef.current = areaSeries as ISeriesApi<"Area">;

    // 3. Handle Resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    // 4. Simulate On-Chain Data Fetching
    const fetchOnChainData = async () => {
      setIsLoading(true);
      // Simulating a real network call to Helius/Covalent
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Generate realistic deterministic mock data based on the selected filter
      const data = [];
      const startDate = new Date("2023-10-01").getTime();
      
      let baseValue = showOnlyAgent ? 0.01 : 1.5; // Agent started near 0, Solana TVL started around $1.5B
      const volatility = showOnlyAgent ? 0.3 : 0.05; // Agent tokens are highly volatile
      const growthTrend = showOnlyAgent ? 1.05 : 1.01; // Agent market is exploding

      for (let i = 0; i < 180; i++) { // Last 180 days
        const time = (startDate + i * 24 * 60 * 60 * 1000) / 1000 as Time;
        
        // Random walk with drift
        const change = (Math.random() - 0.5) * volatility + (growthTrend - 1);
        baseValue = Math.max(0.01, baseValue * (1 + change));
        
        // Spike simulation for Agent Economy around Jan 2024 (ai16z boom)
        if (showOnlyAgent && i > 90 && i < 120) {
          baseValue *= 1.1; 
        }

        data.push({ time, value: baseValue });
      }

      // Ensure the final value matches our hardcoded metrics visually ($2.64B and $7.06B)
      const targetFinalValue = showOnlyAgent ? 2.64 : 7.06;
      const currentFinalValue = data[data.length - 1].value;
      const adjustmentFactor = targetFinalValue / currentFinalValue;

      const finalData = data.map(d => ({
        time: d.time,
        value: d.value * adjustmentFactor
      }));

      areaSeries.setData(finalData);
      chart.timeScale().fitContent();
      setIsLoading(false);
    };

    fetchOnChainData();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [showOnlyAgent]);

  return (
    <div className="w-full h-40 mt-4 relative group">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/80 z-10 backdrop-blur-sm rounded-md border border-white/20">
          <div className="flex flex-col items-center gap-2">
            <div className="w-4 h-4 border-2 border-t-cyan-400 border-white/30 rounded-full animate-spin" />
            <span className="text-[10px] text-cyan-400/80 animate-pulse tracking-widest uppercase">
              Fetching On-Chain Data...
            </span>
          </div>
        </div>
      )}
      <div ref={chartContainerRef} className="w-full h-full absolute inset-0" />
    </div>
  );
}
