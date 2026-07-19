import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function ExposureChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="panel p-6 h-96 flex flex-col">
      <h3 className="font-bold text-[var(--text-main)] mb-4">Financial Exposure by Classification</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
            <XAxis dataKey="name" hide />
            <YAxis 
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip 
              cursor={{ fill: 'var(--border-color)', opacity: 0.4 }}
              contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: 'var(--primary-teal)', fontWeight: 600 }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Exposure']}
            />
            <Bar dataKey="value" fill="var(--primary-teal)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
