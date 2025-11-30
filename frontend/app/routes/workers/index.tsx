import { useEffect, useState } from "react"
import { getWorkers } from "~/lib/api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { Button } from "~/components/ui/button"
import { Plus } from "lucide-react"
import { formatCurrency } from "~/lib/utils"
import { Link } from "react-router"
import type { User } from "~/lib/types"
import { WorkerFormModal } from "~/components/features/workers/WorkerFormModal"

export function meta() {
  return [{ title: "Trabajadores - Gecko" }]
}

export default function WorkersList() {
  const [workers, setWorkers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadWorkers = () => {
    getWorkers()
      .then(setWorkers)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadWorkers()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Trabajadores</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Trabajador
        </Button>
      </div>

      <WorkerFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onWorkerCreated={loadWorkers}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Especialidad</TableHead>
              <TableHead>Tarifa/Hora</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workers.map((worker) => (
              <TableRow key={worker.id}>
                <TableCell className="font-medium">{worker.name}</TableCell>
                <TableCell>{worker.email}</TableCell>
                <TableCell>{worker.role}</TableCell>
                <TableCell>{worker.specialty || "-"}</TableCell>
                <TableCell>{formatCurrency(worker.hourlyRate)}</TableCell>
                <TableCell>
                  <Link to={`/workers/${worker.id}`}>
                    <Button variant="ghost" size="sm">
                      Ver Detalles
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

