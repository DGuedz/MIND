import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useEffect, useState } from "react"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"

export function AgenticChart({ showOnlyAgent }: { showOnlyAgent: boolean }) {
  const [chartData, setChartData] = useState<{ month: string; aGDP: number; tvl: number }[]>([
    { month: "Jan", aGDP: 186, tvl: 80 },
    { month: "Feb", aGDP: 305, tvl: 200 },
    { month: "Mar", aGDP: 237, tvl: 120 },
    { month: "Apr", aGDP: 479, tvl: 190 },
    { month: "May", aGDP: 550, tvl: 130 },
    { month: "Jun", aGDP: 700, tvl: 140 },
  ])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulating Covalent API fetch for Agentic GDP and TVL
    const fetchCovalentData = async () => {
      try {
        // Here we would use the real Covalent API endpoint
        // e.g., fetch(`https://api.covalenthq.com/v1/solana-mainnet/address/${AGENT_WALLET}/balances_v2/?key=${import.meta.env.VITE_COVALENT_API_KEY}`)
        
        // Simulating network delay and dynamic data updates
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mocking real-time updated data
        setChartData([
          { month: "Jan", aGDP: 186, tvl: 80 },
          { month: "Feb", aGDP: 305, tvl: 200 },
          { month: "Mar", aGDP: 237, tvl: 120 },
          { month: "Apr", aGDP: 479, tvl: 190 },
          { month: "May", aGDP: 550, tvl: 130 },
          { month: "Jun", aGDP: 750, tvl: 155 }, // Updated live data
        ]);
      } catch (error) {
        console.error("Failed to fetch Covalent data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCovalentData();
  }, []);

  const chartConfig = {
    aGDP: {
      label: "Agentic GDP",
      color: "#c084fc", // Purple
    },
    tvl: {
      label: "Solana TVL",
      color: "#60a5fa", // Blue
    },
  } satisfies ChartConfig

  return (
    <div className="w-full h-32 mt-4 opacity-50 group-hover:opacity-100 transition-all duration-700 pointer-events-none group-hover:pointer-events-auto relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 backdrop-blur-sm">
          <span className="text-xs text-gray-400 animate-pulse">Fetching on-chain data (Covalent)...</span>
        </div>
      )}
      <ChartContainer config={chartConfig} className="w-full h-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
            <XAxis 
              dataKey="month" 
              tickLine={false} 
              axisLine={false} 
              tickMargin={8} 
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            />
            <YAxis 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
              tickFormatter={(value) => `$${value}M`}
            />
            <Tooltip 
              content={<ChartTooltipContent />} 
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="aGDP"
              stroke="var(--color-aGDP)"
              strokeWidth={2}
              dot={{ fill: "var(--color-aGDP)", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#fff", stroke: "var(--color-aGDP)", strokeWidth: 2 }}
            />
            {!showOnlyAgent && (
              <Line
                type="monotone"
                dataKey="tvl"
                stroke="var(--color-tvl)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: "#fff", stroke: "var(--color-tvl)", strokeWidth: 2 }}
                opacity={0.5}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}
