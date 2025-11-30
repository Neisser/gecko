import { useEffect, useState } from "react"
import { getInvoices, getClients, generateClientInvoice } from "~/lib/api"
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
import { invoiceGenerationSchema, type InvoiceGenerationFormData } from "~/lib/validations"
import { formatCurrency, formatDate } from "~/lib/utils"
import { Badge } from "~/components/ui/badge"
import type { Invoice, Client } from "~/lib/types"

export function meta() {
  return [{ title: "Facturas a Clientes - Gecko" }]
}

export default function ClientInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getInvoices("CLIENT_BILL"),
      getClients(),
    ])
      .then(([invoicesData, clientsData]) => {
        setInvoices(invoicesData)
        setClients(clientsData)
      })
      .catch(console.error)
      .finally(() => setPageLoading(false))
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InvoiceGenerationFormData>({
    resolver: zodResolver(invoiceGenerationSchema),
  })

  const onSubmit = async (data: InvoiceGenerationFormData) => {
    setLoading(true)
    try {
      await generateClientInvoice({
        clientId: data.clientId,
        periodStart: data.periodStart.toISOString(),
        periodEnd: data.periodEnd.toISOString(),
      })
      // Refresh invoices list
      getInvoices("CLIENT_BILL")
        .then(setInvoices)
        .catch(console.error)
      reset()
      setIsModalOpen(false)
    } catch (error) {
      console.error("Error generating invoice:", error)
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
        <h2 className="text-2xl font-bold">Facturas a Clientes</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          Generar Factura
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Facturas Generadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Monto Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Generación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.entityId}
                    </TableCell>
                    <TableCell>
                      {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge>{invoice.status}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(invoice.generatedAt)}</TableCell>
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
            <DialogTitle>Generar Factura</DialogTitle>
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
                {loading ? "Generando..." : "Generar Factura"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

