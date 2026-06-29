'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Banknote, 
  History, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  CreditCard,
  Image as ImageIcon,
  ExternalLink,
  ArrowUpRight,
  TrendingUp,
  Briefcase
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { getPayrollSummary } from '@/lib/data';
import { PayrollSummary } from '@/types/marketing';
import { cn } from '@/lib/utils';

export default function PayrollPage() {
  const [payroll, setPayroll] = useState<PayrollSummary[]>([]);
  const [selectedItem, setSelectedItem] = useState<PayrollSummary | null>(null);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);

  useEffect(() => {
    getPayrollSummary().then(setPayroll);
  }, []);

  const handleRegisterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    // Simulación de actualización de estado
    setPayroll(prev => prev.map(p => p.id === selectedItem.id ? { ...p, status: 'paid' } : p));
    
    toast({
      title: "Pago Registrado",
      description: `Se ha procesado el pago para ${selectedItem.workerName} exitosamente.`,
    });
    
    setIsPayDialogOpen(false);
  };

  const totalPending = payroll
    .filter(p => p.status === 'pending')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const pendingCount = payroll.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-foreground/90">Gestión de Nómina</h2>
          <p className="text-lg text-muted-foreground/80 font-medium">Administra los pagos y comisiones de tu equipo.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-primary/10 p-2 rounded-[2rem] border border-primary/20 pr-6">
          <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <TrendingUp className="size-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-primary/60 tracking-widest">Total Pendiente</span>
            <span className="text-2xl font-black text-primary">${totalPending.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <SummaryCard 
          title="Trabajadores Pendientes" 
          value={pendingCount.toString()} 
          desc="Esperando liquidación" 
          icon={<Clock className="size-5" />}
          color="amber"
        />
        <SummaryCard 
          title="Pagos Realizados" 
          value={payroll.filter(p => p.status === 'paid').length.toString()} 
          desc="Este periodo" 
          icon={<CheckCircle2 className="size-5" />}
          color="emerald"
        />
        <SummaryCard 
          title="Presupuesto Quincenal" 
          value="$2,400" 
          desc="Proyección actual" 
          icon={<Banknote className="size-5" />}
          color="blue"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-7">
        <Card className="lg:col-span-5 rounded-[2.5rem] border-none shadow-2xl shadow-black/5 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="p-8">
            <CardTitle className="text-2xl font-black flex items-center gap-2">
              <History className="size-6 text-primary" />
              Pre-nómina Automática
            </CardTitle>
            <CardDescription className="text-base font-medium">Cálculo de comisiones basado en leads aprobados por agencia.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30 border-y border-muted-foreground/5">
                  <tr>
                    <th className="py-5 px-8 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Trabajador</th>
                    <th className="py-5 px-8 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Agencia</th>
                    <th className="py-5 px-8 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Leads</th>
                    <th className="py-5 px-8 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Monto</th>
                    <th className="py-5 px-8 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Estado</th>
                    <th className="py-5 px-8 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted-foreground/5">
                  {payroll.map((item) => (
                    <tr key={item.id} className="group hover:bg-primary/5 transition-all">
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-4">
                          <Avatar className="size-10 rounded-xl border-2 border-background shadow-sm">
                            <AvatarImage src={`https://picsum.photos/seed/${item.workerId}/100/100`} />
                            <AvatarFallback className="font-bold text-primary">{item.workerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground/90">{item.workerName}</span>
                            <span className="text-[10px] text-muted-foreground font-bold">{item.period}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-8">
                        <Badge variant="outline" className="rounded-full px-3 py-1 font-bold border-2 text-[10px] uppercase">
                          {item.agencyName}
                        </Badge>
                      </td>
                      <td className="py-6 px-8 text-center font-black text-foreground/70">
                        {item.leadsCount}
                      </td>
                      <td className="py-6 px-8">
                        <span className="font-black text-primary text-lg">${item.amount.toLocaleString()}</span>
                      </td>
                      <td className="py-6 px-8">
                        <div className={cn(
                          "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase w-fit",
                          item.status === 'paid' ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                        )}>
                          {item.status === 'paid' ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
                          {item.status === 'paid' ? "Solvente" : "Pendiente"}
                        </div>
                      </td>
                      <td className="py-6 px-8 text-right">
                        {item.status === 'pending' ? (
                          <Dialog open={isPayDialogOpen && selectedItem?.id === item.id} onOpenChange={(open) => {
                            setIsPayDialogOpen(open);
                            if (open) setSelectedItem(item);
                          }}>
                            <DialogTrigger asChild>
                              <Button className="rounded-xl h-10 px-4 font-bold gap-2 shadow-lg shadow-primary/10">
                                <Banknote className="size-4" />
                                Pagar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden max-w-xl">
                              <form onSubmit={handleRegisterPayment}>
                                <div className="bg-primary p-10 text-white">
                                  <DialogHeader>
                                    <div className="size-16 rounded-[1.5rem] bg-white/20 backdrop-blur-md flex items-center justify-center mb-4">
                                      <CreditCard className="size-8" />
                                    </div>
                                    <DialogTitle className="text-3xl font-black">Registrar Pago</DialogTitle>
                                    <DialogDescription className="text-white/70 text-lg">
                                      Estás liquidando la comisión de <strong>{item.workerName}</strong> por un total de <strong>${item.amount}</strong>.
                                    </DialogDescription>
                                  </DialogHeader>
                                </div>
                                
                                <div className="p-10 space-y-6">
                                  <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Método de Pago</Label>
                                      <Select required>
                                        <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none shadow-sm font-bold">
                                          <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-none shadow-xl">
                                          <SelectItem value="binance">Binance (USDT)</SelectItem>
                                          <SelectItem value="pago_movil">Pago Móvil</SelectItem>
                                          <SelectItem value="paypal">PayPal</SelectItem>
                                          <SelectItem value="zelle">Zelle</SelectItem>
                                          <SelectItem value="other">Otro</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Referencia / ID</Label>
                                      <Input required placeholder="#89231..." className="h-12 rounded-xl bg-muted/30 border-none shadow-sm font-mono" />
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Comprobante (URL o Link)</Label>
                                    <div className="flex gap-2">
                                      <Input placeholder="https://imgur.com/..." className="h-12 rounded-xl bg-muted/30 border-none shadow-sm flex-1" />
                                      <Button type="button" variant="outline" size="icon" className="size-12 rounded-xl border-2">
                                        <ImageIcon className="size-5 text-muted-foreground" />
                                      </Button>
                                    </div>
                                  </div>

                                  <DialogFooter className="pt-4">
                                    <Button type="button" variant="ghost" className="rounded-xl h-12 px-6 font-bold" onClick={() => setIsPayDialogOpen(false)}>Cancelar</Button>
                                    <Button type="submit" className="rounded-xl h-12 px-8 font-black shadow-lg shadow-primary/20">Confirmar y Archivar</Button>
                                  </DialogFooter>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Button variant="ghost" size="icon" className="size-10 rounded-xl text-emerald-500 bg-emerald-500/10">
                            <ExternalLink className="size-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-black/5 bg-primary text-white p-8">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <Briefcase className="size-5" />
                Resumen Ejecutivo
              </CardTitle>
            </CardHeader>
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <span className="text-white/60 text-sm font-medium">Fondo de Caja</span>
                <span className="text-2xl font-black">$5,800.00</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <span className="text-white/60 text-sm font-medium">Pagos en Tránsito</span>
                <span className="text-2xl font-black">$450.00</span>
              </div>
              <Button className="w-full h-14 rounded-2xl bg-white text-primary hover:bg-white/90 font-black shadow-xl shadow-black/10 transition-transform active:scale-95">
                Descargar Reporte Mensual
              </Button>
            </div>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-black/5 bg-card/50 backdrop-blur-sm p-8">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-xl font-black">Historial Rápido</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30">
                <div className="size-8 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                  <ArrowUpRight className="size-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold truncate">Pago a Carlos M.</p>
                  <p className="text-[10px] text-muted-foreground">$75.00 - Hace 2 días</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 opacity-60">
                <div className="size-8 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                  <ArrowUpRight className="size-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold truncate">Pago a Elena R.</p>
                  <p className="text-[10px] text-muted-foreground">$112.00 - Hace 1 sem</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, desc, icon, color }: any) {
  const colors: any = {
    amber: 'bg-amber-500/10 text-amber-600',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    blue: 'bg-blue-500/10 text-blue-600'
  };

  return (
    <Card className="rounded-[2rem] border-none shadow-xl shadow-black/5 bg-card/60 backdrop-blur-sm group hover:scale-[1.02] transition-all">
      <CardContent className="p-7">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-3 rounded-2xl", colors[color])}>
            {icon}
          </div>
          <ChevronRight className="size-4 text-muted-foreground/30 group-hover:translate-x-1 transition-transform" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">{title}</p>
          <div className="text-3xl font-black text-foreground/90">{value}</div>
          <p className="text-xs text-muted-foreground/60 font-medium">{desc}</p>
        </div>
      </CardContent>
    </Card>
  );
}
