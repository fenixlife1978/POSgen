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
  CheckCircle2
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

export default function WorkerReportsPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('all');

  useEffect(() => {
    Promise.all([getWorkers(), getLeads(), getCampaigns()]).then(([w, l, c]) => {
      setWorkers(w);
      setLeads(l);
      setCampaigns(c);
    });
  }, []);

  const selectedWorker = workers.find(w => w.id === selectedWorkerId);

  // Lógica de generación de reporte por trabajador
  const workerReport = useMemo(() => {
    const targetWorkers = selectedWorkerId === 'all' ? workers : workers.filter(w => w.id === selectedWorkerId);

    return targetWorkers.map(worker => {
      // Filtrar leads aprobados para este trabajador
      // Nota: En un entorno real, filtraríamos por los SubIDs asociados al trabajador
      const workerSubIdCodes = worker.subIds.map(s => s.code);
      const approvedLeads = leads.filter(l => 
        l.status === 'approved' && workerSubIdCodes.includes(l.subId)
      );

      // Agrupar por campaña
      const campaignStats = campaigns.map(campaign => {
        const campaignLeads = approvedLeads.filter(l => l.campaignName === campaign.name || l.campaignId === campaign.id);
        const count = campaignLeads.length;
        const unitPrice = campaign.payoutPerLead || (campaign.budget / 1000); // Fallback logic
        const total = count * unitPrice;

        return {
          campaignName: campaign.name,
          approvedCount: count,
          unitPrice: unitPrice,
          totalEarned: total
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
  }, [selectedWorkerId, workers, leads, campaigns]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-foreground/90 text-primary">Reporte de Ganancias</h2>
          <p className="text-lg text-muted-foreground/80 font-medium">Auditoría detallada de leads aprobados y comisiones por trabajador.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-12 rounded-2xl border-2 font-bold gap-2">
            <Download className="size-4" />
            Exportar Reporte
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-card/40 p-6 rounded-[2rem] border border-muted-foreground/5 backdrop-blur-sm">
        <div className="flex items-center gap-4 flex-1">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <User className="size-5" />
          </div>
          <div className="flex-1 max-w-xs">
            <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
              <SelectTrigger className="h-12 rounded-xl bg-background/50 border-none shadow-sm font-bold">
                <SelectValue placeholder="Seleccionar Trabajador" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-none shadow-xl">
                <SelectItem value="all">Todos los Trabajadores</SelectItem>
                {workers.map(w => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <Badge variant="outline" className="h-12 rounded-xl border-none bg-background/50 px-6 font-bold flex items-center gap-2">
                <CalendarIcon className="size-4 text-primary" />
                Mayo 2024 - Quincena 1
            </Badge>
        </div>
      </div>

      <div className="grid gap-8">
        {workerReport.length === 0 ? (
            <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-black/5 bg-card/50 backdrop-blur-sm py-20 text-center">
                <Briefcase className="size-16 mx-auto text-muted-foreground/20 mb-4" />
                <p className="text-muted-foreground font-medium text-lg">No se encontraron datos de comisiones para este periodo.</p>
            </Card>
        ) : (
            workerReport.map((report) => (
                <Card key={report.worker.id} className="rounded-[2.5rem] border-none shadow-2xl shadow-black/5 bg-card/50 backdrop-blur-sm overflow-hidden group">
                    <CardHeader className="p-8 bg-primary/5 border-b border-primary/10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <Avatar className="size-16 rounded-[1.5rem] border-4 border-background shadow-xl">
                                    <AvatarImage src={`https://picsum.photos/seed/${report.worker.id}/200/200`} />
                                    <AvatarFallback className="text-xl font-black bg-primary text-white">
                                        {report.worker.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-foreground/90">{report.worker.name}</h3>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="secondary" className="rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary">
                                            {report.worker.subIds.length} SubIDs Activos
                                        </Badge>
                                        <span className="text-xs text-muted-foreground font-medium">WhatsApp: {report.worker.whatsapp}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest mb-1">Leads Aprobados</p>
                                    <div className="text-3xl font-black text-foreground/80 flex items-center justify-end gap-2">
                                        {report.totalLeads}
                                        <CheckCircle2 className="size-5 text-emerald-500" />
                                    </div>
                                </div>
                                <div className="h-12 w-px bg-primary/10" />
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-primary/60 tracking-widest mb-1">Total a Pagar</p>
                                    <div className="text-4xl font-black text-primary flex items-center gap-2">
                                        <DollarSign className="size-6" />
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
                                    <TableHead className="py-6 px-10 font-black text-muted-foreground/50 uppercase tracking-widest text-[10px]">Campaña / Oferta</TableHead>
                                    <TableHead className="py-6 px-10 font-black text-muted-foreground/50 uppercase tracking-widest text-[10px] text-center">Leads Aprobados</TableHead>
                                    <TableHead className="py-6 px-10 font-black text-muted-foreground/50 uppercase tracking-widest text-[10px] text-center">Precio Unitario ($)</TableHead>
                                    <TableHead className="py-6 px-10 font-black text-muted-foreground/50 uppercase tracking-widest text-[10px] text-right">Subtotal Ganado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {report.campaignStats.map((stat, idx) => (
                                    <TableRow key={idx} className="border-muted-foreground/5 hover:bg-primary/5 transition-colors">
                                        <TableCell className="py-6 px-10">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                                                    <TrendingUp className="size-4" />
                                                </div>
                                                <span className="font-bold text-foreground/80 text-base">{stat.campaignName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-6 px-10 text-center">
                                            <Badge variant="outline" className="rounded-full px-4 py-1 font-black text-emerald-600 bg-emerald-50 border-emerald-100">
                                                {stat.approvedCount}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-6 px-10 text-center font-black text-muted-foreground/80">
                                            ${stat.unitPrice.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="py-6 px-10 text-right">
                                            <span className="text-xl font-black text-primary">${stat.totalEarned.toFixed(2)}</span>
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
