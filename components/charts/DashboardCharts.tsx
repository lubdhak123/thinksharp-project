"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { NameValue, TrendPoint } from "@/lib/types";

// Brand-aligned colors: red, ink-black, muted gray
const palette = ["#E4272B", "#1A1A1A", "#6B6B6B", "#B91C1C", "#A87C43", "#5C7665", "#7C8C82"];

// Custom Tooltip component for brand aesthetic
interface TooltipPayloadItem {
  name: string;
  value: number | string | null;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="border border-border bg-white p-2.5 text-xs text-ink font-sans shadow-sm">
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
      <div className="border border-border bg-white p-2.5 text-xs text-ink font-sans shadow-sm">
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
      <div className="flex h-[240px] items-center justify-center border border-dashed border-border text-sm font-semibold text-mist font-display">
        No matching contributors.
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item.value), 1);

  return (
    <div className="flex flex-col gap-4 py-2 min-h-[240px] justify-center font-display">
      {data.map((item, i) => {
        const percentage = (item.value / maxValue) * 100;
        return (
          <div key={`${animKey ?? ""}-${item.name}`} className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-semibold text-ink">
              <span>{item.name}</span>
              <span className="font-display font-bold text-brand">{item.value} {unit}</span>
            </div>
            <div className="w-full h-2.5 bg-brand-light/40 border border-border overflow-hidden">
              <div
                className="h-full bg-brand"
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
  return (
    <ChartFrame empty={!data.length}>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            isAnimationActive={true}
            animationBegin={0}
            animationDuration={900}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={palette[index % palette.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomPieTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconSize={10} 
            formatter={(value) => <span className="text-xs font-bold text-ink font-display">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartFrame>
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
            radius={[0, 0, 0, 0]}
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
    return <div className="flex h-[240px] items-center justify-center border border-dashed border-border text-sm font-semibold text-mist">No matching chart data.</div>;
  }

  return children;
}
