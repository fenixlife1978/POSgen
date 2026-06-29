'use client';

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Search, 
  MessageSquare, 
  ExternalLink, 
  Copy, 
  Plus, 
  Info,
  CheckCircle2,
  XCircle
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetTrigger
} from '@/components/ui/sheet';
import { toast } from '@/hooks/use-toast';
import { Worker, SubId } from '@/types/marketing';
import { getWorkers } from '@/lib/data';

export default function TeamPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  useEffect(() => {
    getWorkers().then(setWorkers);
  }, []);

  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "El enlace de tracking se ha copiado al portapapeles.",
    });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-foreground/90">Gestión de Equipo</h2>
          <p className="text-lg text-muted-foreground/80 font-medium">Supervisa a tus trabajadores y gestiona sus enlaces de tracking.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar trabajador..." 
            className="pl-11 h-12 rounded-2xl bg-card/50 border-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-black/5 bg-card/50 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-none">
              <TableHead className="py-6 px-8 font-bold text-muted-foreground/60 uppercase tracking-widest text-xs">Trabajador</TableHead>
              <TableHead className="py-6 px-8 font-bold text-muted-foreground/60 uppercase tracking-widest text-xs">WhatsApp</TableHead>
              <TableHead className="py-6 px-8 font-bold text-muted-foreground/60 uppercase tracking-widest text-xs">SubIds Activos</TableHead>
              <TableHead className="py-6 px-8 font-bold text-muted-foreground/60 uppercase tracking-widest text-xs text-center">Estado</TableHead>
              <TableHead className="py-6 px-8 font-bold text-muted-foreground/60 uppercase tracking-widest text-xs text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWorkers.map((worker) => (
              <TableRow key={worker.id} className="group hover:bg-primary/5 transition-colors border-muted/20">
                <TableCell className="py-6 px-8">
                  <div className="flex items-center gap-4">
                    <Avatar className="size-12 border-2 border-background shadow-md">
                      <AvatarImage src={`https://picsum.photos/seed/${worker.id}/100/100`} />
                      <AvatarFallback className="font-bold text-primary">{worker.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-black text-lg text-foreground/90">{worker.name}</span>
                      <span className="text-xs text-muted-foreground font-medium">ID: {worker.id}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-6 px-8">
                  <div className="flex items-center gap-2 text-muted-foreground font-bold">
                    <MessageSquare className="size-4 text-emerald-500" />
                    {worker.whatsapp}
                  </div>
                </TableCell>
                <TableCell className="py-6 px-8">
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="rounded-full px-3 py-1 font-bold">
                      {worker.subIds.length} Enlaces
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="py-6 px-8">
                  <div className="flex justify-center">
                    <Switch 
                      checked={worker.status === 'active'} 
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                </TableCell>
                <TableCell className="py-6 px-8 text-right">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button 
                        onClick={() => setSelectedWorker(worker)}
                        variant="ghost" 
                        className="rounded-xl h-12 px-6 font-bold gap-2 hover:bg-primary hover:text-white transition-all"
                      >
                        <Info className="size-4" />
                        Ver Enlaces
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[400px] sm:w-[540px] rounded-l-[3rem] border-none shadow-2xl bg-background/95 backdrop-blur-xl">
                      <SheetHeader className="p-8 pb-4">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary w-fit mb-4">
                          <Briefcase className="size-6" />
                        </div>
                        <SheetTitle className="text-3xl font-black">Asignación de Enlaces</SheetTitle>
                        <SheetDescription className="text-lg">Gestiona los SubIds y links de tracking para {worker.name}.</SheetDescription>
                      </SheetHeader>
                      <div className="p-8 space-y-8">
                        <div className="flex items-center justify-between">
                          <h4 className="font-black text-xl flex items-center gap-2">
                            <Plus className="size-5 text-primary" />
                            Añadir Nuevo SubId
                          </h4>
                        </div>
                        <div className="grid gap-4 p-6 rounded-[2rem] bg-muted/30 border border-muted-foreground/5">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Código SubId</label>
                            <Input placeholder="Ej: CM-01" className="h-12 rounded-xl bg-background border-none shadow-sm" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Oferta Relacionada</label>
                            <Input placeholder="Nombre de la oferta" className="h-12 rounded-xl bg-background border-none shadow-sm" />
                          </div>
                          <Button className="rounded-xl h-12 font-bold shadow-lg shadow-primary/20">Generar Enlace</Button>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-black text-muted-foreground/40 uppercase tracking-widest text-xs px-2">Enlaces Activos</h4>
                          {worker.subIds.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground font-medium">No hay enlaces asignados.</div>
                          ) : (
                            worker.subIds.map((subId) => (
                              <div key={subId.id} className="p-5 rounded-[1.5rem] bg-card border border-muted/20 shadow-sm space-y-3 group/item hover:border-primary/20 transition-all">
                                <div className="flex items-center justify-between">
                                  <Badge className="rounded-full bg-primary/10 text-primary border-none font-black">{subId.code}</Badge>
                                  <div className="flex items-center gap-1">
                                    <Button size="icon" variant="ghost" className="size-8 rounded-lg" onClick={() => copyToClipboard(subId.trackingLink)}>
                                      <Copy className="size-3.5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="size-8 rounded-lg">
                                      <ExternalLink className="size-3.5" />
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-sm font-bold text-foreground/80">{subId.offerName}</p>
                                <div className="text-[10px] font-mono text-muted-foreground truncate bg-muted/50 p-2 rounded-lg">
                                  {subId.trackingLink}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}