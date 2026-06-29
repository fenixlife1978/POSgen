'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar as CalendarIcon, 
  User, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  CheckCircle2,
  XCircle,
  Activity,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { AgencyRevenueChart } from '@/components/dashboard/agency-revenue-chart';
import { getConversionAudit } from '@/lib/data';
import { ConversionAudit } from '@/types/marketing';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AnalyticsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [auditData, setAuditData] = useState<ConversionAudit[]>([]);

  useEffect(() => {
    getConversionAudit().then(setAuditData);
  }, []);

  const chartData = auditData.map(d => ({
    day: d.date.split('-').slice(2).join(''),
    agenciaA: d.approved,
    agenciaB: d.rejected
  }));

  const chartConfig = {
    agenciaA: { label: "Aprobados", color: "hsl(var(--primary))" },
    agenciaB: { label: "Rechazados", color: "hsl(var(--destructive) / 0.5)" },
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-foreground/90">Reportes y Auditoría</h2>
          <p className="text-lg text-muted-foreground/80 font-medium">Analiza la calidad de tus conversiones y el ROI de tus campañas.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("h-12 rounded-2xl border-none shadow-sm bg-card/50 px-6 font-bold gap-2", !date && "text-muted-foreground")}>
                <CalendarIcon className="size-4 text-primary" />
                {date ? format(date, "PPP", { locale: es }) : "Rango de Fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-[2rem] border-none shadow-2xl" align="end">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={es} />
            </PopoverContent>
          </Popover>

          <Select defaultValue="all">
            <SelectTrigger className="h-12 w-48 rounded-2xl border-none shadow-sm bg-card/50 px-6 font-bold">
              <div className="flex items-center gap-2">
                <User className="size-4 text-primary" />
                <SelectValue placeholder="Trabajador" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-xl">
              <SelectItem value="all">Todos los Miembros</SelectItem>
              <SelectItem value="w1">Carlos Mendoza</SelectItem>
              <SelectItem value="w2">Elena Rodríguez</SelectItem>
            </SelectContent>
          </Select>

          <Button className="h-12 size-12 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
            <Filter className="size-5" />
          </Button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard 
          title="Tasa de Aprobación" 
          value="84.2%" 
          description="Promedio quincenal" 
          icon={<CheckCircle2 className="size-5" />} 
          color="emerald" 
          trend="+2.4%"
        />
        <MetricCard 
          title="Rechazos Críticos" 
          value="12" 
          description="Leads marcados como spam" 
          icon={<XCircle className="size-5" />} 
          color="destructive" 
          trend="-15%"
          trendPositive={false}
        />
        <MetricCard 
          title="Puntuación de Auditoría" 
          value="Excelente" 
          description="Nivel de calidad del tráfico" 
          icon={<ShieldCheck className="size-5" />} 
          color="blue" 
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-7">
        <Card className="lg:col-span-4 rounded-[2.5rem] border-none shadow-2xl shadow-black/5 bg-card/50 backdrop-blur-sm p-8">
          <CardHeader className="p-0 mb-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black flex items-center gap-2">
                  <Activity className="size-6 text-primary" />
                  Auditoría de Conversión
                </CardTitle>
                <CardDescription className="text-base font-medium">Comparativa de leads aprobados vs. rechazados por día.</CardDescription>
              </div>
              <Badge variant="outline" className="rounded-full px-4 py-1 font-bold border-2">Últimos 7 Días</Badge>
            </div>
          </CardHeader>
          <AgencyRevenueChart data={chartData} config={chartConfig} />
        </Card>

        <Card className="lg:col-span-3 rounded-[2.5rem] border-none shadow-2xl shadow-black/5 bg-card/50 backdrop-blur-sm p-8">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-2xl font-black flex items-center gap-2">
              <TrendingUp className="size-6 text-primary" />
              Insights de Calidad
            </CardTitle>
            <CardDescription className="text-base font-medium">Observaciones automáticas del sistema.</CardDescription>
          </CardHeader>
          <div className="space-y-4">
            <InsightRow 
              title="Tráfico de Alta Calidad" 
              desc="Carlos Mendoza mantiene una tasa superior al 90%."
              type="success"
            />
            <InsightRow 
              title="Alerta de Latencia" 
              desc="La API de CPA Merchant experimentó caídas ayer."
              type="warning"
            />
            <InsightRow 
              title="Optimización Sugerida" 
              desc="Reducir inversión en 'Newsletter' por bajo ROI."
              type="info"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, description, icon, color, trend, trendPositive = true }: any) {
  const colors: any = {
    emerald: 'bg-emerald-500 text-emerald-500',
    destructive: 'bg-destructive text-destructive',
    blue: 'bg-blue-500 text-blue-500'
  };

  return (
    <Card className="rounded-[2rem] border-none shadow-xl shadow-black/5 bg-card/60 backdrop-blur-sm group hover:scale-[1.02] transition-all">
      <CardContent className="p-7">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-3 rounded-2xl bg-opacity-10", colors[color].split(' ')[0])}>
            <div className={colors[color].split(' ')[1]}>{icon}</div>
          </div>
          {trend && (
            <div className={cn("flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", 
              trendPositive ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive")}>
              {trendPositive ? <ArrowUpRight className="size-3" /> : <TrendingDown className="size-3" />}
              {trend}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">{title}</p>
          <div className="text-3xl font-black text-foreground/90">{value}</div>
          <p className="text-xs text-muted-foreground/60 font-medium">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InsightRow({ title, desc, type }: { title: string, desc: string, type: 'success' | 'warning' | 'info' }) {
  const styles: any = {
    success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  };

  return (
    <div className={cn("p-5 rounded-[1.5rem] border transition-all hover:soft-shadow", styles[type])}>
      <h5 className="font-black text-sm mb-1">{title}</h5>
      <p className="text-xs font-medium opacity-80">{desc}</p>
    </div>
  );
}