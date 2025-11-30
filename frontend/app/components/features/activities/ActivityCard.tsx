import type { Activity } from "~/lib/types"
import { Card } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Avatar, AvatarFallback } from "~/components/ui/avatar"
import { formatDateTime, formatHours, getStatusColor } from "~/lib/utils"
import { Link } from "react-router"

interface ActivityCardProps {
  activity: Activity
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const workerInitials = activity.worker
    ? activity.worker.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?"

  return (
    <Link to={`/activities/${activity.id}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <div className="p-3 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{activity.title}</p>
              {activity.contract?.orderNumber && (
                <p className="text-xs text-muted-foreground">
                  {activity.contract.orderNumber}
                </p>
              )}
            </div>
            <Badge className={getStatusColor(activity.status)}>
              {activity.status}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {workerInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">
                {activity.worker?.name || "Sin asignar"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {activity.client?.name}
              </p>
            </div>
          </div>

          <div className="space-y-1 text-xs text-muted-foreground">
            <p>{formatDateTime(activity.scheduledStart)}</p>
            <p>{formatHours(activity.durationHours)} • {activity.location}</p>
          </div>
        </div>
      </Card>
    </Link>
  )
}

