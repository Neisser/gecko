import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("routes/_layout.tsx", [
    index("routes/dashboard.tsx"),
    route("calendar", "routes/calendar.tsx"),
    route("activities/kanban", "routes/activities/kanban.tsx"),
    route("billing", "routes/billing/index.tsx"),
    route("billing/clients", "routes/billing/client-invoices.tsx"),
    route("billing/workers", "routes/billing/worker-payouts.tsx"),
    route("workers", "routes/workers/index.tsx"),
    route("workers/:workerId", "routes/workers/$workerId.tsx"),
    route("clients", "routes/clients/index.tsx"),
    route("clients/:clientId", "routes/clients/$clientId.tsx"),
  ]),
] satisfies RouteConfig;
