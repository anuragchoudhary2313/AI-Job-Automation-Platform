import { cn } from "../../lib/utils"
import { Loader2 } from "lucide-react"

export function Loader({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin text-blue-600", className)} />;
}

export function PageLoader() {
  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <Loader className="h-8 w-8" />
    </div>
  )
}
