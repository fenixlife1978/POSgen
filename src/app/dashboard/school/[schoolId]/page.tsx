import { CameraFeed } from "@/components/camera-feed"
import { OperationalSummary } from "@/components/operational-summary"
import { getSchoolById } from "@/lib/data"
import { notFound } from "next/navigation"

export default async function SchoolDetailPage({ params }: { params: { schoolId: string }}) {
    const school = await getSchoolById(params.schoolId);

    if (!school) {
        notFound();
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">{school.name}</h2>
                <p className="text-muted-foreground">Señales de cámara en vivo y estado operativo.</p>
            </div>
            
            <OperationalSummary school={school} />

            <div>
                <h3 className="text-xl font-semibold tracking-tight mb-4">Señales de Cámara</h3>
                {school.cameras.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {school.cameras.map(camera => (
                            <CameraFeed key={camera.id} camera={camera} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">No hay cámaras configuradas para esta escuela.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
