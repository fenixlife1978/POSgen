'use client';

import React from 'react';
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis 
} from 'recharts';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';

interface AgencyRevenueChartProps {
  data: any[];
  config: any;
}

export function AgencyRevenueChart({ data, config }: AgencyRevenueChartProps) {
  return (
    <div className="h-[400px] w-full mt-4">
      <ChartContainer config={config} className="h-full w-full">
        <BarChart data={data}>
          <CartesianGrid 
            vertical={false} 
            strokeDasharray="3 3" 
            stroke="hsl(var(--muted-foreground) / 0.1)" 
          />
          <XAxis 
            dataKey="day" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600 }}
          />
          <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted) / 0.5)', radius: 8 }} />
          <Bar 
            dataKey="agenciaA" 
            fill="var(--color-agenciaA)" 
            radius={[6, 6, 0, 0]} 
            barSize={30}
          />
          <Bar 
            dataKey="agenciaB" 
            fill="var(--color-agenciaB)" 
            radius={[6, 6, 0, 0]} 
            barSize={30}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
