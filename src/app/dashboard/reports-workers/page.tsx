'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  User, 
  DollarSign, 
  TrendingUp, 
  Calendar as CalendarIcon,
  Download,
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getWorkers, getLeads, getCampaigns } from '@/lib/data';
import { Worker, Lead, Campaign } from '@/types/marketing';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, startOfMonth, endOfMonth, setDate, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function WorkerReportsPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('all');
  
  // Estado para el manejo de periodos (Quincenas)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [quincena, setQuincena] = useState<'Q1' | 'Q2'>(new Date().getDate() <= 15 ? 'Q1' : 'Q2');

  useEffect(() => {
    Promise.all([getWorkers(), getLeads(), getCampaigns()]).then(([w, l, c]) => {
      setWorkers(w);
      setLeads(l);
      setCampaigns(c);
    });
  }, []);

  // Definir el intervalo de fechas basado en la quincena seleccionada
  const periodInterval = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    
    if (quincena === 'Q1') {
      return {
        start: start,
        end: setDate(start, 15)
      };
    } else {
      return {
        start: setDate(start, 16),
        end: end
      };
    }
  }, [currentDate, quincena]);

  // Lógica de generación de reporte filtrado por periodo y trabajador
  const workerReport = useMemo(() => {
    const targetWorkers = selectedWorkerId === 'all' ? workers : workers.filter(w => w.id === selectedWorkerId);

    return targetWorkers.map(worker => {
      const workerSubIdCodes = worker.subIds.map(s => s.code);
      
      // Filtrar leads aprobados en el intervalo de la quincena seleccionada
      const periodLeads = leads.filter(l => {
        const leadDate = parseISO(l.createdAt);
        const isApproved = l.status === 'approved';
        const isWorkerLead = workerSubIdCodes.includes(l.subId);
        const inPeriod = isWithinInterval(leadDate, periodInterval);
        return isApproved && isWorkerLead && inPeriod;
      });

      // Agrupar por campaña dentro de este periodo
      const campaignStats = campaigns.map(campaign => {
        const campaignLeads = periodLeads.filter(l => l.campaignName === campaign.name || l.campaignId === campaign.id);
        const count = campaignLeads.length;
        const unitPrice = campaign.payoutPerLead || (campaign.budget / 1000);
        const total = count * unitPrice;

        return {
          campaignName: campaign.name,
          approvedCount: count,
          unitPrice: unitPrice,
          totalEarned: total,
          leadsDates: campaignLeads.map(l => l.createdAt)
        };
      }).filter(stat => stat.approvedCount > 0);

      const grandTotal = campaignStats.reduce((acc, curr) => acc + curr.totalEarned, 0);
      const totalLeads = campaignStats.reduce((acc, curr) => acc + curr.approvedCount, 0);

      return {
        worker,
        campaignStats,
        grandTotal,
        totalLeads
      };
    }).filter(report => report.totalLeads > 0 || selectedWorkerId !== 'all');
  }, [selectedWorkerId, workers, leads, campaigns, periodInterval]);

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-foreground/90 text-primary">Reporte de Nómina</h2>
          <p className="text-lg text-muted-foreground/80 font-medium">Auditoría quincenal de comisiones y leads aprobados.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-12 rounded-2xl border-2 font-bold gap-2">
            <Download className="size-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Selectores de Periodo y Filtros */}
      <div className="flex flex-wrap items-center gap-6 bg-card/40 p-8 rounded-[2.5rem] border border-muted-foreground/5 backdrop-blur-sm shadow-xl shadow-black/5">
        <div className="flex items-center gap-4 bg-background/50 p-2 rounded-2xl border border-muted-foreground/10">
          <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10" onClick={handlePrevMonth}>
            <ChevronLeft className="size-5" />
          </Button>
          <div className="px-4 text-center min-w-[140px]">
            <p className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest leading-none mb-1">Mes de Consulta</p>
            <span className="text-sm font-black uppercase">{format(currentDate, 'MMMM yyyy', { locale: es })}</span>
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10" onClick={handleNextMonth}>
            <ChevronRight className="size-5" />
          </Button>
        </div>

        <div className="flex bg-background/50 p-1.5 rounded-2xl border border-muted-foreground/10 h-[56px] items-center">
          <button 
            onClick={() => setQuincena('Q1')}
            className={cn(
              "px-6 h-full rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              quincena === 'Q1' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted/50"
            )}
          >
            Quincena 1 (1-15)
          </button>
          <button 
            onClick={() => setQuincena('Q2')}
            className={cn(
              "px-6 h-full rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              quincena === 'Q2' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted/50"
            )}
          >
            Quincena 2 (16-End)
          </button>
        </div>

        <div className="h-10 w-px bg-muted-foreground/10 hidden lg:block" />

        <div className="flex-1 min-w-[240px]">
          <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
            <SelectTrigger className="h-14 rounded-2xl bg-background/50 border-none shadow-sm font-bold px-6">
              <div className="flex items-center gap-3">
                <User className="size-4 text-primary" />
                <SelectValue placeholder="Filtrar por Miembro" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              <SelectItem value="all">Todo el Equipo</SelectItem>
              {workers.map(w => (
                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-10">
        {workerReport.length === 0 ? (
            <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-black/5 bg-card/50 backdrop-blur-sm py-28 text-center">
                <div className="size-20 rounded-[2rem] bg-muted/20 flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="size-10 text-muted-foreground/30" />
                </div>
                <h3 className="text-xl font-black text-foreground/80 mb-2">Sin actividad en este periodo</h3>
                <p className="text-muted-foreground font-medium max-w-xs mx-auto">No se encontraron leads aprobados para los filtros seleccionados.</p>
            </Card>
        ) : (
            workerReport.map((report) => (
                <Card key={report.worker.id} className="rounded-[2.5rem] border-none shadow-2xl shadow-black/5 bg-card/50 backdrop-blur-sm overflow-hidden group hover:scale-[1.01] transition-transform duration-500">
                    <CardHeader className="p-10 bg-gradient-to-r from-primary/10 to-transparent border-b border-primary/10">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <Avatar className="size-20 rounded-[2rem] border-4 border-background shadow-2xl">
                                    <AvatarImage src={`https://picsum.photos/seed/${report.worker.id}/200/200`} />
                                    <AvatarFallback className="text-2xl font-black bg-primary text-white">
                                        {report.worker.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black text-foreground/90 tracking-tight">{report.worker.name}</h3>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Badge variant="secondary" className="rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest bg-white/50 text-primary border border-primary/10">
                                            {report.worker.subIds.length} Enlaces Tracking
                                        </Badge>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold">
                                          <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                          Auditado
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-8 bg-background/40 p-6 rounded-[2rem] border border-white/20 backdrop-blur-md">
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest mb-2">Conversiones</p>
                                    <div className="text-3xl font-black text-foreground/80 flex items-center justify-center gap-2">
                                        {report.totalLeads}
                                        <CheckCircle2 className="size-5 text-emerald-500" />
                                    </div>
                                </div>
                                <div className="h-10 w-px bg-primary/10" />
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-primary/60 tracking-widest mb-2">Comisión Acumulada</p>
                                    <div className="text-4xl font-black text-primary flex items-center gap-2">
                                        <span className="text-2xl opacity-60">$</span>
                                        {report.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="border-none">
                                    <TableHead className="py-6 px-10 font-black text-muted-foreground/50 uppercase tracking-widest text-[10px]">Oferta CPA</TableHead>
                                    <TableHead className="py-6 px-10 font-black text-muted-foreground/50 uppercase tracking-widest text-[10px] text-center">Aprobados</TableHead>
                                    <TableHead className="py-6 px-10 font-black text-muted-foreground/50 uppercase tracking-widest text-[10px] text-center">Payout ($)</TableHead>
                                    <TableHead className="py-6 px-10 font-black text-muted-foreground/50 uppercase tracking-widest text-[10px] text-right">Subtotal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {report.campaignStats.map((stat, idx) => (
                                    <TableRow key={idx} className="border-muted-foreground/5 hover:bg-primary/5 transition-all">
                                        <TableCell className="py-8 px-10">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-sm">
                                                        <TrendingUp className="size-5" />
                                                    </div>
                                                    <span className="font-black text-foreground/80 text-lg tracking-tight">{stat.campaignName}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 ml-1">
                                                  {stat.leadsDates.slice(0, 5).map((date, dIdx) => (
                                                    <Badge key={dIdx} variant="outline" className="text-[9px] font-bold px-2 py-0 h-5 bg-background/50 border-none text-muted-foreground flex items-center gap-1">
                                                      <Clock className="size-2.5" />
                                                      {format(parseISO(date), 'dd/MM')}
                                                    </Badge>
                                                  ))}
                                                  {stat.leadsDates.length > 5 && (
                                                    <span className="text-[9px] font-bold text-muted-foreground/50 self-center">+{stat.leadsDates.length - 5} más</span>
                                                  )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-8 px-10 text-center">
                                            <div className="text-2xl font-black text-emerald-600">
                                                {stat.approvedCount}
                                            </div>
                                            <p className="text-[9px] font-bold text-emerald-600/60 uppercase tracking-widest">Leads OK</p>
                                        </TableCell>
                                        <TableCell className="py-8 px-10 text-center font-black text-muted-foreground/80 text-base">
                                            ${stat.unitPrice.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="py-8 px-10 text-right">
                                            <div className="text-2xl font-black text-primary tracking-tighter">
                                              ${stat.totalEarned.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                            <p className="text-[9px] font-bold text-primary/40 uppercase tracking-widest">Monto Neto</p>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ))
        )}
      </div>
    </div>
  );
}
