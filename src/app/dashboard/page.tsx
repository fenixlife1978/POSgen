import { getCampaigns, getLeads, getAnalytics } from '@/lib/data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Target, 
  Users, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight,
  MousePointer2,
  Calendar,
  BarChart3
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default async function DashboardPage() {
    const campaigns = await getCampaigns();
    const leads = await getLeads();
    const analytics = await getAnalytics();

    const totalBudget = campaigns.reduce((acc, c) => acc + c.budget, 0);
    const totalSpent = campaigns.reduce((acc, c) => acc + c.spent, 0);
    const totalConversions = campaigns.reduce((acc, c) => acc + c.metrics.conversions, 0);

    return (
        <div className="space-y-10">
            <div className="flex flex-col gap-2">
                <h2 className="text-4xl font-extrabold tracking-tight text-foreground/90">Panel de Control</h2>
                <p className="text-lg text-muted-foreground/80 font-medium">
                    Bienvenido de nuevo. Aquí tienes el pulso de tu estrategia de marketing hoy.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                  title="Presupuesto Total" 
                  value={`$${totalBudget.toLocaleString()}`} 
                  icon={<Target className="size-5" />}
                  trend="+12%"
                  trendType="up"
                  color="bg-blue-500"
                />
                <StatCard 
                  title="Gasto Actual" 
                  value={`$${totalSpent.toLocaleString()}`} 
                  icon={<TrendingUp className="size-5" />}
                  trend="+5%"
                  trendType="up"
                  color="bg-indigo-500"
                />
                <StatCard 
                  title="Conversiones" 
                  value={totalConversions.toString()} 
                  icon={<MousePointer2 className="size-5" />}
                  trend="+18%"
                  trendType="up"
                  color="bg-purple-500"
                />
                <StatCard 
                  title="Total Leads" 
                  value={leads.length.toString()} 
                  icon={<Users className="size-5" />}
                  trend="-2%"
                  trendType="down"
                  color="bg-emerald-500"
                />
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
              <Card className="lg:col-span-4 rounded-[2.5rem] border-none shadow-2xl shadow-black/5 bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="p-8 pb-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">Rendimiento Mensual</CardTitle>
                      <CardDescription className="text-base">Comparativa de ingresos vs inversión.</CardDescription>
                    </div>
                    <Badge variant="secondary" className="rounded-full px-4 py-1">Últimos 6 meses</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="h-[350px] w-full flex items-center justify-center bg-muted/20 rounded-[2rem] border-2 border-dashed border-muted-foreground/10 group hover:border-primary/20 transition-colors">
                    <div className="text-center space-y-2">
                       <BarChart3 className="size-12 mx-auto text-muted-foreground/20 group-hover:text-primary/30 transition-colors" />
                       <p className="text-sm font-medium text-muted-foreground/40 italic">Gráfico Interactivo de Rendimiento</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3 rounded-[2.5rem] border-none shadow-2xl shadow-black/5 bg-card/50 backdrop-blur-sm">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl">Campañas Activas</CardTitle>
                  <CardDescription className="text-base">Monitoreo de ejecución en tiempo real.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <div className="space-y-5">
                    {campaigns.slice(0, 3).map(campaign => (
                      <div key={campaign.id} className="group flex items-center gap-5 p-4 rounded-[1.5rem] bg-background/40 hover:bg-background/80 transition-all border border-transparent hover:border-primary/5 hover:soft-shadow">
                        <div className={`size-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                          campaign.status === 'active' ? 'bg-primary' : 'bg-muted-foreground/30'
                        }`}>
                          <Target className="size-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground/90 truncate">{campaign.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'} className="text-[10px] h-5 rounded-full px-2">
                              {campaign.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                              <Calendar className="size-3" /> {new Date(campaign.startDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-primary">${campaign.spent.toLocaleString()}</p>
                          <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-tighter">Gasto Actual</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
        </div>
    )
}

function StatCard({ title, value, icon, trend, trendType, color }: { 
  title: string, 
  value: string, 
  icon: React.ReactNode, 
  trend: string, 
  trendType: 'up' | 'down',
  color: string
}) {
  return (
    <Card className="rounded-[2rem] border-none shadow-xl shadow-black/5 bg-card/60 backdrop-blur-sm group hover:scale-[1.02] transition-transform duration-300">
      <CardContent className="p-7">
        <div className="flex flex-row items-center justify-between mb-4">
          <div className={`p-3 rounded-2xl ${color} text-white shadow-lg group-hover:rotate-6 transition-transform`}>
            {icon}
          </div>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
            trendType === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {trendType === 'up' ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {trend}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">{title}</p>
          <div className="text-3xl font-black tracking-tight text-foreground/90 leading-none">{value}</div>
        </div>
      </CardContent>
    </Card>
  )
}