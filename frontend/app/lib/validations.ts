import { z } from "zod"

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
})

export const workerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  role: z.enum(["ADMIN", "WORKER"]),
  hourlyRate: z.coerce.number().min(0.01, "La tarifa debe ser mayor a 0"),
  specialty: z.string().optional().nullable(),
})

export const clientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  contactName: z.string().min(1, "El nombre de contacto es requerido"),
  email: z.string().email("Email inválido"),
  billingRate: z.coerce.number().min(0, "La tarifa debe ser mayor o igual a 0").optional().nullable(),
})

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
})

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
})

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
})

export type ActivityFormData = z.infer<typeof activitySchema>
export type WorkerFormData = z.infer<typeof workerSchema>
export type ClientFormData = z.infer<typeof clientSchema>
export type ContractFormData = z.infer<typeof contractSchema>
export type InvoiceGenerationFormData = z.infer<typeof invoiceGenerationSchema>
export type PayoutGenerationFormData = z.infer<typeof payoutGenerationSchema>

