import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Link } from "react-router"
import { Button } from "~/components/ui/button"
import { Receipt, Users } from "lucide-react"

export function meta() {
  return [{ title: "Facturación - Gecko" }]
}

export default function BillingIndex() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Facturación</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Facturas a Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Genera facturas para clientes basadas en actividades verificadas.
            </p>
            <Link to="/billing/clients">
              <Button>Gestionar Facturas</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Pagos a Trabajadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Genera reportes de pago para trabajadores basados en horas trabajadas.
            </p>
            <Link to="/billing/workers">
              <Button>Gestionar Pagos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

