// lib/validations.js
const { z } = require('zod');

const activitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  contractId: z.string().uuid().optional().nullable(),
  clientId: z.string().uuid('Invalid client ID'),
  workerId: z.string().uuid().optional().nullable(),
  scheduledStart: z.coerce.date({
    required_error: 'Start date is required',
  }),
  scheduledEnd: z.coerce.date({
    required_error: 'End date is required',
  }),
  location: z.string().min(1, 'Location is required'),
  description: z.string().optional().nullable(),
}).refine((data) => {
  const start = new Date(data.scheduledStart);
  const end = new Date(data.scheduledEnd);
  return end > start;
}, {
  message: 'End date must be after start date',
  path: ['scheduledEnd'],
});

const contractSchema = z.object({
  clientId: z.string().uuid(),
  orderNumber: z.string().min(1),
  totalHours: z.coerce.number().positive(),
  startDate: z.coerce.date({
    required_error: 'Start date is required',
  }),
  endDate: z.coerce.date({
    required_error: 'End date is required',
  }),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

const clientSchema = z.object({
  name: z.string().min(1),
  contactName: z.string().min(1),
  email: z.string().email(),
  billingRate: z.number().positive().optional(),
});

const workerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'WORKER']),
  hourlyRate: z.number().positive(),
  specialty: z.string().optional(),
});

const invoiceSchema = z.object({
  type: z.enum(['CLIENT_BILL', 'WORKER_PAYOUT']),
  entityId: z.string().uuid(),
  periodStart: z.coerce.date({
    required_error: 'Period start date is required',
  }),
  periodEnd: z.coerce.date({
    required_error: 'Period end date is required',
  }),
}).refine((data) => {
  const start = new Date(data.periodStart);
  const end = new Date(data.periodEnd);
  return end > start;
}, {
  message: 'Period end date must be after period start date',
  path: ['periodEnd'],
});

function validateActivity(data) {
  return activitySchema.parse(data);
}

function validateContract(data) {
  return contractSchema.parse(data);
}

function validateClient(data) {
  return clientSchema.parse(data);
}

function validateWorker(data) {
  return workerSchema.parse(data);
}

function validateInvoice(data) {
  return invoiceSchema.parse(data);
}

module.exports = {
  validateActivity,
  validateContract,
  validateClient,
  validateWorker,
  validateInvoice,
};

