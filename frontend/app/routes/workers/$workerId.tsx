import { useEffect, useState } from "react"
import { useParams } from "react-router"
import { getWorker, getActivities } from "~/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { formatCurrency, formatHours, formatDate } from "~/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import type { User, Activity } from "~/lib/types"

export function meta() {
  return [{ title: "Detalle Trabajador - Gecko" }]
}

export default function WorkerDetail() {
  const { workerId } = useParams()
  const [worker, setWorker] = useState<User | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workerId) return
    
    Promise.all([
      getWorker(workerId),
      getActivities({ workerId }),
    ])
      .then(([workerData, activitiesData]) => {
        setWorker(workerData)
        setActivities(activitiesData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [workerId])

  if (loading || !worker) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  // Calculate stats
  const totalHours = activities
    .filter((a) => a.status === "DONE" || a.status === "VERIFIED" || a.status === "INVOICED")
    .reduce((sum, a) => sum + a.durationHours, 0)
  const totalEarnings = totalHours * worker.hourlyRate
  const stats = { totalHours, totalEarnings }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del Trabajador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="font-medium">{worker.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{worker.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rol</p>
              <Badge>{worker.role}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Especialidad</p>
              <p className="font-medium">{worker.specialty || "Sin especialidad"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tarifa por Hora</p>
              <p className="font-medium">{formatCurrency(worker.hourlyRate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Horas Trabajadas</p>
              <p className="text-2xl font-bold">{formatHours(stats.totalHours)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ganancias Totales</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Actividades Asignadas</p>
              <p className="text-2xl font-bold">{activities.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actividades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.title}</TableCell>
                    <TableCell>{activity.client?.name || "-"}</TableCell>
                    <TableCell>{formatDate(activity.scheduledStart)}</TableCell>
                    <TableCell>{formatHours(activity.durationHours)}</TableCell>
                    <TableCell>
                      <Badge>{activity.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

