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
                        <span>AI Operational Summary</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No cameras registered for this school to generate a summary.</p>
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
    
    let summary = "Could not generate summary at this time. Please try again later.";
    try {
        const result = await summarizeOperationalStatus(input);
        summary = result.summary;
    } catch (error) {
        console.error("AI summary generation failed:", error);
    }
    
    return (
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Bot className="h-5 w-5 text-primary" />
                    <span>AI Operational Summary</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-foreground/80 leading-relaxed">{summary}</p>
            </CardContent>
        </Card>
    )
}
