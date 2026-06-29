
'use client';

import React, { useState } from 'react';
import { 
  Database, 
  Link2, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Save,
  Globe,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { DatabaseProvider, AgencyIntegration } from '@/types/settings';

export default function SettingsPage() {
  const [dbProvider, setDbProvider] = useState<DatabaseProvider>('mongodb');
  const [agencies, setAgencies] = useState<AgencyIntegration[]>([]);

  const addAgency = () => {
    const newAgency: AgencyIntegration = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      apiKey: ''
    };
    setAgencies([...agencies, newAgency]);
  };

  const removeAgency = (id: string) => {
    setAgencies(agencies.filter(a => a.id !== id));
  };

  const handleSave = () => {
    toast({
      title: "Configuración guardada",
      description: "Los cambios se han aplicado correctamente al sistema.",
    });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-foreground/90">Configuración del Sistema</h2>
          <p className="text-lg text-muted-foreground/80 font-medium">Gestiona el motor dinámico y las integraciones de tu plataforma.</p>
        </div>
        <Button onClick={handleSave} className="rounded-2xl px-8 h-12 shadow-lg shadow-primary/20 gap-2">
          <Save className="size-5" />
          Guardar Cambios
        </Button>
      </div>

      <Tabs defaultValue="database" className="w-full space-y-8">
        <TabsList className="bg-muted/50 p-1 rounded-[2rem] h-16 w-full max-w-2xl border border-white/5">
          <TabsTrigger value="database" className="rounded-[1.5rem] flex-1 gap-2 data-[state=active]:soft-shadow">
            <Database className="size-4" />
            <span className="font-bold">Base de Datos</span>
          </TabsTrigger>
          <TabsTrigger value="agencies" className="rounded-[1.5rem] flex-1 gap-2 data-[state=active]:soft-shadow">
            <Link2 className="size-4" />
            <span className="font-bold">Agencias (CPA)</span>
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="rounded-[1.5rem] flex-1 gap-2 data-[state=active]:soft-shadow">
            <MessageSquare className="size-4" />
            <span className="font-bold">WhatsApp</span>
          </TabsTrigger>
        </TabsList>

        {/* --- Pestaña de Base de Datos --- */}
        <TabsContent value="database" className="space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-black/5 bg-card/50 backdrop-blur-sm">
            <CardHeader className="p-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600">
                  <Database className="size-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Conexión de Datos</CardTitle>
                  <CardDescription className="text-base">Selecciona el motor que alimentará la plataforma.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-8">
              <div className="space-y-3">
                <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">Proveedor</Label>
                <Select value={dbProvider} onValueChange={(v: DatabaseProvider) => setDbProvider(v)}>
                  <SelectTrigger className="h-14 rounded-2xl border-muted-foreground/10 bg-background/50 text-lg font-medium px-6">
                    <SelectValue placeholder="Selecciona un proveedor" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="mongodb">MongoDB (Atlas / Local)</SelectItem>
                    <SelectItem value="turso">Turso (LibSQL / Edge)</SelectItem>
                    <SelectItem value="firebase">Firebase (Firestore / RTDB)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dbProvider === 'mongodb' && (
                <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                  <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">Connection String (SRV)</Label>
                  <Input 
                    placeholder="mongodb+srv://usuario:password@cluster.mongodb.net/database" 
                    className="h-14 rounded-2xl border-muted-foreground/10 bg-background/50 px-6 font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground italic">Asegúrate de permitir el acceso IP desde el servidor de despliegue.</p>
                </div>
              )}

              {dbProvider === 'turso' && (
                <div className="grid gap-6 md:grid-cols-2 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-3">
                    <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">Database URL</Label>
                    <Input 
                      placeholder="libsql://tu-db.turso.io" 
                      className="h-14 rounded-2xl border-muted-foreground/10 bg-background/50 px-6"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">Auth Token</Label>
                    <Input 
                      type="password"
                      placeholder="Tu token de autenticación" 
                      className="h-14 rounded-2xl border-muted-foreground/10 bg-background/50 px-6"
                    />
                  </div>
                </div>
              )}

              {dbProvider === 'firebase' && (
                <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                  <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">Service Account JSON</Label>
                  <Textarea 
                    placeholder='{ "type": "service_account", ... }' 
                    className="min-h-[200px] rounded-[1.5rem] border-muted-foreground/10 bg-background/50 p-6 font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Pega aquí el contenido completo del archivo JSON de tu cuenta de servicio.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Pestaña de Agencias --- */}
        <TabsContent value="agencies" className="space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-black/5 bg-card/50 backdrop-blur-sm">
            <CardHeader className="p-8 flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600">
                  <Link2 className="size-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Integración de Agencias (CPA)</CardTitle>
                  <CardDescription className="text-base">Conecta proveedores externos para consulta de datos.</CardDescription>
                </div>
              </div>
              <Button onClick={addAgency} variant="outline" className="rounded-2xl gap-2 border-2 hover:bg-indigo-50 font-bold">
                <Plus className="size-4" />
                Añadir Agencia
              </Button>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              {agencies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-muted-foreground/10 rounded-[2rem] bg-muted/10">
                  <Zap className="size-12 text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground font-medium">No hay agencias configuradas.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {agencies.map((agency) => (
                    <div key={agency.id} className="flex flex-col md:flex-row items-end md:items-center gap-4 p-6 rounded-[2rem] bg-background/40 border border-muted-foreground/5 animate-in zoom-in-95 duration-200">
                      <div className="flex-1 w-full space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 ml-2">Nombre de la Agencia</Label>
                        <Input 
                          placeholder="Ej: Cpamerchant" 
                          className="h-12 rounded-xl bg-background px-4 border-muted-foreground/10 font-bold"
                        />
                      </div>
                      <div className="flex-[2] w-full space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 ml-2">API Key</Label>
                        <Input 
                          placeholder="Introduce la llave de acceso" 
                          type="password"
                          className="h-12 rounded-xl bg-background px-4 border-muted-foreground/10 font-mono"
                        />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeAgency(agency.id)}
                        className="size-12 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="size-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Pestaña de WhatsApp --- */}
        <TabsContent value="whatsapp" className="space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-black/5 bg-card/50 backdrop-blur-sm">
            <CardHeader className="p-8">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
                  <MessageSquare className="size-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Pasarela de WhatsApp</CardTitle>
                  <CardDescription className="text-base">Configura el servidor de mensajería para notificaciones y leads.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-8">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-3">
                  <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
                    <Globe className="size-4" /> URL del Servidor
                  </Label>
                  <Input 
                    placeholder="https://tu-servidor-api.com" 
                    className="h-14 rounded-2xl border-muted-foreground/10 bg-background/50 px-6 font-medium"
                  />
                  <p className="text-xs text-muted-foreground">Endpoint de Evolution API o similar.</p>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
                    <ShieldCheck className="size-4" /> Token Global
                  </Label>
                  <Input 
                    type="password"
                    placeholder="Tu API Authentication Token" 
                    className="h-14 rounded-2xl border-muted-foreground/10 bg-background/50 px-6"
                  />
                  <p className="text-xs text-muted-foreground">Token maestro para autorizar peticiones.</p>
                </div>
              </div>

              <div className="p-6 rounded-[1.5rem] bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-4">
                <div className="size-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                  <Zap className="size-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-emerald-900/80">Estado de Conexión</h4>
                  <p className="text-sm text-emerald-700/60 font-medium">Configura los parámetros anteriores para verificar la comunicación.</p>
                </div>
                <Badge className="bg-emerald-500 hover:bg-emerald-600 rounded-full px-4 py-1">Desconectado</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
