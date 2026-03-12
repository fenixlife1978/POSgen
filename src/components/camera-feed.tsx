import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import type { Camera } from "@/lib/data"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { cn } from "@/lib/utils"
import { Video, VideoOff } from "lucide-react"

export function CameraFeed({ camera }: { camera: Camera }) {
    const placeholder = PlaceHolderImages.find(p => p.id === camera.imageId);

    const statusColor = {
        online: "bg-green-500",
        offline: "bg-gray-500",
        error: "bg-red-500"
    };

    return (
        <Card className="overflow-hidden group transition-all duration-300 hover:shadow-lg hover:border-accent">
            <CardContent className="p-0">
                <div className="aspect-video relative overflow-hidden">
                    {placeholder ? (
                        <Image 
                            src={placeholder.imageUrl}
                            alt={placeholder.description}
                            fill
                            className={cn(
                                "object-cover transition-transform duration-300 group-hover:scale-105", 
                                camera.status !== 'online' && "grayscale contrast-75"
                            )}
                            data-ai-hint={placeholder.imageHint}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="bg-muted flex items-center justify-center">
                            <Video className="h-12 w-12 text-muted-foreground" />
                        </div>
                    )}
                    {camera.status !== 'online' && (
                         <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <VideoOff className="h-12 w-12 text-muted-foreground" />
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="p-3 flex justify-between items-center bg-card-foreground/5 border-t">
                <p className="font-medium text-sm truncate pr-2">{camera.name}</p>
                <div className="flex items-center gap-2 shrink-0">
                    <div className={cn("h-2 w-2 rounded-full", statusColor[camera.status])} />
                    <span className="text-xs capitalize text-muted-foreground">{camera.status}</span>
                </div>
            </CardFooter>
        </Card>
    )
}
