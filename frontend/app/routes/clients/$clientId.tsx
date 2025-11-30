import { useEffect, useState } from "react"
import { useParams } from "react-router"
import { getClient, getContracts, getActivities } from "~/lib/api"
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
import type { Client, Contract, Activity } from "~/lib/types"

export function meta() {
  return [{ title: "Detalle Cliente - Gecko" }]
}

export default function ClientDetail() {
  const { clientId } = useParams()
  const [client, setClient] = useState<Client | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clientId) return
    
    Promise.all([
      getClient(clientId),
      getContracts(clientId),
      getActivities({ clientId }),
    ])
      .then(([clientData, contractsData, activitiesData]) => {
        setClient(clientData)
        setContracts(contractsData)
        setActivities(activitiesData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [clientId])

  if (loading || !client) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="font-medium">{client.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contacto</p>
              <p className="font-medium">{client.contactName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{client.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tarifa Base</p>
              <p className="font-medium">
                {client.billingRate ? formatCurrency(client.billingRate) : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contratos (Bolsas de Horas)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número de Orden</TableHead>
                  <TableHead>Horas Totales</TableHead>
                  <TableHead>Horas Usadas</TableHead>
                  <TableHead>Horas Restantes</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">
                      {contract.orderNumber}
                    </TableCell>
                    <TableCell>{formatHours(contract.totalHours)}</TableCell>
                    <TableCell>{formatHours(contract.hoursUsed)}</TableCell>
                    <TableCell>{formatHours(contract.hoursRemaining)}</TableCell>
                    <TableCell>
                      <Badge>{contract.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
                  <TableHead>Trabajador</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.title}</TableCell>
                    <TableCell>{activity.worker?.name || "Sin asignar"}</TableCell>
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

