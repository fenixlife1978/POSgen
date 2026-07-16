
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Plus, 
  Search, 
  Globe, 
  DollarSign, 
  Link2, 
  MoreVertical,
  Zap,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCampaigns } from '@/lib/data';
import { Campaign } from '@/types/marketing';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    getCampaigns().then(setCampaigns);
  }, []);

  const filteredCampaigns = campaigns.filter(c => {
    const term = searchTerm.toLowerCase();
    return (c.name || "").toLowerCase().includes(term) ||
           (c.agencyName || "").toLowerCase().includes(term);
  });

  const handleToggleStatus = (id: string) => {
    setCampaigns(prev => prev.map(c => 
      c.id === id ? { ...c, status: c.status === 'active' ? 'paused' : 'active' } : c
    ));
    toast({
      title: "Estado actualizado",
      description: "El estado de la campaña se ha modificado correctamente.",
    });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-foreground/90">Gestión de Campañas</h2>
          <p className="text-lg text-muted-foreground/80 font-medium">Crea y optimiza tus ofertas de CPA con control total.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="h-14 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 px-8 font-black gap-2 transition-all active:scale-95">
              <Plus className="size-5" />
              Nueva Campaña
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden max-w-2xl">
            <div className="bg-primary p-10 text-white">
              <DialogHeader>
                <div className="size-16 rounded-[1.5rem] bg-white/20 backdrop-blur-md flex items-center justify-center mb-4">
                  <Megaphone className="size-8" />
                </div>
                <DialogTitle className="text-3xl font-black">Lanzar Oferta</DialogTitle>
                <DialogDescription className="text-white/70 text-lg">
                  Configura los parámetros de tracking y pago para tu nueva campaña.
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">ID de Oferta (Red)</Label>
                  <Input placeholder="Ej: 15420" className="h-12 rounded-xl bg-muted/30 border-none shadow-sm font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Agencia</Label>
                  <Select>
                    <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none shadow-sm font-bold">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-xl">
                      <SelectItem value="cpa_merchant">CPA Merchant</SelectItem>
                      <SelectItem value="alpha_leads">Alpha Leads</SelectItem>
                      <SelectItem value="private_network">Red Privada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Nombre de Campaña</Label>
                <Input placeholder="Ej: Vuelos Baratos Invierno" className="h-12 rounded-xl bg-muted/30 border-none shadow-sm font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">URL de Tracking Base</Label>
                <div className="flex gap-2">
                  <Input placeholder="https://tracking.link/offer?subid={subid}" className="h-12 rounded-xl bg-muted/30 border-none shadow-sm flex-1 font-mono text-xs" />
                  <Button variant="outline" size="icon" className="size-12 rounded-xl border-2">
                    <Link2 className="size-5" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Pago por Lead ($)</Label>
                  <Input type="number" step="0.01" placeholder="2.50" className="h-12 rounded-xl bg-muted/30 border-none shadow-sm font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Presupuesto Diario</Label>
                  <Input type="number" placeholder="500" className="h-12 rounded-xl bg-muted/30 border-none shadow-sm font-bold" />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button variant="ghost" className="rounded-xl h-12 px-6 font-bold" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button className="rounded-xl h-12 px-8 font-black shadow-lg shadow-primary/20">Crear Campaña</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-full max-w-xl">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/40" />
        <Input 
          placeholder="Buscar por nombre o agencia..." 
          className="pl-14 h-14 rounded-2xl bg-card/50 border-none shadow-sm text-lg font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filteredCampaigns.map((campaign) => (
          <CampaignCard 
            key={campaign.id} 
            campaign={campaign} 
            onToggle={() => handleToggleStatus(campaign.id)}
          />
        ))}
      </div>
    </div>
  );
}

function CampaignCard({ campaign, onToggle }: { campaign: any, onToggle: () => void }) {
  return (
    <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-black/5 bg-card/50 backdrop-blur-sm group hover:scale-[1.02] transition-all duration-300 overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className="rounded-full px-4 py-1 font-bold border-2 text-[10px] uppercase tracking-widest bg-primary/5 text-primary">
            {campaign.agencyName || 'Agencia'}
          </Badge>
          <Switch 
            checked={campaign.status === 'active'} 
            onCheckedChange={onToggle}
            className="data-[state=checked]:bg-emerald-500"
          />
        </div>
        <div className="space-y-1">
          <h3 className="text-2xl font-black text-foreground/90 group-hover:text-primary transition-colors truncate">
            {campaign.name}
          </h3>
          <p className="text-xs text-muted-foreground/60 font-medium">ID Oferta: {campaign.externalOfferId || campaign.id}</p>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-0 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-[1.5rem] bg-muted/30 border border-muted-foreground/5 space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground/40">
              <DollarSign className="size-3" /> Payout
            </div>
            <div className="text-xl font-black text-primary">${campaign.payoutPerLead || (campaign.budget / 1000).toFixed(2)}</div>
          </div>
          <div className="p-5 rounded-[1.5rem] bg-muted/30 border border-muted-foreground/5 space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground/40">
              <Zap className="size-3" /> Conversiones
            </div>
            <div className="text-xl font-black text-foreground/80">{campaign.metrics.conversions}</div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            <span>Presupuesto Consumido</span>
            <span>{Math.round((campaign.spent / campaign.budget) * 100)}%</span>
          </div>
          <div className="h-3 w-full bg-muted/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000" 
              style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
            />
          </div>
        </div>

        <Button variant="ghost" className="w-full rounded-2xl h-12 font-bold gap-2 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">
          <Activity className="size-4" />
          Ver Estadísticas Detalladas
        </Button>
      </CardContent>
    </Card>
  );
}
