import type {
  Activity,
  Client,
  Contract,
  DashboardData,
  Invoice,
  User,
  ActivityStatus,
} from "./types"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api"

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
  })

  if (!response.ok) {
    let errorMessage = response.statusText
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorData.error || errorMessage
    } catch {
      // If response is not JSON, use statusText
    }
    const error = new Error(errorMessage)
    ;(error as any).status = response.status
    ;(error as any).response = response
    throw error
  }

  return response.json()
}

// Activities
export async function getActivities(filters?: {
  status?: ActivityStatus
  workerId?: string
  clientId?: string
  contractId?: string
}): Promise<Activity[]> {
  const params = new URLSearchParams()
  if (filters?.status) params.append("status", filters.status)
  if (filters?.workerId) params.append("workerId", filters.workerId)
  if (filters?.clientId) params.append("clientId", filters.clientId)
  if (filters?.contractId) params.append("contractId", filters.contractId)

  return fetchAPI<Activity[]>(`/activities?${params.toString()}`)
}

export async function getActivity(id: string): Promise<Activity> {
  return fetchAPI<Activity>(`/activities/${id}`)
}

export async function createActivity(data: {
  title: string
  contractId?: string | null
  clientId: string
  workerId?: string | null
  scheduledStart: string
  scheduledEnd: string
  location: string
  description?: string | null
}): Promise<Activity> {
  return fetchAPI<Activity>("/activities", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateActivity(
  id: string,
  data: Partial<Activity>
): Promise<Activity> {
  return fetchAPI<Activity>(`/activities/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function deleteActivity(id: string): Promise<void> {
  return fetchAPI<void>(`/activities/${id}`, {
    method: "DELETE",
  })
}

// Workers
export async function getWorkers(): Promise<User[]> {
  return fetchAPI<User[]>("/workers")
}

export async function getWorker(id: string): Promise<User> {
  return fetchAPI<User>(`/workers/${id}`)
}

export async function createWorker(data: {
  name: string
  email: string
  role: "ADMIN" | "WORKER"
  hourlyRate: number
  specialty?: string | null
}): Promise<User> {
  return fetchAPI<User>("/workers", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateWorker(
  id: string,
  data: Partial<User>
): Promise<User> {
  return fetchAPI<User>(`/workers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

// Clients
export async function getClients(): Promise<Client[]> {
  return fetchAPI<Client[]>("/clients")
}

export async function getClient(id: string): Promise<Client> {
  return fetchAPI<Client>(`/clients/${id}`)
}

export async function createClient(data: {
  name: string
  contactName: string
  email: string
  billingRate?: number | null
}): Promise<Client> {
  return fetchAPI<Client>("/clients", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateClient(
  id: string,
  data: Partial<Client>
): Promise<Client> {
  return fetchAPI<Client>(`/clients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

// Contracts
export async function getContracts(clientId?: string): Promise<Contract[]> {
  const params = clientId ? `?clientId=${clientId}` : ""
  return fetchAPI<Contract[]>(`/contracts${params}`)
}

export async function getContract(id: string): Promise<Contract> {
  return fetchAPI<Contract>(`/contracts/${id}`)
}

export async function createContract(data: {
  clientId: string
  orderNumber: string
  totalHours: number
  startDate: string
  endDate: string
}): Promise<Contract> {
  return fetchAPI<Contract>("/contracts", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// Dashboard
export async function getDashboardData(): Promise<DashboardData> {
  return fetchAPI<DashboardData>("/dashboard")
}

// Invoices
export async function getInvoices(type?: "CLIENT_BILL" | "WORKER_PAYOUT"): Promise<Invoice[]> {
  const params = type ? `?type=${type}` : ""
  return fetchAPI<Invoice[]>(`/invoices${params}`)
}

export async function generateClientInvoice(data: {
  clientId: string
  periodStart: string
  periodEnd: string
}): Promise<Invoice> {
  return fetchAPI<Invoice>("/invoices/client", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function generateWorkerPayout(data: {
  workerId: string
  periodStart: string
  periodEnd: string
}): Promise<Invoice> {
  return fetchAPI<Invoice>("/invoices/worker", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// Worker availability check
export async function checkWorkerAvailability(data: {
  workerId: string
  scheduledStart: string
  scheduledEnd: string
  excludeActivityId?: string
}): Promise<{ available: boolean; conflictingActivities?: Activity[] }> {
  return fetchAPI<{ available: boolean; conflictingActivities?: Activity[] }>(
    "/workers/check-availability",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  )
}

