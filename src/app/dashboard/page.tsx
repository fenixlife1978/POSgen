import { getCampaigns, getLeads, getAnalytics } from '@/lib/data';
import { 
  Users, 
  CheckCircle2, 
  Wallet, 
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AgencyRevenueChart } from '@/components/dashboard/agency-revenue-chart';

export default async function DashboardPage() {
    const campaigns = await getCampaigns();
    const leads = await getLeads();
    const analytics = await getAnalytics();

    // Datos para el gráfico de agencias
    const agencyData = [
      { day: 'Lun', agenciaA: 1200, agenciaB: 900 },
      { day: 'Mar', agenciaA: 1900, agenciaB: 1400 },
      { day: 'Mié', agenciaA: 1500, agenciaB: 2100 },
      { day: 'Jue', agenciaA: 2200, agenciaB: 1700 },
      { day: 'Vie', agenciaA: 2800, agenciaB: 2400 },
      { day: 'Sáb', agenciaA: 1600, agenciaB: 1100 },
      { day: 'Dom', agenciaA: 1300, agenciaB: 800 },
    ];

    const chartConfig = {
      agenciaA: {
        label: "Agencia Alpha",
        color: "hsl(var(--primary))",
      },
      agenciaB: {
        label: "Agencia Beta",
        color: "hsl(var(--primary) / 0.5)",
      },
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-col gap-2">
                <h2 className="text-4xl font-black tracking-tight text-foreground/90">Panel de Control</h2>
                <p className="text-lg text-muted-foreground/80 font-medium">
                    Resumen ejecutivo del rendimiento y estado de operaciones.
                </p>
            </div>

            {/* Tarjetas de KPIs */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                  title="Leads del Día" 
                  value="48" 
                  icon={<Users className="size-5" />}
                  trend="+12 hoy"
                  trendType="up"
                  color="bg-blue-500"
                />
                <StatCard 
                  title="Aprobados (Quincena)" 
                  value="312" 
                  icon={<CheckCircle2 className="size-5" />}
                  trend="+18%"
                  trendType="up"
                  color="bg-emerald-500"
                />
                <StatCard 
                  title="Proyección Nómina" 
                  value="$12,450" 
                  icon={<Wallet className="size-5" />}
                  trend="En presupuesto"
                  trendType="up"
                  color="bg-indigo-500"
                />
                <StatCard 
                  title="Estado de APIs" 
                  value="Activo" 
                  icon={<Zap className="size-5" />}
                  trend="4/4 Conectadas"
                  trendType="up"
                  color="bg-amber-500"
                  isStatus
                />
            </div>

            <div className="grid gap-8 lg:grid-cols-7">
              {/* Gráfico de Rendimiento */}
              <Card className="lg:col-span-4 rounded-[2.5rem] border-none shadow-2xl shadow-black/5 bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="p-8 pb-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <TrendingUp className="size-6 text-primary" />
                        Ingresos por Agencia
                      </CardTitle>
                      <CardDescription className="text-base">Rendimiento comparativo de los últimos 7 días.</CardDescription>
                    </div>
                    <Badge variant="secondary" className="rounded-full px-4 py-1 font-bold">Tiempo Real</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <AgencyRevenueChart data={agencyData} config={chartConfig} />
                </CardContent>
              </Card>

              {/* Conexiones Recientes o Actividad */}
              <Card className="lg:col-span-3 rounded-[2.5rem] border-none shadow-2xl shadow-black/5 bg-card/50 backdrop-blur-sm">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Activity className="size-6 text-primary" />
                    Estado de Conexiones
                  </CardTitle>
                  <CardDescription className="text-base">Monitoreo de latencia de servicios.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <div className="space-y-5">
                    <ServiceStatusRow name="Evolution API" status="active" latency="45ms" />
                    <ServiceStatusRow name="CPA Merchant" status="active" latency="120ms" />
                    <ServiceStatusRow name="MongoDB Atlas" status="active" latency="12ms" />
                    <ServiceStatusRow name="Turso DB" status="active" latency="28ms" />
                  </div>
                </CardContent>
              </Card>
            </div>
        </div>
    )
}

function StatCard({ title, value, icon, trend, trendType, color, isStatus }: { 
  title: string, 
  value: string, 
  icon: React.ReactNode, 
  trend: string, 
  trendType: 'up' | 'down',
  color: string,
  isStatus?: boolean
}) {
  return (
    <Card className="rounded-[2rem] border-none shadow-xl shadow-black/5 bg-card/60 backdrop-blur-sm group hover:scale-[1.02] transition-all duration-300">
      <CardContent className="p-7">
        <div className="flex flex-row items-center justify-between mb-4">
          <div className={`p-3 rounded-2xl ${color} text-white shadow-lg group-hover:rotate-6 transition-transform duration-300`}>
            {icon}
          </div>
          {isStatus ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold animate-pulse">
              <div className="size-2 rounded-full bg-emerald-500" />
              ONLINE
            </div>
          ) : (
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
              trendType === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {trendType === 'up' ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {trend}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">{title}</p>
          <div className="text-3xl font-black tracking-tight text-foreground/90 leading-none">{value}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function ServiceStatusRow({ name, status, latency }: { name: string, status: 'active' | 'inactive', latency: string }) {
  return (
    <div className="group flex items-center justify-between p-4 rounded-[1.5rem] bg-background/40 hover:bg-background/80 transition-all border border-transparent hover:border-primary/5">
      <div className="flex items-center gap-4">
        <div className={`size-3 rounded-full ${status === 'active' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-destructive'}`} />
        <span className="font-bold text-foreground/80">{name}</span>
      </div>
      <Badge variant="outline" className="rounded-full px-3 py-0.5 font-mono text-[10px] text-muted-foreground">
        {latency}
      </Badge>
    </div>
  )
}
