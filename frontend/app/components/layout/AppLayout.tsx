import { Outlet, Link, useLocation } from "react-router"
import {
  LayoutDashboard,
  Calendar,
  KanbanSquare,
  Receipt,
  Users,
  Building2,
} from "lucide-react"
import { cn } from "~/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Calendario", href: "/calendar", icon: Calendar },
  { name: "Actividades", href: "/activities/kanban", icon: KanbanSquare },
  { name: "Facturación", href: "/billing", icon: Receipt },
  { name: "Trabajadores", href: "/workers", icon: Users },
  { name: "Clientes", href: "/clients", icon: Building2 },
]

export function AppLayout() {
  const location = useLocation()

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b px-6">
            <h1 className="text-xl font-bold">Gecko</h1>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== "/" && location.pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Admin User</p>
                <p className="text-xs text-muted-foreground truncate">admin@gecko.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b bg-card flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold">
            {navigation.find((item) => 
              location.pathname === item.href || 
              (item.href !== "/" && location.pathname.startsWith(item.href))
            )?.name || "Dashboard"}
          </h2>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

