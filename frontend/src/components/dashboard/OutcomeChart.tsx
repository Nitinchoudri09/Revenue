import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export function OutcomeChart({ data }: { data: { name: string; value: number }[] }) {
  // Use a refined palette aligning with the fintech visual system
  const COLORS = ['#0F766E', '#15803D', '#D97706', '#DC2626', '#64748B', '#2DD4BF'];

  return (
    <div className="panel p-6 h-96 flex flex-col">
      <h3 className="font-bold text-[var(--text-main)] mb-4">Outcome Distribution</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius="60%"
              outerRadius="85%"
              paddingAngle={2}
              isAnimationActive={false}
            >
              {data.map((_, i) => (
                <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: 'var(--text-main)', fontWeight: 600 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
