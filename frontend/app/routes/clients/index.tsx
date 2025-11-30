import { useEffect, useState } from "react"
import { getClients, getContracts } from "~/lib/api"
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
import type { Client, Contract } from "~/lib/types"
import { ClientFormModal } from "~/components/features/clients/ClientFormModal"

export function meta() {
  return [{ title: "Clientes - Gecko" }]
}

export default function ClientsList() {
  const [clients, setClients] = useState<Client[]>([])
  const [activeContractsByClient, setActiveContractsByClient] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadData = () => {
    Promise.all([
      getClients(),
      getContracts(),
    ])
      .then(([clientsData, contractsData]) => {
        setClients(clientsData)
        // Count active contracts per client
        const activeContracts = contractsData
          .filter((c) => c.status === "ACTIVE")
          .reduce((acc, contract) => {
            acc[contract.clientId] = (acc[contract.clientId] || 0) + 1
            return acc
          }, {} as Record<string, number>)
        setActiveContractsByClient(activeContracts)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
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
        <h2 className="text-2xl font-bold">Clientes</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      <ClientFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onClientCreated={loadData}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tarifa Base</TableHead>
              <TableHead>Contratos Activos</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.contactName}</TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>
                  {client.billingRate
                    ? formatCurrency(client.billingRate)
                    : "-"}
                </TableCell>
                <TableCell>
                  {activeContractsByClient[client.id] || 0}
                </TableCell>
                <TableCell>
                  <Link to={`/clients/${client.id}`}>
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

