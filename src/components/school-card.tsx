import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import type { School } from '@/lib/data';
import { ArrowRight, CheckCircle2, AlertTriangle, PowerOff } from 'lucide-react';
import { Badge } from './ui/badge';

type SchoolCardProps = {
    school: School;
};

export function SchoolCard({ school }: SchoolCardProps) {
    const online = school.cameras.filter(c => c.status === 'online').length;
    const offline = school.cameras.filter(c => c.status === 'offline').length;
    const error = school.cameras.filter(c => c.status === 'error').length;
    const total = school.cameras.length;

    let overallStatus: 'operational' | 'issues' | 'offline' = 'operational';
    if (error > 0) {
        overallStatus = 'issues';
    } else if (offline > 0 && offline === total) {
        overallStatus = 'offline';
    } else if (offline > 0) {
        overallStatus = 'issues'
    }

    const StatusIndicator = {
        operational: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        issues: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
        offline: <PowerOff className="h-5 w-5 text-red-500" />
    }[overallStatus];

    return (
        <Card className="h-full flex flex-col hover:border-primary transition-all duration-300 group">
            <Link href={`/dashboard/school/${school.id}`} className="flex flex-col h-full">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-semibold">{school.name}</CardTitle>
                        {StatusIndicator}
                    </div>
                    <CardDescription>
                        {total > 0 ? `${total} cámaras registradas` : "No hay cámaras registradas"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-2">
                     <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="border-green-500/50 text-green-400 bg-green-500/10">
                           <CheckCircle2 className="mr-1 h-3 w-3" /> En línea: {online}
                        </Badge>
                        <Badge variant="outline" className="border-gray-500/50 text-gray-400 bg-gray-500/10">
                           <PowerOff className="mr-1 h-3 w-3" /> Desconectadas: {offline}
                        </Badge>
                         {error > 0 && (
                            <Badge variant="destructive">
                                <AlertTriangle className="mr-1 h-3 w-3" /> Errores: {error}
                            </Badge>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                    <p className="flex items-center gap-1 text-sm text-primary group-hover:underline">
                        Ver Detalles <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </p>
                </CardFooter>
            </Link>
        </Card>
    )
}
