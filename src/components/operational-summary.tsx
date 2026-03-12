import { summarizeOperationalStatus } from "@/ai/flows/summarize-operational-status"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot } from "lucide-react"
import type { School } from "@/lib/data"

export async function OperationalSummary({ school }: { school: School }) {
    if (school.cameras.length === 0) {
        return (
            <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Bot className="h-5 w-5 text-muted-foreground" />
                        <span>Resumen Operativo (IA)</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No hay cámaras registradas en esta escuela para generar un resumen.</p>
                </CardContent>
            </Card>
        );
    }
    
    const input = {
        schoolName: school.name,
        cameraStatuses: school.cameras.map(c => ({
            id: c.id,
            name: c.name,
            status: c.status,
            lastActivity: c.lastActivity,
            issues: c.issues,
        }))
    };
    
    let summary = "No se pudo generar el resumen en este momento. Por favor, inténtelo de nuevo más tarde.";
    try {
        const result = await summarizeOperationalStatus(input);
        summary = result.summary;
    } catch (error) {
        console.error("La generación del resumen de IA falló:", error);
    }
    
    return (
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Bot className="h-5 w-5 text-primary" />
                    <span>Resumen Operativo (IA)</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-foreground/80 leading-relaxed">{summary}</p>
            </CardContent>
        </Card>
    )
}
