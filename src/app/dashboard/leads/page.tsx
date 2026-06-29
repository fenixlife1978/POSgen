'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MoreHorizontal,
  Download,
  Calendar as CalendarIcon,
  RefreshCcw,
  User,
  Zap
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from '@/hooks/use-toast';
import { Lead } from '@/types/marketing';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function LeadsMonitorPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Simulación de carga de datos en tiempo real
  useEffect(() => {
    const mockLeads: Lead[] = [
      { 
        id: '1', 
        conversionId: 'CPA-98231', 
        subId: 'CM-01', 
        campaignName: 'Seguros Hogar 2024', 
        amount: 2.50, 
        status: 'approved', 
        createdAt: new Date().toISOString(), 
        source: 'Cpamerchant' 
      },
      { 
        id: '2', 
        conversionId: 'CPA-98232', 
        subId: 'ER-FB', 
        campaignName: 'Inversiones Cripto', 
        amount: 5.00, 
        status: 'pending', 
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), 
        source: 'Alpha Leads' 
      },
      { 
        id: '3', 
        conversionId: 'CPA-98233', 
        subId: 'CM-01', 
        campaignName: 'Seguros Hogar 2024', 
        amount: 2.50, 
        status: 'rejected', 
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), 
        source: 'Cpamerchant' 
      },
    ];
    setLeads(mockLeads);
  }, []);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.subId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         lead.conversionId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRefresh = () => {
    toast({
      title: "Actualizando leads",
      description: "Consultando las últimas conversiones en las redes CPA...",
    });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-foreground/90">Monitor de Leads</h2>
          <p className="text-lg text-muted-foreground/80 font-medium">Visualiza y audita las conversiones en tiempo real.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-12 rounded-2xl border-2 font-bold gap-2" onClick={handleRefresh}>
            <RefreshCcw className="size-4" />
            Actualizar
          </Button>
          <Button className="h-12 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 px-6 font-bold gap-2">
            <Download className="size-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-card/40 p-6 rounded-[2rem] border border-muted-foreground/5 backdrop-blur-sm">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
          <Input 
            placeholder="Buscar por SubID o ID de Conversión..." 
            className="pl-11 h-12 rounded-xl bg-background/50 border-none shadow-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-12 w-48 rounded-xl bg-background/50 border-none shadow-sm font-bold">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-primary" />
              <SelectValue placeholder="Estado" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-none shadow-xl">
            <SelectItem value="all">Todos los Estados</SelectItem>
            <SelectItem value="approved">Aprobados</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="rejected">Rechazados</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("h-12 rounded-xl border-none shadow-sm bg-background/50 px-6 font-bold gap-2", !date && "text-muted-foreground")}>
              <CalendarIcon className="size-4 text-primary" />
              {date ? format(date, "PPP", { locale: es }) : "Rango de Fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-[2rem] border-none shadow-2xl" align="end">
            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={es} />
          </PopoverContent>
        </Popover>

        <Button variant="ghost" className="h-12 w-12 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">
          <Filter className="size-5" />
        </Button>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-black/5 bg-card/50 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="py-6 px-8 font-black text-muted-foreground/50 uppercase tracking-widest text-[10px]">ID Conversión</TableHead>
              <TableHead className="py-6 px-8 font-black text-muted-foreground/50 uppercase tracking-widest text-[10px]">Trabajador / SubID</TableHead>
              <TableHead className="py-6 px-8 font-black text-muted-foreground/50 uppercase tracking-widest text-[10px]">Campaña / Red</TableHead>
              <TableHead className="py-6 px-8 font-black text-muted-foreground/50 uppercase tracking-widest text-[10px]">Monto</TableHead>
              <TableHead className="py-6 px-8 font-black text-muted-foreground/50 uppercase tracking-widest text-[10px]">Fecha y Hora</TableHead>
              <TableHead className="py-6 px-8 font-black text-muted-foreground/50 uppercase tracking-widest text-[10px] text-center">Estado</TableHead>
              <TableHead className="py-6 px-8 font-black text-muted-foreground/50 uppercase tracking-widest text-[10px] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => (
              <TableRow key={lead.id} className="group hover:bg-primary/5 transition-all border-muted-foreground/5">
                <TableCell className="py-6 px-8">
                  <span className="font-mono text-xs font-bold text-muted-foreground">{lead.conversionId}</span>
                </TableCell>
                <TableCell className="py-6 px-8">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <User className="size-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground/90">{lead.subId}</span>
                      <span className="text-[10px] text-muted-foreground/60 font-medium">Tracking Activo</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-6 px-8">
                  <div className="flex flex-col">
                    <span className="font-black text-sm text-foreground/80">{lead.campaignName}</span>
                    <span className="text-[10px] font-bold text-primary/60 uppercase">{lead.source}</span>
                  </div>
                </TableCell>
                <TableCell className="py-6 px-8">
                  <span className="text-lg font-black text-primary">${lead.amount.toFixed(2)}</span>
                </TableCell>
                <TableCell className="py-6 px-8">
                  <div className="flex items-center gap-2 text-muted-foreground font-medium text-xs">
                    <Clock className="size-3" />
                    {format(new Date(lead.createdAt), "HH:mm '·' dd/MM/yy")}
                  </div>
                </TableCell>
                <TableCell className="py-6 px-8">
                  <div className="flex justify-center">
                    <StatusBadge status={lead.status} />
                  </div>
                </TableCell>
                <TableCell className="py-6 px-8 text-right">
                  <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 transition-colors">
                    <MoreHorizontal className="size-4 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredLeads.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <Users className="size-16 mx-auto text-muted-foreground/20" />
            <p className="text-muted-foreground font-medium">No se encontraron leads con los filtros actuales.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    approved: { label: 'Aprobado', icon: <CheckCircle2 className="size-3" />, className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    pending: { label: 'Pendiente', icon: <Clock className="size-3" />, className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    rejected: { label: 'Rechazado', icon: <XCircle className="size-3" />, className: 'bg-destructive/10 text-destructive border-destructive/20' },
  };

  const config = configs[status] || configs.pending;

  return (
    <Badge variant="outline" className={cn("rounded-full px-3 py-1 font-black uppercase text-[9px] gap-1.5 border-2", config.className)}>
      {config.icon}
      {config.label}
    </Badge>
  );
}
