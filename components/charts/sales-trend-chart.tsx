"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegendContent } from "@/components/ui/chart"
import { parseISO } from "date-fns"

type SalesPoint = { date: string; revenue: number; orders: number }

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function labelFor(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short" }) + ", " + String(d.getFullYear()).slice(-2)
}

export function SalesTrendChart({ data }: { data: SalesPoint[] }) {
  // Reduce to monthly data (last 12 months)
  const agg = new Map<string, { date: Date; revenue: number; orders: number }>()
  for (const pt of data || []) {
    const d = parseISO(pt.date)
    const key = monthKey(d)
    const cur = agg.get(key) || { date: new Date(d.getFullYear(), d.getMonth(), 1), revenue: 0, orders: 0 }
    cur.revenue += Number(pt.revenue || 0)
    cur.orders += Number(pt.orders || 0)
    agg.set(key, cur)
  }
  const monthly = Array.from(agg.values()).sort((a, b) => a.date.getTime() - b.date.getTime())
  const last12 = monthly.slice(-12)
  const chartData = last12.map((m) => ({ date: labelFor(m.date), revenue: m.revenue, orders: m.orders }))

  return (
    <ChartContainer
      config={{
        revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
        orders: { label: "Orders", color: "hsl(var(--chart-2))" },
      }}
      className="h-64 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend content={<ChartLegendContent />} />
          <Line
            type="monotone"
            yAxisId="left"
            dataKey="revenue"
            stroke="var(--color-revenue)"
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            yAxisId="right"
            dataKey="orders"
            stroke="var(--color-orders)"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
