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

