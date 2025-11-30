import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { activitySchema, type ActivityFormData } from "~/lib/validations"
import { createActivity, getClients, getContracts, getWorkers } from "~/lib/api"
import type { Client, Contract, User } from "~/lib/types"

interface ActivityFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onActivityCreated?: () => void
}

export function ActivityFormModal({
  open,
  onOpenChange,
  onActivityCreated,
}: ActivityFormModalProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [workers, setWorkers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
  })

  const selectedClientId = watch("clientId")

  // Load data when modal opens
  useEffect(() => {
    if (open) {
      Promise.all([
        getClients(),
        getWorkers(),
      ]).then(([clientsData, workersData]) => {
        setClients(clientsData)
        setWorkers(workersData)
      })
    }
  }, [open])

  // Load contracts when client changes
  useEffect(() => {
    if (selectedClientId) {
      getContracts(selectedClientId).then(setContracts)
    } else {
      setContracts([])
    }
  }, [selectedClientId])

  const onSubmit = async (data: ActivityFormData) => {
    setLoading(true)
    try {
      await createActivity({
        ...data,
        scheduledStart: data.scheduledStart.toISOString(),
        scheduledEnd: data.scheduledEnd.toISOString(),
      })
      reset()
      onOpenChange(false)
      onActivityCreated?.()
    } catch (error) {
      console.error("Error creating activity:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva Actividad</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Cliente *</label>
            <select
              {...register("clientId")}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="">Seleccionar cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {errors.clientId && (
              <p className="mt-1 text-sm text-destructive">
                {errors.clientId.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Contrato (Opcional)</label>
            <select
              {...register("contractId")}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              disabled={!selectedClientId}
            >
              <option value="">Sin contrato específico</option>
              {contracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.orderNumber} ({contract.hoursRemaining}h restantes)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Título *</label>
            <Input {...register("title")} />
            {errors.title && (
              <p className="mt-1 text-sm text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Fecha/Hora Inicio *</label>
              <Input
                type="datetime-local"
                {...register("scheduledStart")}
              />
              {errors.scheduledStart && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.scheduledStart.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Fecha/Hora Fin *</label>
              <Input
                type="datetime-local"
                {...register("scheduledEnd")}
              />
              {errors.scheduledEnd && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.scheduledEnd.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Trabajador (Opcional)</label>
            <select
              {...register("workerId")}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="">Sin asignar</option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.name} ({worker.specialty || "Sin especialidad"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Ubicación *</label>
            <Input {...register("location")} />
            {errors.location && (
              <p className="mt-1 text-sm text-destructive">
                {errors.location.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Descripción</label>
            <textarea
              {...register("description")}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Actividad"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

