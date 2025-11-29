- Start Date: 2025-01-27
- Members: Development Team
- RFC PR: (leave this empty)

# Summary

This RFC proposes the frontend architecture, page structure, and module organization for the Gecko SaaS MVP. The proposal defines the routing structure, component hierarchy, and UI implementation strategy using React Router v7, TypeScript, Tailwind CSS v4, and Shadcn/UI components, maintaining the existing boilerplate stack.

# Basic example

```tsx
// app/routes/dashboard.tsx
export default function Dashboard() {
  return (
    <Layout>
      <DashboardKPIs />
      <UrgentActivitiesList />
    </Layout>
  );
}

// app/routes/activities/kanban.tsx
export default function KanbanBoard() {
  return (
    <Layout>
      <KanbanBoard columns={statusColumns} />
      <FloatingAddButton />
    </Layout>
  );
}
```

# Motivation

The current frontend boilerplate provides a solid foundation with React Router v7, TypeScript, and Tailwind CSS v4, but lacks the structured pages and modules required for the Gecko MVP. We need to:

1. **Organize routes** for all major features (Dashboard, Calendar, Kanban, Billing, Workers, Clients)
2. **Establish a consistent layout** with sidebar navigation and header
3. **Create reusable UI components** using Shadcn/UI for rapid development
4. **Implement form handling** with react-hook-form and zod validation
5. **Maintain type safety** throughout the application with TypeScript
6. **Follow KISS principles** while building a scalable architecture

The expected outcome is a fully functional frontend that allows administrators to manage activities, track hours, schedule workers, and generate invoices, all while maintaining code quality and developer experience.

# Detailed design

## 1. Project Structure

```
frontend/
├── app/
│   ├── components/          # Shared UI components
│   │   ├── ui/             # Shadcn/UI components
│   │   ├── layout/         # Layout components (Sidebar, Header)
│   │   └── features/       # Feature-specific components
│   ├── lib/                # Utilities and helpers
│   │   ├── utils.ts        # General utilities
│   │   ├── validations.ts  # Zod schemas
│   │   └── api.ts          # API client functions
│   ├── hooks/              # Custom React hooks
│   ├── routes/             # React Router pages
│   │   ├── dashboard.tsx
│   │   ├── calendar.tsx
│   │   ├── activities/
│   │   │   └── kanban.tsx
│   │   ├── billing/
│   │   │   ├── index.tsx
│   │   │   ├── client-invoices.tsx
│   │   │   └── worker-payouts.tsx
│   │   ├── workers/
│   │   │   ├── index.tsx
│   │   │   └── $workerId.tsx
│   │   └── clients/
│   │       ├── index.tsx
│   │       └── $clientId.tsx
│   ├── root.tsx            # Root layout (updated)
│   └── routes.ts           # Route configuration
```

## 2. Route Configuration

Update `app/routes.ts` to include all major routes:

```typescript
import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/dashboard.tsx"),
  layout("routes/_layout.tsx", [
    route("dashboard", "routes/dashboard.tsx"),
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
```

## 3. Layout Component

Create `app/components/layout/AppLayout.tsx` with:
- **Fixed sidebar** on the left with navigation links
- **Header** with user profile and notifications
- **Main content area** with `<Outlet />` for child routes
- Responsive design (collapsible sidebar on mobile)

Navigation items:
- Dashboard (home icon)
- Calendar (calendar icon)
- Activities / Kanban (kanban icon)
- Billing (receipt icon)
- Workers (users icon)
- Clients (building icon)

## 4. Module Implementations

### 4.1 Dashboard Module (`routes/dashboard.tsx`)

**Components:**
- `DashboardKPIs`: Cards showing:
  - Horas ejecutadas este mes
  - Horas vendidas
  - Ingresos estimados
  - Costo operativo
- `UrgentActivitiesList`: List of activities that are:
  - Unassigned
  - Scheduled within next 7 days
  - Overdue

**Charts (using recharts):**
- Burndown chart by contract (bar chart)
- Worker occupancy heatmap
- Revenue vs Cost line chart

### 4.2 Activities / Kanban Module (`routes/activities/kanban.tsx`)

**Components:**
- `KanbanBoard`: Drag-and-drop board (optional in V1, but visual columns required)
  - Columns: UNASSIGNED, SCHEDULED, IN_PROGRESS, DONE, VERIFIED, INVOICED
- `ActivityCard`: Shows:
  - Order ID (e.g., AUT.HM 0517)
  - Client name
  - Worker (avatar + name)
  - Scheduled date/time
  - Duration
  - Status badge
  - Location
- `FloatingAddButton`: Opens modal to create new activity
- `ActivityFormModal`: Form with:
  - Client/Contract selector
  - Activity type/title
  - Scheduled start/end datetime
  - Worker assignment (optional)
  - Location
  - Description

**Validation:**
- Check worker availability (no overlapping activities)
- Verify contract has available hours
- Required fields validation

### 4.3 Calendar Module (`routes/calendar.tsx`)

**Components:**
- `CalendarView`: Monthly and weekly views
  - Use a library like `react-big-calendar` or build custom with Tailwind
- `CalendarEvent`: Time blocks showing:
  - Worker name
  - Client name
  - Activity title
  - Color coding by status (Green=Done, Gray=Pending, Red=Unassigned)

**Features:**
- Month/week view toggle
- Click event to view/edit activity
- Navigation (prev/next month)

### 4.4 Billing Module

#### 4.4.1 Client Invoices (`routes/billing/client-invoices.tsx`)

**Components:**
- `InvoiceList`: Table of generated invoices
- `GenerateInvoiceForm`: 
  - Client selector
  - Date range picker
  - Preview of activities to invoice
  - Generate PDF button
- `InvoicePreview`: Shows invoice details before generation

#### 4.4.2 Worker Payouts (`routes/billing/worker-payouts.tsx`)

**Components:**
- `PayoutList`: Table of worker payouts
- `GeneratePayoutForm`:
  - Worker selector
  - Date range picker
  - Hours summary
  - Total amount calculation
- `PayoutPreview`: Shows payout details

### 4.5 Workers Module

#### 4.5.1 Workers List (`routes/workers/index.tsx`)

**Components:**
- `WorkersTable`: Table with columns:
  - Name
  - Email
  - Role
  - Specialty
  - Hourly Rate
  - Actions (edit, view details)
- `AddWorkerButton`: Opens form to add new worker
- `WorkerForm`: Form for creating/editing workers

#### 4.5.2 Worker Detail (`routes/workers/$workerId.tsx`)

**Components:**
- `WorkerProfile`: Worker information card
- `WorkerActivities`: List of activities assigned to worker
- `WorkerStats`: Hours worked, earnings, etc.

### 4.6 Clients Module

#### 4.6.1 Clients List (`routes/clients/index.tsx`)

**Components:**
- `ClientsTable`: Table with columns:
  - Name
  - Contact Name
  - Email
  - Billing Rate
  - Active Contracts
  - Actions
- `AddClientButton`: Opens form to add new client
- `ClientForm`: Form for creating/editing clients

#### 4.6.2 Client Detail (`routes/clients/$clientId.tsx`)

**Components:**
- `ClientProfile`: Client information card
- `ContractsList`: List of contracts (bolsas de horas) with:
  - Order number
  - Total hours
  - Hours used
  - Hours remaining
  - Status
- `ClientActivities`: List of activities for this client

## 5. Shadcn/UI Setup

**Recommended Approach:** Use the Shadcn CLI to initialize and add components. This automatically handles Radix UI dependencies.

1. Initialize: `npx shadcn@latest init`
2. Add components: `npx shadcn@latest add [component-name]`

The CLI will create `components.json` with configuration similar to:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/app.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "~/components",
    "utils": "~/lib/utils"
  }
}
```

**Required Shadcn components** (add via CLI):
- `button`
- `card`
- `dialog` (for modals)
- `form` (with react-hook-form integration)
- `input`
- `select`
- `table`
- `badge`
- `calendar` (date picker)
- `avatar`
- `label` (for form labels)
- `tabs`

**Note:** The CLI automatically installs the corresponding Radix UI packages (e.g., `@radix-ui/react-dialog`, `@radix-ui/react-avatar`) as dependencies when you add each component. You don't need to manually install Radix UI packages.

## 6. Form Handling

Use `react-hook-form` with `zod` for all forms:

```typescript
// app/lib/validations.ts
import { z } from "zod";

export const activitySchema = z.object({
  title: z.string().min(1, "Title is required"),
  contractId: z.string().uuid().optional(),
  clientId: z.string().uuid(),
  workerId: z.string().uuid().optional(),
  scheduledStart: z.date(),
  scheduledEnd: z.date(),
  location: z.string().min(1, "Location is required"),
  description: z.string().optional(),
}).refine((data) => data.scheduledEnd > data.scheduledStart, {
  message: "End date must be after start date",
  path: ["scheduledEnd"],
});
```

## 7. API Integration

Create `app/lib/api.ts` with typed API functions:

```typescript
// app/lib/api.ts
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function getActivities(filters?: ActivityFilters) {
  const response = await fetch(`${API_BASE}/activities?${new URLSearchParams(filters)}`);
  return response.json();
}

export async function createActivity(data: CreateActivityInput) {
  const response = await fetch(`${API_BASE}/activities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}
```

## 8. State Management

For MVP, use React Router's built-in data loading with `loader` functions:

```typescript
// routes/dashboard.tsx
import { type Route } from "./+types/dashboard";
import { getDashboardData } from "~/lib/api";

export async function loader({ request }: Route.LoaderArgs) {
  const data = await getDashboardData();
  return { data };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { data } = loaderData;
  // Use data in component
}
```

If needed later, consider adding Zustand or React Query for client-side state.

## 9. Styling Guidelines

- **Color scheme**: Light background, minimal design
- **Typography**: Inter font (already configured)
- **Spacing**: Consistent Tailwind spacing scale
- **Components**: Use Shadcn/UI default styling, customize as needed
- **Dark mode**: Support via Tailwind dark mode (optional for MVP)

# Detailed Implementation

This section provides complete, ready-to-use code for implementing the RFC. All code follows the established patterns and maintains type safety.

## 1. Package Dependencies

Update `frontend/package.json` with core dependencies. **Note:** Radix UI packages will be automatically installed by Shadcn CLI when adding components, so they're not listed here manually.

```json
{
  "name": "frontend",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "react-router build",
    "dev": "react-router dev",
    "start": "react-router-serve ./build/server/index.js",
    "typecheck": "react-router typegen && tsc"
  },
  "dependencies": {
    "@react-router/node": "^7.9.2",
    "@react-router/serve": "^7.9.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "isbot": "^5.1.31",
    "lucide-react": "^0.454.0",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-hook-form": "^7.54.2",
    "react-router": "^7.9.2",
    "recharts": "^2.15.0",
    "tailwind-merge": "^2.5.4",
    "zod": "^3.24.1",
    "@hookform/resolvers": "^3.9.1"
  },
  "devDependencies": {
    "@react-router/dev": "^7.9.2",
    "@tailwindcss/vite": "^4.1.13",
    "@types/node": "^22",
    "@types/react": "^19.1.13",
    "@types/react-dom": "^19.1.9",
    "tailwindcss": "^4.1.13",
    "typescript": "^5.9.2",
    "vite": "^7.1.7",
    "vite-tsconfig-paths": "^5.1.4"
  }
}
```

## 2. Shadcn/UI Setup (Recommended Approach)

**Important:** Shadcn/UI is built on Radix UI primitives. When you use the Shadcn CLI to add components, it automatically installs the required Radix UI dependencies. This is the recommended approach.

### Step 1: Initialize Shadcn/UI

Run the following command in the `frontend` directory:

```bash
npx shadcn@latest init
```

This will:
- Create `components.json` configuration file
- Set up the necessary directory structure
- Configure Tailwind CSS variables

### Step 2: Add Required Components

After initialization, add the required components:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add input
npx shadcn@latest add badge
npx shadcn@latest add table
npx shadcn@latest add avatar
npx shadcn@latest add select
npx shadcn@latest add tabs
npx shadcn@latest add calendar
npx shadcn@latest add form
npx shadcn@latest add label
```

**Note:** The CLI will automatically install the corresponding Radix UI packages (e.g., `@radix-ui/react-dialog`, `@radix-ui/react-avatar`, etc.) as dependencies when you add each component.

### Alternative: Manual Component Implementation

If you prefer to implement components manually (not recommended), you would need to manually install Radix UI dependencies. However, using the CLI is preferred because:
- It keeps components up-to-date
- It handles dependency management automatically
- It ensures consistency with Shadcn/UI patterns
- It's easier to maintain

## 3. Shadcn/UI Configuration File

After running `npx shadcn@latest init`, you'll have a `components.json` file. Verify it matches this configuration:

### `frontend/components.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/app.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "~/components",
    "utils": "~/lib/utils"
  }
}
```

### Update `frontend/app/app.css`

```css
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif,
    "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  
  /* Shadcn/UI CSS Variables */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}

html,
body {
  @apply bg-background text-foreground;
}

@media (prefers-color-scheme: dark) {
  @theme {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
  color-scheme: dark;
}
```

## 3. Type Definitions

### `frontend/app/lib/types.ts`

```typescript
export enum UserRole {
  ADMIN = "ADMIN",
  WORKER = "WORKER",
}

export enum ActivityStatus {
  UNASSIGNED = "UNASSIGNED",
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  VERIFIED = "VERIFIED",
  INVOICED = "INVOICED",
}

export enum ContractStatus {
  ACTIVE = "ACTIVE",
  CLOSED = "CLOSED",
}

export enum InvoiceType {
  CLIENT_BILL = "CLIENT_BILL",
  WORKER_PAYOUT = "WORKER_PAYOUT",
}

export enum InvoiceStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  PAID = "PAID",
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  hourlyRate: number;
  specialty: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  contactName: string;
  email: string;
  billingRate: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  clientId: string;
  orderNumber: string;
  totalHours: number;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  hoursUsed: number; // Calculated field
  hoursRemaining: number; // Calculated field
  createdAt: string;
  updatedAt: string;
  client?: Client;
}

export interface Activity {
  id: string;
  title: string;
  contractId: string | null;
  clientId: string;
  workerId: string | null;
  status: ActivityStatus;
  scheduledStart: string;
  scheduledEnd: string;
  durationHours: number;
  location: string;
  description: string | null;
  evidenceUrl: string | null;
  createdAt: string;
  updatedAt: string;
  contract?: Contract;
  client?: Client;
  worker?: User;
}

export interface Invoice {
  id: string;
  type: InvoiceType;
  entityId: string; // ClientId or WorkerId
  totalAmount: number;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
  activities?: Activity[];
}

export interface DashboardData {
  kpis: {
    hoursExecutedThisMonth: number;
    hoursSold: number;
    estimatedRevenue: number;
    operationalCost: number;
  };
  urgentActivities: Activity[];
  contractBurndown: Array<{
    contractId: string;
    contractName: string;
    totalHours: number;
    hoursUsed: number;
  }>;
  workerOccupancy: Array<{
    workerId: string;
    workerName: string;
    dailyHours: Array<{ date: string; hours: number }>;
  }>;
  revenueVsCost: Array<{
    date: string;
    revenue: number;
    cost: number;
  }>;
}
```

## 4. Utility Functions

### `frontend/app/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatHours(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  if (minutes === 0) {
    return `${wholeHours}h`;
  }
  return `${wholeHours}h ${minutes}m`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    UNASSIGNED: "bg-red-100 text-red-800",
    SCHEDULED: "bg-yellow-100 text-yellow-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    DONE: "bg-green-100 text-green-800",
    VERIFIED: "bg-emerald-100 text-emerald-800",
    INVOICED: "bg-gray-100 text-gray-800",
    ACTIVE: "bg-green-100 text-green-800",
    CLOSED: "bg-gray-100 text-gray-800",
    DRAFT: "bg-yellow-100 text-yellow-800",
    SENT: "bg-blue-100 text-blue-800",
    PAID: "bg-green-100 text-green-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}
```

## 5. Validation Schemas

### `frontend/app/lib/validations.ts`

```typescript
import { z } from "zod";

export const activitySchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  contractId: z.string().uuid("ID de contrato inválido").optional().nullable(),
  clientId: z.string().uuid("ID de cliente inválido"),
  workerId: z.string().uuid("ID de trabajador inválido").optional().nullable(),
  scheduledStart: z.coerce.date({
    required_error: "La fecha de inicio es requerida",
  }),
  scheduledEnd: z.coerce.date({
    required_error: "La fecha de fin es requerida",
  }),
  location: z.string().min(1, "La ubicación es requerida"),
  description: z.string().optional().nullable(),
}).refine((data) => data.scheduledEnd > data.scheduledStart, {
  message: "La fecha de fin debe ser posterior a la fecha de inicio",
  path: ["scheduledEnd"],
});

export const workerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  role: z.enum(["ADMIN", "WORKER"]),
  hourlyRate: z.coerce.number().min(0, "La tarifa debe ser mayor o igual a 0"),
  specialty: z.string().optional().nullable(),
});

export const clientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  contactName: z.string().min(1, "El nombre de contacto es requerido"),
  email: z.string().email("Email inválido"),
  billingRate: z.coerce.number().min(0, "La tarifa debe ser mayor o igual a 0").optional().nullable(),
});

export const contractSchema = z.object({
  clientId: z.string().uuid("ID de cliente inválido"),
  orderNumber: z.string().min(1, "El número de orden es requerido"),
  totalHours: z.coerce.number().min(0.1, "Las horas deben ser mayores a 0"),
  startDate: z.coerce.date({
    required_error: "La fecha de inicio es requerida",
  }),
  endDate: z.coerce.date({
    required_error: "La fecha de fin es requerida",
  }),
}).refine((data) => data.endDate > data.startDate, {
  message: "La fecha de fin debe ser posterior a la fecha de inicio",
  path: ["endDate"],
});

export const invoiceGenerationSchema = z.object({
  clientId: z.string().uuid("ID de cliente inválido"),
  periodStart: z.coerce.date({
    required_error: "La fecha de inicio es requerida",
  }),
  periodEnd: z.coerce.date({
    required_error: "La fecha de fin es requerida",
  }),
}).refine((data) => data.periodEnd > data.periodStart, {
  message: "La fecha de fin debe ser posterior a la fecha de inicio",
  path: ["periodEnd"],
});

export const payoutGenerationSchema = z.object({
  workerId: z.string().uuid("ID de trabajador inválido"),
  periodStart: z.coerce.date({
    required_error: "La fecha de inicio es requerida",
  }),
  periodEnd: z.coerce.date({
    required_error: "La fecha de fin es requerida",
  }),
}).refine((data) => data.periodEnd > data.periodStart, {
  message: "La fecha de fin debe ser posterior a la fecha de inicio",
  path: ["periodEnd"],
});

export type ActivityFormData = z.infer<typeof activitySchema>;
export type WorkerFormData = z.infer<typeof workerSchema>;
export type ClientFormData = z.infer<typeof clientSchema>;
export type ContractFormData = z.infer<typeof contractSchema>;
export type InvoiceGenerationFormData = z.infer<typeof invoiceGenerationSchema>;
export type PayoutGenerationFormData = z.infer<typeof payoutGenerationSchema>;
```

## 6. API Client

### `frontend/app/lib/api.ts`

```typescript
import type {
  Activity,
  Client,
  Contract,
  DashboardData,
  Invoice,
  User,
  ActivityStatus,
} from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

// Activities
export async function getActivities(filters?: {
  status?: ActivityStatus;
  workerId?: string;
  clientId?: string;
  contractId?: string;
}): Promise<Activity[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.workerId) params.append("workerId", filters.workerId);
  if (filters?.clientId) params.append("clientId", filters.clientId);
  if (filters?.contractId) params.append("contractId", filters.contractId);

  return fetchAPI<Activity[]>(`/activities?${params.toString()}`);
}

export async function getActivity(id: string): Promise<Activity> {
  return fetchAPI<Activity>(`/activities/${id}`);
}

export async function createActivity(data: {
  title: string;
  contractId?: string | null;
  clientId: string;
  workerId?: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  location: string;
  description?: string | null;
}): Promise<Activity> {
  return fetchAPI<Activity>("/activities", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateActivity(
  id: string,
  data: Partial<Activity>
): Promise<Activity> {
  return fetchAPI<Activity>(`/activities/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteActivity(id: string): Promise<void> {
  return fetchAPI<void>(`/activities/${id}`, {
    method: "DELETE",
  });
}

// Workers
export async function getWorkers(): Promise<User[]> {
  return fetchAPI<User[]>("/workers");
}

export async function getWorker(id: string): Promise<User> {
  return fetchAPI<User>(`/workers/${id}`);
}

export async function createWorker(data: {
  name: string;
  email: string;
  role: "ADMIN" | "WORKER";
  hourlyRate: number;
  specialty?: string | null;
}): Promise<User> {
  return fetchAPI<User>("/workers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateWorker(
  id: string,
  data: Partial<User>
): Promise<User> {
  return fetchAPI<User>(`/workers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// Clients
export async function getClients(): Promise<Client[]> {
  return fetchAPI<Client[]>("/clients");
}

export async function getClient(id: string): Promise<Client> {
  return fetchAPI<Client>(`/clients/${id}`);
}

export async function createClient(data: {
  name: string;
  contactName: string;
  email: string;
  billingRate?: number | null;
}): Promise<Client> {
  return fetchAPI<Client>("/clients", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateClient(
  id: string,
  data: Partial<Client>
): Promise<Client> {
  return fetchAPI<Client>(`/clients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// Contracts
export async function getContracts(clientId?: string): Promise<Contract[]> {
  const params = clientId ? `?clientId=${clientId}` : "";
  return fetchAPI<Contract[]>(`/contracts${params}`);
}

export async function getContract(id: string): Promise<Contract> {
  return fetchAPI<Contract>(`/contracts/${id}`);
}

export async function createContract(data: {
  clientId: string;
  orderNumber: string;
  totalHours: number;
  startDate: string;
  endDate: string;
}): Promise<Contract> {
  return fetchAPI<Contract>("/contracts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Dashboard
export async function getDashboardData(): Promise<DashboardData> {
  return fetchAPI<DashboardData>("/dashboard");
}

// Invoices
export async function getInvoices(type?: "CLIENT_BILL" | "WORKER_PAYOUT"): Promise<Invoice[]> {
  const params = type ? `?type=${type}` : "";
  return fetchAPI<Invoice[]>(`/invoices${params}`);
}

export async function generateClientInvoice(data: {
  clientId: string;
  periodStart: string;
  periodEnd: string;
}): Promise<Invoice> {
  return fetchAPI<Invoice>("/invoices/client", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function generateWorkerPayout(data: {
  workerId: string;
  periodStart: string;
  periodEnd: string;
}): Promise<Invoice> {
  return fetchAPI<Invoice>("/invoices/worker", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Worker availability check
export async function checkWorkerAvailability(data: {
  workerId: string;
  scheduledStart: string;
  scheduledEnd: string;
  excludeActivityId?: string;
}): Promise<{ available: boolean; conflictingActivities?: Activity[] }> {
  return fetchAPI<{ available: boolean; conflictingActivities?: Activity[] }>(
    "/workers/check-availability",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}
```

## 7. Shadcn/UI Components

**Important:** The component implementations below are provided as **reference only**. The recommended approach is to use the Shadcn CLI (`npx shadcn@latest add [component]`) which will:
- Install the component with proper Radix UI dependencies
- Place it in the correct location
- Ensure it matches the latest Shadcn/UI patterns

These manual implementations are included for reference purposes, but you should use the CLI-generated components in your actual implementation.

### Reference: Manual Component Implementations

The following are example implementations. **Use CLI-generated components instead.**

#### `frontend/app/components/ui/button.tsx` (Reference Only)

```typescript
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

#### `frontend/app/components/ui/card.tsx` (Reference Only)

```typescript
import * as React from "react";
import { cn } from "~/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

#### `frontend/app/components/ui/dialog.tsx` (Reference Only)

```typescript
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "~/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
```

#### `frontend/app/components/ui/input.tsx` (Reference Only)

```typescript
import * as React from "react";
import { cn } from "~/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
```

#### `frontend/app/components/ui/badge.tsx` (Reference Only)

```typescript
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
```

#### `frontend/app/components/ui/table.tsx` (Reference Only)

```typescript
import * as React from "react";
import { cn } from "~/lib/utils";

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
```

#### `frontend/app/components/ui/avatar.tsx` (Reference Only)

```typescript
import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "~/lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
```

## 8. Layout Components

### `frontend/app/components/layout/AppLayout.tsx`

```typescript
import { Outlet, Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Calendar,
  KanbanSquare,
  Receipt,
  Users,
  Building2,
} from "lucide-react";
import { cn } from "~/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Calendario", href: "/calendar", icon: Calendar },
  { name: "Actividades", href: "/activities/kanban", icon: KanbanSquare },
  { name: "Facturación", href: "/billing", icon: Receipt },
  { name: "Trabajadores", href: "/workers", icon: Users },
  { name: "Clientes", href: "/clients", icon: Building2 },
];

export function AppLayout() {
  const location = useLocation();

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
                (item.href !== "/dashboard" && location.pathname.startsWith(item.href));
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
              );
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
              (item.href !== "/dashboard" && location.pathname.startsWith(item.href))
            )?.name || "Dashboard"}
          </h2>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

## 9. Route Files

### `frontend/app/routes.ts`

```typescript
import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/dashboard.tsx"),
  layout("routes/_layout.tsx", [
    route("dashboard", "routes/dashboard.tsx"),
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
```

### `frontend/app/routes/_layout.tsx`

```typescript
import type { Route } from "./+types/_layout";
import { AppLayout } from "~/components/layout/AppLayout";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Gecko - Gestión de Riesgos" }];
}

export default function Layout() {
  return <AppLayout />;
}
```

### `frontend/app/routes/dashboard.tsx`

```typescript
import type { Route } from "./+types/dashboard";
import { getDashboardData } from "~/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { formatCurrency, formatHours } from "~/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export async function loader({ request }: Route.LoaderArgs) {
  const data = await getDashboardData();
  return { data };
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Dashboard - Gecko" }];
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { data } = loaderData;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Horas Ejecutadas (Mes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHours(data.kpis.hoursExecutedThisMonth)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Vendidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHours(data.kpis.hoursSold)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Estimados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.kpis.estimatedRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costo Operativo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.kpis.operationalCost)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Burndown de Contratos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.contractBurndown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="contractName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalHours" fill="#8884d8" name="Horas Totales" />
                <Bar dataKey="hoursUsed" fill="#82ca9d" name="Horas Usadas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ingresos vs Costos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.revenueVsCost}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8884d8"
                  name="Ingresos"
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="#82ca9d"
                  name="Costos"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Actividades Urgentes</CardTitle>
        </CardHeader>
        <CardContent>
          {data.urgentActivities.length === 0 ? (
            <p className="text-muted-foreground">No hay actividades urgentes</p>
          ) : (
            <ul className="space-y-2">
              {data.urgentActivities.map((activity) => (
                <li
                  key={activity.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.client?.name} • {activity.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {new Date(activity.scheduledStart).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.status}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### `frontend/app/routes/activities/kanban.tsx`

```typescript
import type { Route } from "./+types/kanban";
import { getActivities } from "~/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";
import { formatDateTime, getStatusColor, formatHours } from "~/lib/utils";
import { ActivityCard } from "~/components/features/activities/ActivityCard";
import { ActivityFormModal } from "~/components/features/activities/ActivityFormModal";
import { useState } from "react";
import type { ActivityStatus } from "~/lib/types";

const STATUS_COLUMNS: ActivityStatus[] = [
  "UNASSIGNED",
  "SCHEDULED",
  "IN_PROGRESS",
  "DONE",
  "VERIFIED",
  "INVOICED",
];

export async function loader({ request }: Route.LoaderArgs) {
  const activities = await getActivities();
  return { activities };
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Kanban - Actividades" }];
}

export default function KanbanBoard({ loaderData }: Route.ComponentProps) {
  const { activities } = loaderData;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activitiesByStatus = STATUS_COLUMNS.reduce((acc, status) => {
    acc[status] = activities.filter((a) => a.status === status);
    return acc;
  }, {} as Record<ActivityStatus, typeof activities>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tablero Kanban</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Actividad
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
        {STATUS_COLUMNS.map((status) => (
          <Card key={status} className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                <Badge className={getStatusColor(status)}>{status}</Badge>
                <span className="ml-2 text-muted-foreground">
                  ({activitiesByStatus[status].length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-2 overflow-y-auto">
              {activitiesByStatus[status].map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <ActivityFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}
```

### `frontend/app/components/features/activities/ActivityCard.tsx`

```typescript
import type { Activity } from "~/lib/types";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { formatDateTime, formatHours, getStatusColor } from "~/lib/utils";
import { Link } from "react-router";

interface ActivityCardProps {
  activity: Activity;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const workerInitials = activity.worker
    ? activity.worker.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <Link to={`/activities/${activity.id}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <div className="p-3 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{activity.title}</p>
              {activity.contract?.orderNumber && (
                <p className="text-xs text-muted-foreground">
                  {activity.contract.orderNumber}
                </p>
              )}
            </div>
            <Badge className={getStatusColor(activity.status)}>
              {activity.status}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {workerInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">
                {activity.worker?.name || "Sin asignar"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {activity.client?.name}
              </p>
            </div>
          </div>

          <div className="space-y-1 text-xs text-muted-foreground">
            <p>{formatDateTime(activity.scheduledStart)}</p>
            <p>{formatHours(activity.durationHours)} • {activity.location}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
```

### `frontend/app/components/features/activities/ActivityFormModal.tsx`

```typescript
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { activitySchema, type ActivityFormData } from "~/lib/validations";
import { createActivity, getClients, getContracts, getWorkers } from "~/lib/api";
import { useRevalidator } from "react-router";
import type { Client, Contract, User } from "~/lib/types";

interface ActivityFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActivityFormModal({
  open,
  onOpenChange,
}: ActivityFormModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const revalidator = useRevalidator();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
  });

  const selectedClientId = watch("clientId");

  // Load data when modal opens
  useEffect(() => {
    if (open) {
      Promise.all([
        getClients(),
        getWorkers(),
      ]).then(([clientsData, workersData]) => {
        setClients(clientsData);
        setWorkers(workersData);
      });
    }
  }, [open]);

  // Load contracts when client changes
  useEffect(() => {
    if (selectedClientId) {
      getContracts(selectedClientId).then(setContracts);
    } else {
      setContracts([]);
    }
  }, [selectedClientId]);

  const onSubmit = async (data: ActivityFormData) => {
    setLoading(true);
    try {
      await createActivity({
        ...data,
        scheduledStart: data.scheduledStart.toISOString(),
        scheduledEnd: data.scheduledEnd.toISOString(),
      });
      revalidator.revalidate();
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating activity:", error);
    } finally {
      setLoading(false);
    }
  };

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
  );
}
```

## 10. Additional Route Files (Skeleton)

### `frontend/app/routes/calendar.tsx`

```typescript
import type { Route } from "./+types/calendar";
import { getActivities } from "~/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export async function loader({ request }: Route.LoaderArgs) {
  const activities = await getActivities();
  return { activities };
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Calendario - Gecko" }];
}

export default function Calendar({ loaderData }: Route.ComponentProps) {
  const { activities } = loaderData;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendario</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Vista de calendario - Implementación pendiente
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {activities.length} actividades cargadas
        </p>
      </CardContent>
    </Card>
  );
}
```

### `frontend/app/routes/workers/index.tsx`

```typescript
import type { Route } from "./+types/index";
import { getWorkers } from "~/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";
import { formatCurrency } from "~/lib/utils";
import { Link } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  const workers = await getWorkers();
  return { workers };
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Trabajadores - Gecko" }];
}

export default function WorkersList({ loaderData }: Route.ComponentProps) {
  const { workers } = loaderData;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Trabajadores</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Trabajador
        </Button>
      </div>

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
  );
}
```

### `frontend/app/routes/clients/index.tsx`

```typescript
import type { Route } from "./+types/index";
import { getClients } from "~/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";
import { formatCurrency } from "~/lib/utils";
import { Link } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  const clients = await getClients();
  return { clients };
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Clientes - Gecko" }];
}

export default function ClientsList({ loaderData }: Route.ComponentProps) {
  const { clients } = loaderData;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Clientes</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tarifa Base</TableHead>
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
  );
}
```

### `frontend/app/routes/billing/index.tsx`

```typescript
import type { Route } from "./+types/index";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Receipt, Users } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Facturación - Gecko" }];
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
  );
}
```

## 11. Environment Variables

Create `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:3000/api
```

## Implementation Notes

1. **Shadcn/UI Components - Use CLI**: 
   - **Recommended:** Use `npx shadcn@latest add [component]` to add all required components
   - The CLI automatically installs Radix UI dependencies (e.g., `@radix-ui/react-dialog`, `@radix-ui/react-avatar`)
   - Manual component implementations in this RFC are for reference only
   - CLI ensures components stay up-to-date and follow Shadcn/UI best practices
   - Required components: `button`, `card`, `dialog`, `input`, `badge`, `table`, `avatar`, `select`, `tabs`, `calendar`, `form`, `label`

2. **Radix UI Dependencies**: 
   - **Do NOT manually install Radix UI packages** - they're automatically added by Shadcn CLI
   - Shadcn/UI is built on Radix UI primitives, so Radix packages are required
   - The CLI manages these dependencies for you

3. **Icons**: Using `lucide-react` for icons. Install if not already present.

4. **Date Handling**: Using native HTML5 `datetime-local` inputs. Consider adding a proper date picker component later using `npx shadcn@latest add calendar`.

5. **Error Handling**: Add proper error boundaries and error states in production.

6. **Loading States**: Add skeleton loaders or spinners for better UX.

7. **Form Validation**: All forms use react-hook-form with zod validation. Error messages are in Spanish as per requirements.

8. **API Integration**: The API client assumes REST endpoints. Adjust based on your backend implementation.

9. **Responsive Design**: Layout is desktop-first. Mobile responsiveness can be enhanced later.

This implementation provides a complete foundation that can be reviewed and refined before actual development begins.

# Drawbacks

1. **React Router v7 learning curve**: Team may need to adapt to new data loading patterns (loaders vs useEffect)
2. **Shadcn/UI setup overhead**: Initial setup requires configuration, but pays off in development speed
3. **No drag-and-drop in V1**: Kanban board will be visual-only initially, may need to add interactivity later
4. **SSR complexity**: Current setup uses SSR, which adds complexity for API calls (need to handle server/client differences)
5. **Bundle size**: Adding recharts and other libraries will increase bundle size, but acceptable for MVP

# Alternatives

1. **Next.js instead of React Router**: Considered but rejected to maintain current stack and avoid migration overhead
2. **Material-UI instead of Shadcn/UI**: Rejected because Shadcn/UI offers better customization and Tailwind integration
3. **Redux for state management**: Rejected for MVP; React Router loaders + local state sufficient
4. **Full drag-and-drop Kanban**: Deferred to V2 to keep MVP simple (KISS principle)
5. **Separate routing library**: Rejected; React Router v7 provides excellent built-in features

# Adoption strategy

1. **Phase 1**: Set up Shadcn/UI and base layout components
2. **Phase 2**: Implement Dashboard and Kanban modules (highest priority)
3. **Phase 3**: Add Calendar and Billing modules
4. **Phase 4**: Complete Workers and Clients modules
5. **Phase 5**: Polish, testing, and optimization

**Migration path:**
- No breaking changes to existing code
- New routes can be added incrementally
- Existing `home.tsx` can redirect to `/dashboard` or be kept as landing page

**Coordination:**
- Backend team should provide API endpoints matching the frontend needs
- API contracts should be defined early (OpenAPI/Swagger recommended)

# How we teach this

**Terminology:**
- **Routes**: Pages/views in the application
- **Loaders**: Server-side data fetching functions (React Router concept)
- **Components**: Reusable UI pieces
- **Modules**: Feature areas (Dashboard, Billing, etc.)

**Presentation:**
- This RFC should be presented as a continuation of the existing React Router v7 patterns
- Emphasize the file-based routing approach
- Show examples of loader functions for data fetching
- Demonstrate Shadcn/UI component usage

**Documentation updates:**
- Add README section on project structure
- Document component library usage
- Create examples for common patterns (forms, tables, modals)

**Developer onboarding:**
- New developers should read this RFC first
- Walk through the route structure
- Demonstrate one complete module (e.g., Dashboard) as a reference
- Provide component usage examples

# Coordination with Backend RFC (0002)

This RFC has been coordinated with RFC 0002 (Backend API and Database). Key alignments:

1. **API Endpoints**: All frontend API calls match backend routes:
   - Dashboard: `GET /api/dashboard` returns complete dashboard data structure
   - Invoices: Uses `POST /api/invoices/client` and `POST /api/invoices/worker` endpoints
   - Worker Availability: `POST /api/workers/check-availability` with request body containing `workerId`, `scheduledStart`, `scheduledEnd`, `excludeActivityId`
   - Activities: Supports `contractId` filter in query parameters

2. **Data Types**: TypeScript types match Prisma schema and validation schemas:
   - Dates are handled as ISO strings in API calls, coerced to Date objects by backend
   - Optional fields use `| null` to match Prisma nullable fields
   - Enums match exactly between frontend and backend

3. **Error Handling**: Frontend `fetchAPI` function expects JSON error responses with `error` field, matching backend error handler format

4. **Validation**: Frontend validation schemas use `z.coerce.date()` matching backend validation approach

# Unresolved questions

1. **Authentication/Authorization**: How will user sessions be handled? (JWT, cookies, etc.) - Needs separate RFC
2. **Real-time updates**: Should we implement WebSockets for live activity updates, or polling is sufficient for MVP?
3. **File uploads**: How will evidence photos be handled? (S3, local storage, etc.)
4. **PDF generation**: Which library should we use for invoice PDFs? (react-pdf, jsPDF, server-side?)
5. **Error handling**: Should we implement a global error boundary strategy beyond React Router's ErrorBoundary?
6. **Loading states**: What loading UI patterns should we use? (Skeletons, spinners, etc.)
7. **Mobile responsiveness**: How much mobile optimization is needed for MVP? (Desktop-first acceptable?)
8. **Internationalization**: Is i18n needed for MVP, or Spanish-only is sufficient?

