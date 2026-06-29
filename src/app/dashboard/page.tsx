import { getCampaigns, getLeads, getAnalytics } from '@/lib/data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Target, 
  Users, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight,
  MousePointer2
} from 'lucide-react'

export default async function DashboardPage() {
    const campaigns = await getCampaigns();
    const leads = await getLeads();
    const analytics = await getAnalytics();

    const totalBudget = campaigns.reduce((acc, c) => acc + c.budget, 0);
    const totalSpent = campaigns.reduce((acc, c) => acc + c.spent, 0);
    const totalConversions = campaigns.reduce((acc, c) => acc + c.metrics.conversions, 0);

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-bold tracking-tight">Panel de Control</h2>
                <p className="text-muted-foreground">
                    Resumen del rendimiento de tus estrategias de marketing.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                  title="Presupuesto Total" 
                  value={`$${totalBudget.toLocaleString()}`} 
                  icon={<Target className="h-4 w-4 text-muted-foreground" />}
                  trend="+12%"
                  trendType="up"
                />
                <StatCard 
                  title="Gasto Actual" 
                  value={`$${totalSpent.toLocaleString()}`} 
                  icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                  trend="+5%"
                  trendType="up"
                />
                <StatCard 
                  title="Conversiones" 
                  value={totalConversions.toString()} 
                  icon={<MousePointer2 className="h-4 w-4 text-muted-foreground" />}
                  trend="+18%"
                  trendType="up"
                />
                <StatCard 
                  title="Total Leads" 
                  value={leads.length.toString()} 
                  icon={<Users className="h-4 w-4 text-muted-foreground" />}
                  trend="-2%"
                  trendType="down"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="lg:col-span-4 rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle>Rendimiento Mensual</CardTitle>
                  <CardDescription>Visualización de ingresos vs gasto publicitario.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center bg-muted/10 rounded-xl m-6 mt-0">
                  <p className="text-sm text-muted-foreground italic">Espacio reservado para gráfico de Shadcn UI</p>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3 rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle>Campañas Recientes</CardTitle>
                  <CardDescription>Estado de tus últimas 3 campañas.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {campaigns.slice(0, 3).map(campaign => (
                      <div key={campaign.id} className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <Target className="h-4 w-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{campaign.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">${campaign.spent}</p>
                          <p className="text-[10px] text-muted-foreground">de ${campaign.budget}</p>
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

function StatCard({ title, value, icon, trend, trendType }: { 
  title: string, 
  value: string, 
  icon: React.ReactNode, 
  trend: string, 
  trendType: 'up' | 'down' 
}) {
  return (
    <Card className="rounded-2xl shadow-sm border-none bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-1 mt-1">
          {trendType === 'up' ? (
            <ArrowUpRight className="h-3 w-3 text-green-500" />
          ) : (
            <ArrowDownRight className="h-3 w-3 text-red-500" />
          )}
          <span className={`text-xs font-medium ${trendType === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {trend}
          </span>
          <span className="text-xs text-muted-foreground ml-1">vs mes pasado</span>
        </div>
      </CardContent>
    </Card>
  )
}
