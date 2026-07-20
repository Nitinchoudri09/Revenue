import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function TrendChart({ data, title }: { data: { name: string; value: number }[], title: string }) {
  return (
    <div className="panel p-6 h-96 flex flex-col">
      <h3 className="font-bold text-slate-900 dark:text-white mb-4">{title}</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
            <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis 
              tick={{ fill: '#64748B', fontSize: 12 }} 
              axisLine={false} 
              tickLine={false} 
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: 'var(--primary-teal)', fontWeight: 600 }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="var(--primary-teal)" 
              strokeWidth={3}
              dot={{ r: 4, fill: "var(--primary-teal)", strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              isAnimationActive={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
