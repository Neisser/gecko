import { useEffect, useState } from "react"
import { getInvoices, getWorkers, generateWorkerPayout } from "~/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { payoutGenerationSchema, type PayoutGenerationFormData } from "~/lib/validations"
import { formatCurrency, formatDate } from "~/lib/utils"
import { Badge } from "~/components/ui/badge"
import type { Invoice, User } from "~/lib/types"

export function meta() {
  return [{ title: "Pagos a Trabajadores - Gecko" }]
}

export default function WorkerPayouts() {
  const [payouts, setPayouts] = useState<Invoice[]>([])
  const [workers, setWorkers] = useState<User[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getInvoices("WORKER_PAYOUT"),
      getWorkers(),
    ])
      .then(([payoutsData, workersData]) => {
        setPayouts(payoutsData)
        setWorkers(workersData)
      })
      .catch(console.error)
      .finally(() => setPageLoading(false))
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PayoutGenerationFormData>({
    resolver: zodResolver(payoutGenerationSchema),
  })

  const onSubmit = async (data: PayoutGenerationFormData) => {
    setLoading(true)
    try {
      await generateWorkerPayout({
        workerId: data.workerId,
        periodStart: data.periodStart.toISOString(),
        periodEnd: data.periodEnd.toISOString(),
      })
      // Refresh payouts list
      getInvoices("WORKER_PAYOUT")
        .then(setPayouts)
        .catch(console.error)
      reset()
      setIsModalOpen(false)
    } catch (error) {
      console.error("Error generating payout:", error)
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pagos a Trabajadores</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          Generar Pago
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pagos Generados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trabajador</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Monto Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Generación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="font-medium">
                      {payout.entityId}
                    </TableCell>
                    <TableCell>
                      {formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}
                    </TableCell>
                    <TableCell>{formatCurrency(payout.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge>{payout.status}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(payout.generatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Pago</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Trabajador *</label>
              <select
                {...register("workerId")}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="">Seleccionar trabajador</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name}
                  </option>
                ))}
              </select>
              {errors.workerId && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.workerId.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Fecha Inicio *</label>
                <Input
                  type="date"
                  {...register("periodStart")}
                />
                {errors.periodStart && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.periodStart.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Fecha Fin *</label>
                <Input
                  type="date"
                  {...register("periodEnd")}
                />
                {errors.periodEnd && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.periodEnd.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Generando..." : "Generar Pago"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

