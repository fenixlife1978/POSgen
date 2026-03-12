import { SchoolCard } from '@/components/school-card'
import { getSchools } from '@/lib/data'

export default async function DashboardPage() {
    const schools = await getSchools();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Resumen de Escuelas</h2>
                <p className="text-muted-foreground">
                    Un resumen de todos los sistemas de vigilancia de las escuelas conectadas.
                </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {schools.map(school => (
                    <SchoolCard key={school.id} school={school} />
                ))}
            </div>
        </div>
    )
}
