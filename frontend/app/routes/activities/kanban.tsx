import { useEffect, useState } from "react"
import { getActivities } from "~/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Plus } from "lucide-react"
import { getStatusColor } from "~/lib/utils"
import { ActivityCard } from "~/components/features/activities/ActivityCard"
import { ActivityFormModal } from "~/components/features/activities/ActivityFormModal"
import type { ActivityStatus, Activity } from "~/lib/types"

const STATUS_COLUMNS: ActivityStatus[] = [
  "UNASSIGNED",
  "SCHEDULED",
  "IN_PROGRESS",
  "DONE",
  "VERIFIED",
  "INVOICED",
]

export function meta() {
  return [{ title: "Kanban - Actividades" }]
}

export default function KanbanBoard() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getActivities()
      .then(setActivities)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  const activitiesByStatus = STATUS_COLUMNS.reduce((acc, status) => {
    acc[status] = activities.filter((a) => a.status === status)
    return acc
  }, {} as Record<ActivityStatus, typeof activities>)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tablero Kanban</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Actividad
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
        {STATUS_COLUMNS.map((status) => (
          <Card key={status} className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                <Badge className={getStatusColor(status)}>{status}</Badge>
                <span className="ml-2 text-muted-foreground">
                  ({activitiesByStatus[status].length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-2 overflow-y-auto">
              {activitiesByStatus[status].map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <ActivityFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onActivityCreated={() => {
          getActivities()
            .then(setActivities)
            .catch(console.error)
        }}
      />
    </div>
  )
}

