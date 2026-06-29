import React from 'react';
import Link from 'next/link';
import { ArrowRight, BarChart3, Target, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8 max-w-5xl mx-auto">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter">
            Domina tu <span className="text-primary">Marketing</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            La plataforma definitiva para gestionar campañas, analizar datos y convertir leads con inteligencia artificial.
          </p>
        </div>

        <div className="flex gap-4">
          <Button asChild size="lg" className="rounded-2xl px-8 shadow-lg shadow-primary/20">
            <Link href="/dashboard">
              Comenzar Ahora <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="rounded-2xl px-8 border-2">
            Ver Demo
          </Button>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-12">
          <FeatureCard 
            icon={<Target className="h-6 w-6 text-primary" />}
            title="Gestión de Campañas"
            description="Crea y optimiza tus campañas en múltiples canales desde un solo lugar."
          />
          <FeatureCard 
            icon={<Users className="h-6 w-6 text-primary" />}
            title="Lead Scoring"
            description="Identifica a tus clientes potenciales más valiosos automáticamente."
          />
          <FeatureCard 
            icon={<BarChart3 className="h-6 w-6 text-primary" />}
            title="Analítica Real-time"
            description="Visualiza el ROI de tus inversiones en tiempo real con dashboards claros."
          />
        </div>
      </section>

      <footer className="p-6 border-t text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} MarketerPro. Todos los derechos reservados.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow bg-card/50">
      <CardContent className="p-6 space-y-3">
        <div className="p-3 bg-primary/10 w-fit rounded-xl">
          {icon}
        </div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}