"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { NameValue, TrendPoint } from "@/lib/types";

const palette = ["#E4272B", "#1A1A1A", "#6B6B6B", "#B91C1C", "#A87C43", "#5C7665", "#7C8C82"];

interface TooltipPayloadItem {
  name: string;
  value: number | string | null;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="border border-border bg-white p-2.5 text-xs text-ink font-sans shadow-md rounded-lg">
        <p className="font-bold text-mist uppercase tracking-wide mb-0.5">{label}</p>
        <p className="font-display font-bold text-brand">
          {payload[0].name}: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) => {
  if (active && payload && payload.length) {
    return (
      <div className="border border-border bg-white p-2.5 text-xs text-ink font-sans shadow-md rounded-lg">
        <p className="font-bold text-brand mb-0.5">{payload[0].name}</p>
        <p className="font-display font-bold text-ink">
          Count: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export function ContributorChart({ data, animKey, unit = "hrs" }: { data: NameValue[]; animKey?: string | number; unit?: string }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center border border-dashed border-border text-sm font-semibold text-mist font-display rounded-2xl bg-paper/35">
        No matching contributors.
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item.value), 1);

  return (
    <div className="flex flex-col gap-4 py-2 min-h-[240px] justify-center font-display">
      {data.map((item, i) => {
        const percentage = (item.value / maxValue) * 100;
        const medal = i === 0 ? "🥇 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : "";
        return (
          <div key={`${animKey ?? ""}-${item.name}`} className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-semibold text-ink">
              <span className="flex items-center gap-1">
                {medal && <span className="text-sm shrink-0">{medal}</span>}
                <strong className={i < 3 ? "text-brand" : "text-ink"}>{item.name}</strong>
              </span>
              <span className="font-display font-bold text-brand">{item.value} {unit}</span>
            </div>
            <div className="w-full h-2.5 bg-brand-light/30 border border-border overflow-hidden rounded-full">
              <div
                className="h-full bg-brand rounded-full"
                style={{
                  width: `${percentage}%`,
                  animation: `barGrow 0.8s cubic-bezier(0.22,1,0.36,1) ${i * 70}ms both`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ActivityTypeChart({ data }: { data: NameValue[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center border border-dashed border-border text-sm font-semibold text-mist font-display rounded-2xl bg-paper/35">
        No matching activities.
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center min-h-[240px] font-display">
      <div className="col-span-1 md:col-span-5 flex justify-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={2}
              isAnimationActive={true}
              animationDuration={900}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={palette[index % palette.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="col-span-1 md:col-span-7 flex flex-col gap-3 max-h-[200px] overflow-auto pr-2">
        {data.map((item, index) => {
          const percentage = Math.round((item.value / total) * 100);
          const color = palette[index % palette.length];
          return (
            <div key={item.name} className="flex flex-col gap-1 text-[11px] font-semibold text-ink font-display text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: color }} />
                  <strong>{item.name}</strong>
                </span>
                <span className="text-mist font-bold">{percentage}% ({item.value})</span>
              </div>
              <div className="w-full h-1.5 bg-paper border border-border rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ backgroundColor: color, width: `${percentage}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HoursChart({ data }: { data: TrendPoint[] }) {
  return (
    <ChartFrame empty={!data.length}>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#E5E5E5" strokeDasharray="" />
          <XAxis 
            dataKey="period" 
            tick={{ fill: "#6B6B6B", fontSize: 10, fontWeight: 700, fontFamily: "var(--font-poppins)" }} 
            tickLine={{ stroke: "#E5E5E5" }} 
            axisLine={{ stroke: "#E5E5E5" }} 
          />
          <YAxis 
            tick={{ fill: "#6B6B6B", fontSize: 10, fontWeight: 700, fontFamily: "var(--font-poppins)" }} 
            tickLine={{ stroke: "#E5E5E5" }} 
            axisLine={{ stroke: "#E5E5E5" }} 
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--brand-light)", opacity: 0.4 }} />
          <Bar
            dataKey="hours"
            name="Hours Logged"
            fill="#E4272B"
            radius={[4, 4, 0, 0]}
            isAnimationActive={true}
            animationDuration={900}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function ActivityTrendChart({ data, label }: { data: TrendPoint[]; label: string }) {
  return (
    <ChartFrame empty={!data.length}>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#E5E5E5" strokeDasharray="" />
          <XAxis 
            dataKey="period" 
            tick={{ fill: "#6B6B6B", fontSize: 10, fontWeight: 700, fontFamily: "var(--font-poppins)" }} 
            tickLine={{ stroke: "#E5E5E5" }} 
            axisLine={{ stroke: "#E5E5E5" }} 
          />
          <YAxis 
            allowDecimals={false} 
            tick={{ fill: "#6B6B6B", fontSize: 10, fontWeight: 700, fontFamily: "var(--font-poppins)" }} 
            tickLine={{ stroke: "#E5E5E5" }} 
            axisLine={{ stroke: "#E5E5E5" }} 
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="count" 
            name={label} 
            stroke="#E4272B" 
            strokeWidth={2.5} 
            dot={{ r: 4, fill: "#1A1A1A", stroke: "#E4272B", strokeWidth: 1.5 }} 
            activeDot={{ r: 6 }}
            isAnimationActive={true}
            animationDuration={900}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

function ChartFrame({ empty, children }: { empty: boolean; children: React.ReactNode }) {
  if (empty) {
    return (
      <div className="flex h-[240px] items-center justify-center border border-dashed border-border text-sm font-semibold text-mist rounded-2xl bg-paper/35">
        No matching chart data.
      </div>
    );
  }

  return children;
}

