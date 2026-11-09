"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatEUR, formatEURCompact } from "@/lib/money";

const TOOLTIP_STYLE = {
  borderRadius: 14,
  border: "1px solid #e5e3da",
  backgroundColor: "#ffffff",
  boxShadow: "0 10px 30px rgba(18,33,29,0.10)",
  fontSize: 12,
  padding: "8px 12px",
  color: "#12211d",
};

export interface MonthBarDatum {
  month: string;
  label: string;
  totalCents: number;
}

export function MonthlyBars({
  data,
  selectedMonth,
}: {
  data: MonthBarDatum[];
  selectedMonth: string;
}) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 2, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#eceae3" strokeDasharray="3 4" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#73827c" }}
            interval={0}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#9aa6a1" }}
            tickFormatter={(value) => formatEURCompact(Number(value))}
            width={46}
          />
          <Tooltip
            cursor={{ fill: "#f0efe8" }}
            contentStyle={TOOLTIP_STYLE}
            formatter={(value) => [formatEUR(Number(value)), "Gastado"]}
          />
          <Bar dataKey="totalCents" radius={[7, 7, 2, 2]} isAnimationActive={false}>
            {data.map((entry) => (
              <Cell
                key={entry.month}
                fill={entry.month === selectedMonth ? "#0d6b5f" : "#bfe5da"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
