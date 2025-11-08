import { Button } from "@/components/ui/button"
import { PlusCircle, Calendar, BarChart3 } from "lucide-react"

export function QuickActions() {
  return (
    <div className="flex items-center gap-3">
      <Button size="sm" className="gap-2">
        <PlusCircle className="h-4 w-4" />
        Create Post
      </Button>
      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
        <Calendar className="h-4 w-4" />
        Schedule
      </Button>
      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
        <BarChart3 className="h-4 w-4" />
        Analytics
      </Button>
    </div>
  )
}
