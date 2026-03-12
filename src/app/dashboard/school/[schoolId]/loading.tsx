import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SchoolDetailLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-5 w-1/3 mt-2" />
      </div>
      
      <Card>
        <CardHeader>
            <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>

      <div>
        <h3 className="text-xl font-semibold tracking-tight mb-4">Señales de Cámara</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <Skeleton className="aspect-video w-full" />
              </CardContent>
              <CardFooter className="p-3 flex justify-between items-center">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-12" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
