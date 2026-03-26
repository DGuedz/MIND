import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { month: "Jan", aGDP: 186, tvl: 80 },
  { month: "Feb", aGDP: 305, tvl: 200 },
  { month: "Mar", aGDP: 237, tvl: 120 },
  { month: "Apr", aGDP: 479, tvl: 190 },
  { month: "May", aGDP: 550, tvl: 130 },
  { month: "Jun", aGDP: 700, tvl: 140 },
]

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

export function AgenticChart({ showOnlyAgent }: { showOnlyAgent: boolean }) {
  return (
    <div className="w-full h-32 mt-4 opacity-50 group-hover:opacity-100 transition-all duration-700 pointer-events-none group-hover:pointer-events-auto">
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
