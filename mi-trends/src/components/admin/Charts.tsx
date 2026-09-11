"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

export const CHART_COLORS = [
  "#2563EB",
  "#1A1A1A",
  "#16A34A",
  "#F59E0B",
  "#DC2626",
  "#6B6B6B",
];

const axisStyle = {
  fontSize: 11,
  fill: "#6B6B6B",
  fontFamily: "var(--font-inter)",
};

const tooltipStyle = {
  border: "1px solid rgba(0,0,0,0.06)",
  borderRadius: 2,
  boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
  fontSize: 13,
  fontFamily: "var(--font-inter)",
};

export interface SeriesPoint {
  date: string;
  revenue: number;
  orders: number;
}

export function RevenueChart({
  data,
  formatCurrency,
}: {
  data: SeriesPoint[];
  formatCurrency: (n: number) => string;
}) {
  const [range, setRange] = useState<7 | 30 | 90 | 365>(30);

  const visible = useMemo(() => data.slice(-range), [data, range]);

  const ranges: { value: 7 | 30 | 90 | 365; label: string }[] = [
    { value: 7, label: "7d" },
    { value: 30, label: "30d" },
    { value: 90, label: "90d" },
    { value: 365, label: "1y" },
  ];

  return (
    <div className="card-surface p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-label uppercase tracking-[0.1em] text-ink">Revenue</h2>
        <div className="flex gap-1 rounded-sm bg-cream p-1">
          {ranges.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRange(r.value)}
              className={cn(
                "cursor-pointer rounded-sm px-3 py-1.5 text-caption normal-case tracking-normal transition-colors",
                range === r.value
                  ? "bg-white text-ink shadow-card"
                  : "text-muted hover:text-ink",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={visible} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={axisStyle}
              tickLine={false}
              axisLine={false}
              minTickGap={28}
            />
            <YAxis
              tick={axisStyle}
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={(v) => formatCurrency(Number(v))}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [formatCurrency(Number(value ?? 0)), "Revenue"]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#2563EB"
              strokeWidth={2}
              fill="url(#revenueFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function OrdersChart({ data }: { data: SeriesPoint[] }) {
  return (
    <div className="card-surface p-6">
      <h2 className="mb-6 text-label uppercase tracking-[0.1em] text-ink">
        Orders over time
      </h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={axisStyle}
              tickLine={false}
              axisLine={false}
              minTickGap={28}
            />
            <YAxis
              tick={axisStyle}
              tickLine={false}
              axisLine={false}
              width={40}
              allowDecimals={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="orders"
              stroke="#1A1A1A"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TopProductsChart({
  data,
  title = "Top selling products",
}: {
  data: { name: string; units: number }[];
  title?: string;
}) {
  return (
    <div className="card-surface p-6">
      <h2 className="mb-6 text-label uppercase tracking-[0.1em] text-ink">{title}</h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
          >
            <CartesianGrid stroke="rgba(0,0,0,0.05)" horizontal={false} />
            <XAxis type="number" tick={axisStyle} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={axisStyle}
              tickLine={false}
              axisLine={false}
              width={130}
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
            <Bar dataKey="units" radius={[0, 2, 2, 0]} maxBarSize={22}>
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CategoryPie({
  data,
  formatCurrency,
}: {
  data: { name: string; value: number }[];
  formatCurrency: (n: number) => string;
}) {
  return (
    <div className="card-surface p-6">
      <h2 className="mb-6 text-label uppercase tracking-[0.1em] text-ink">
        Revenue by category
      </h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={84}
              paddingAngle={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => formatCurrency(Number(value ?? 0))}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              wrapperStyle={{ fontSize: 12, fontFamily: "var(--font-inter)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
