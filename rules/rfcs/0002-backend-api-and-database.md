- Start Date: 2025-01-27
- Members: Development Team
- RFC PR: (leave this empty)

# Summary

This RFC proposes the backend architecture, API design, and database schema for the Gecko SaaS MVP. The proposal defines the Express.js API structure, Prisma schema implementation, RESTful endpoints, and data validation strategy, maintaining the existing Express boilerplate stack while adding PostgreSQL database integration and Prisma ORM.

# Basic example

```javascript
// routes/activities.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { validateActivity } = require('../lib/validations');

router.post('/', async (req, res, next) => {
  try {
    const data = validateActivity(req.body);
    const activity = await prisma.activity.create({
      data: {
        ...data,
        status: 'UNASSIGNED',
      },
      include: { contract: true, worker: true },
    });
    res.status(201).json(activity);
  } catch (error) {
    next(error);
  }
});
```

# Motivation

The current backend boilerplate provides a basic Express.js setup with minimal routes, but lacks the database integration, data models, and API endpoints required for the Gecko MVP. We need to:

1. **Set up PostgreSQL database** with Docker Compose integration
2. **Implement Prisma ORM** for type-safe database access and migrations
3. **Create RESTful API endpoints** for all core entities (Users, Clients, Contracts, Activities, Invoices)
4. **Implement business logic** for activity assignment, hour tracking, and invoice generation
5. **Add data validation** using Zod schemas to ensure data integrity
6. **Maintain Express.js structure** while organizing code into controllers, services, and middleware
7. **Follow KISS principles** while building a scalable API architecture

The expected outcome is a fully functional backend API that supports the frontend application's needs for managing activities, tracking hours, scheduling workers, and generating invoices, all while maintaining code quality and type safety.

# Detailed design

## 1. Project Structure

```
backend/
├── app.js                    # Express app configuration (existing)
├── bin/
│   └── www                   # Server entry point (existing)
├── prisma/
│   ├── schema.prisma         # Prisma schema definition
│   └── migrations/           # Auto-generated migrations
├── lib/
│   ├── prisma.js             # Prisma client singleton
│   ├── validations.js        # Zod validation schemas
│   └── errors.js             # Custom error handlers
├── middleware/
│   ├── errorHandler.js       # Global error handler
│   ├── validation.js         # Request validation middleware
│   └── logger.js             # Request logging (morgan)
├── controllers/
│   ├── activities.js         # Activity CRUD operations
│   ├── contracts.js          # Contract management
│   ├── clients.js            # Client management
│   ├── workers.js            # Worker/user management
│   ├── invoices.js           # Invoice generation
│   └── dashboard.js          # Dashboard metrics
├── services/
│   ├── activityService.js    # Business logic for activities
│   ├── invoiceService.js     # Invoice generation logic
│   └── scheduleService.js    # Schedule conflict detection
├── routes/
│   ├── index.js              # Root route (existing)
│   ├── users.js              # User routes (existing, update)
│   ├── activities.js         # Activity routes
│   ├── contracts.js          # Contract routes
│   ├── clients.js            # Client routes
│   ├── invoices.js           # Invoice routes
│   └── dashboard.js          # Dashboard routes
└── package.json              # Dependencies (update)
```

## 2. Database Schema (Prisma)

Create `prisma/schema.prisma` based on the data model from guidelines:

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  WORKER
}

enum ContractStatus {
  ACTIVE
  CLOSED
}

enum ActivityStatus {
  UNASSIGNED
  SCHEDULED
  IN_PROGRESS
  DONE
  VERIFIED
  INVOICED
}

enum InvoiceType {
  CLIENT_BILL
  WORKER_PAYOUT
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
}

model User {
  id          String   @id @default(uuid())
  name        String
  role        UserRole
  email       String   @unique
  hourlyRate  Float
  specialty   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  activities  Activity[]
  invoices    Invoice[] @relation("WorkerInvoices")

  @@map("users")
}

model Client {
  id          String   @id @default(uuid())
  name        String
  contactName String
  email       String
  billingRate Float?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  contracts   Contract[]
  activities  Activity[]
  invoices    Invoice[] @relation("ClientInvoices")

  @@map("clients")
}

model Contract {
  id          String         @id @default(uuid())
  clientId    String
  orderNumber String
  totalHours  Float
  startDate   DateTime
  endDate     DateTime
  status      ContractStatus @default(ACTIVE)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  // Relations
  client      Client     @relation(fields: [clientId], references: [id])
  activities  Activity[]

  @@unique([clientId, orderNumber])
  @@map("contracts")
}

model Activity {
  id            String         @id @default(uuid())
  title         String
  contractId    String?
  clientId      String
  workerId      String?
  status        ActivityStatus @default(UNASSIGNED)
  scheduledStart DateTime
  scheduledEnd   DateTime
  durationHours  Float         // Calculated: scheduledEnd - scheduledStart
  location      String
  description   String?
  evidenceUrl   String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  // Relations
  contract      Contract?  @relation(fields: [contractId], references: [id])
  client        Client     @relation(fields: [clientId], references: [id])
  worker        User?      @relation(fields: [workerId], references: [id])

  @@index([status])
  @@index([workerId])
  @@index([clientId])
  @@index([scheduledStart])
  @@map("activities")
}

model Invoice {
  id          String        @id @default(uuid())
  type        InvoiceType
  entityId    String        // Can be clientId or workerId
  totalAmount Float
  generatedAt DateTime      @default(now())
  periodStart DateTime
  periodEnd   DateTime
  status      InvoiceStatus @default(DRAFT)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  // Relations (polymorphic - use separate nullable fields)
  clientId    String?
  workerId    String?
  client      Client? @relation("ClientInvoices", fields: [clientId], references: [id])
  worker      User?   @relation("WorkerInvoices", fields: [workerId], references: [id])

  @@index([type, entityId])
  @@index([status])
  @@index([clientId])
  @@index([workerId])
  @@map("invoices")
}
```

## 3. Prisma Client Setup

Create `lib/prisma.js`:

```javascript
// lib/prisma.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = { prisma };
```

## 4. Validation Schemas (Zod)

Create `lib/validations.js`:

```javascript
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
```

## 5. Error Handling

Create `lib/errors.js` and `middleware/errorHandler.js`:

```javascript
// lib/errors.js
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors) {
    super(message, 400);
    this.errors = errors;
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found`, 404);
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
};
```

```javascript
// middleware/errorHandler.js
const { ZodError } = require('zod');
const { AppError } = require('../lib/errors');

function errorHandler(err, req, res, next) {
  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors,
    });
  }

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Duplicate entry',
      message: 'A record with this value already exists',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Not found',
      message: 'The requested record was not found',
    });
  }

  // Custom AppError
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.errors && { details: err.errors }),
    });
  }

  // Unknown errors
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
}

module.exports = errorHandler;
```

## 6. API Routes Structure

### 6.1 Activities Routes (`routes/activities.js`)

```javascript
const express = require('express');
const router = express.Router();
const activitiesController = require('../controllers/activities');

// GET /api/activities - List activities with filters
router.get('/', activitiesController.list);

// GET /api/activities/:id - Get single activity
router.get('/:id', activitiesController.getById);

// POST /api/activities - Create new activity
router.post('/', activitiesController.create);

// PATCH /api/activities/:id - Update activity
router.patch('/:id', activitiesController.update);

// PATCH /api/activities/:id/assign - Assign worker to activity
router.patch('/:id/assign', activitiesController.assignWorker);

// PATCH /api/activities/:id/status - Update activity status
router.patch('/:id/status', activitiesController.updateStatus);

// DELETE /api/activities/:id - Delete activity
router.delete('/:id', activitiesController.delete);

module.exports = router;
```

### 6.2 Contracts Routes (`routes/contracts.js`)

```javascript
const express = require('express');
const router = express.Router();
const contractsController = require('../controllers/contracts');

router.get('/', contractsController.list);
router.get('/:id', contractsController.getById);
router.post('/', contractsController.create);
router.patch('/:id', contractsController.update);
router.get('/:id/hours-remaining', contractsController.getHoursRemaining);
router.delete('/:id', contractsController.delete);

module.exports = router;
```

### 6.3 Clients Routes (`routes/clients.js`)

```javascript
const express = require('express');
const router = express.Router();
const clientsController = require('../controllers/clients');

router.get('/', clientsController.list);
router.get('/:id', clientsController.getById);
router.post('/', clientsController.create);
router.patch('/:id', clientsController.update);
router.delete('/:id', clientsController.delete);
router.get('/:id/contracts', clientsController.getContracts);
router.get('/:id/activities', clientsController.getActivities);

module.exports = router;
```

### 6.4 Workers Routes (`routes/workers.js`)

Update existing `routes/users.js` or create `routes/workers.js`:

```javascript
const express = require('express');
const router = express.Router();
const workersController = require('../controllers/workers');

router.get('/', workersController.list);
router.get('/:id', workersController.getById);
router.post('/', workersController.create);
router.patch('/:id', workersController.update);
router.delete('/:id', workersController.delete);
router.get('/:id/activities', workersController.getActivities);
// POST endpoint for availability check (matches frontend expectations)
router.post('/check-availability', workersController.checkAvailability);

module.exports = router;
```

### 6.5 Invoices Routes (`routes/invoices.js`)

```javascript
const express = require('express');
const router = express.Router();
const invoicesController = require('../controllers/invoices');

router.get('/', invoicesController.list);
router.get('/:id', invoicesController.getById);
// Separate endpoints for client and worker invoices (matches frontend expectations)
router.post('/client', invoicesController.generateClientInvoice);
router.post('/worker', invoicesController.generateWorkerPayout);
router.patch('/:id/status', invoicesController.updateStatus);
router.get('/:id/pdf', invoicesController.generatePDF);

module.exports = router;
```

### 6.6 Dashboard Routes (`routes/dashboard.js`)

```javascript
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard');

// Main dashboard endpoint that returns all data (matches frontend expectations)
router.get('/', dashboardController.getDashboardData);
// Individual endpoints for granular access (optional)
router.get('/kpis', dashboardController.getKPIs);
router.get('/metrics', dashboardController.getMetrics);
router.get('/urgent-activities', dashboardController.getUrgentActivities);

module.exports = router;
```

## 7. Controllers Implementation

### 7.1 Activities Controller (`controllers/activities.js`)

```javascript
const { prisma } = require('../lib/prisma');
const { validateActivity } = require('../lib/validations');
const { NotFoundError } = require('../lib/errors');
const activityService = require('../services/activityService');

async function list(req, res, next) {
  try {
    const { status, workerId, clientId, contractId, startDate, endDate } = req.query;
    const activities = await prisma.activity.findMany({
      where: {
        ...(status && { status }),
        ...(workerId && { workerId }),
        ...(clientId && { clientId }),
        ...(contractId && { contractId }),
        ...(startDate && endDate && {
          scheduledStart: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      },
      include: {
        contract: true,
        worker: true,
        client: true,
      },
      orderBy: { scheduledStart: 'asc' },
    });
    res.json(activities);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const activity = await prisma.activity.findUnique({
      where: { id: req.params.id },
      include: { contract: true, worker: true, client: true },
    });
    if (!activity) throw new NotFoundError('Activity');
    res.json(activity);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = validateActivity(req.body);
    const durationHours = activityService.calculateDuration(
      data.scheduledStart,
      data.scheduledEnd
    );

    // Check contract hours if contractId provided
    if (data.contractId) {
      await activityService.validateContractHours(data.contractId, durationHours);
    }

    const activity = await prisma.activity.create({
      data: {
        ...data,
        scheduledStart: new Date(data.scheduledStart),
        scheduledEnd: new Date(data.scheduledEnd),
        durationHours,
        status: 'UNASSIGNED',
      },
      include: { contract: true, worker: true, client: true },
    });
    res.status(201).json(activity);
  } catch (error) {
    next(error);
  }
}

async function assignWorker(req, res, next) {
  try {
    const { workerId } = req.body;
    const activityId = req.params.id;

    // Get activity to check scheduled times
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    });
    if (!activity) throw new NotFoundError('Activity');

    // Check worker availability if workerId provided
    if (workerId) {
      const availability = await activityService.checkWorkerAvailability(
        workerId,
        activity.scheduledStart,
        activity.scheduledEnd,
        activityId
      );
      if (!availability.available) {
        return res.status(409).json({
          error: 'Worker has conflicting activity',
          conflictingActivities: availability.conflictingActivities,
        });
      }
    }

    const updatedActivity = await prisma.activity.update({
      where: { id: activityId },
      data: {
        workerId,
        status: workerId ? 'SCHEDULED' : 'UNASSIGNED',
      },
      include: { worker: true, contract: true, client: true },
    });
    res.json(updatedActivity);
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const activity = await prisma.activity.update({
      where: { id: req.params.id },
      data: { status },
      include: { contract: true, worker: true, client: true },
    });

    // If status is VERIFIED, update contract hours
    if (status === 'VERIFIED' && activity.contractId) {
      await activityService.deductContractHours(activity.contractId, activity.durationHours);
    }

    res.json(activity);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  getById,
  create,
  assignWorker,
  updateStatus,
  update: async (req, res, next) => {
    // Similar to create but with update logic
  },
  delete: async (req, res, next) => {
    // Delete logic
  },
};
```

### 7.2 Activity Service (`services/activityService.js`)

```javascript
const { prisma } = require('../lib/prisma');
const { AppError } = require('../lib/errors');

function calculateDuration(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return (endDate - startDate) / (1000 * 60 * 60); // Convert to hours
}

async function validateContractHours(contractId, hours) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      activities: {
        where: { status: { in: ['VERIFIED', 'INVOICED'] } },
      },
    },
  });

  if (!contract) {
    throw new AppError('Contract not found', 404);
  }

  const usedHours = contract.activities.reduce((sum, a) => sum + a.durationHours, 0);
  const remaining = contract.totalHours - usedHours;

  if (hours > remaining) {
    throw new AppError(`Insufficient hours. Remaining: ${remaining}`, 400);
  }
}

async function checkWorkerAvailability(workerId, scheduledStart, scheduledEnd, excludeActivityId = null) {
  const conflicting = await prisma.activity.findMany({
    where: {
      workerId,
      ...(excludeActivityId && { id: { not: excludeActivityId } }),
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      OR: [
        {
          scheduledStart: { lte: new Date(scheduledEnd) },
          scheduledEnd: { gte: new Date(scheduledStart) },
        },
      ],
    },
  });

  return {
    available: conflicting.length === 0,
    conflictingActivities: conflicting,
  };
}

async function deductContractHours(contractId, hours) {
  // Hours are tracked via activities, no need to update contract directly
  // This is called when activity status changes to VERIFIED
}

module.exports = {
  calculateDuration,
  validateContractHours,
  checkWorkerAvailability,
  deductContractHours,
};
```

### 7.3 Workers Controller (`controllers/workers.js`)

```javascript
const { prisma } = require('../lib/prisma');
const { validateWorker } = require('../lib/validations');
const { NotFoundError } = require('../lib/errors');
const activityService = require('../services/activityService');

async function list(req, res, next) {
  try {
    const workers = await prisma.user.findMany({
      where: { role: 'WORKER' },
      orderBy: { name: 'asc' },
    });
    res.json(workers);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const worker = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        activities: {
          include: { client: true, contract: true },
          orderBy: { scheduledStart: 'desc' },
        },
      },
    });
    if (!worker) throw new NotFoundError('Worker');
    res.json(worker);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = validateWorker(req.body);
    const worker = await prisma.user.create({
      data: {
        ...data,
        role: 'WORKER',
      },
    });
    res.status(201).json(worker);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const data = validateWorker(req.body);
    const worker = await prisma.user.update({
      where: { id: req.params.id },
      data,
    });
    res.json(worker);
  } catch (error) {
    next(error);
  }
}

async function getActivities(req, res, next) {
  try {
    const activities = await prisma.activity.findMany({
      where: { workerId: req.params.id },
      include: { client: true, contract: true },
      orderBy: { scheduledStart: 'desc' },
    });
    res.json(activities);
  } catch (error) {
    next(error);
  }
}

async function checkAvailability(req, res, next) {
  try {
    const { workerId, scheduledStart, scheduledEnd, excludeActivityId } = req.body;
    const availability = await activityService.checkWorkerAvailability(
      workerId,
      scheduledStart,
      scheduledEnd,
      excludeActivityId
    );
    res.json(availability);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  getActivities,
  checkAvailability,
  delete: async (req, res, next) => {
    // Delete logic
  },
};
```

### 7.4 Invoices Controller (`controllers/invoices.js`)

```javascript
const { prisma } = require('../lib/prisma');
const { validateInvoice } = require('../lib/validations');
const { NotFoundError } = require('../lib/errors');
const invoiceService = require('../services/invoiceService');

async function list(req, res, next) {
  try {
    const { type } = req.query;
    const invoices = await prisma.invoice.findMany({
      where: type ? { type } : {},
      include: {
        client: type === 'CLIENT_BILL',
        worker: type === 'WORKER_PAYOUT',
      },
      orderBy: { generatedAt: 'desc' },
    });
    res.json(invoices);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        worker: true,
      },
    });
    if (!invoice) throw new NotFoundError('Invoice');
    res.json(invoice);
  } catch (error) {
    next(error);
  }
}

async function generateClientInvoice(req, res, next) {
  try {
    const data = validateInvoice(req.body);
    if (data.type !== 'CLIENT_BILL') {
      return res.status(400).json({ error: 'Invalid invoice type for this endpoint' });
    }
    const result = await invoiceService.generateClientInvoice(
      data.entityId,
      data.periodStart,
      data.periodEnd
    );
    res.status(201).json(result.invoice);
  } catch (error) {
    next(error);
  }
}

async function generateWorkerPayout(req, res, next) {
  try {
    const data = validateInvoice(req.body);
    if (data.type !== 'WORKER_PAYOUT') {
      return res.status(400).json({ error: 'Invalid invoice type for this endpoint' });
    }
    const result = await invoiceService.generateWorkerPayout(
      data.entityId,
      data.periodStart,
      data.periodEnd
    );
    res.status(201).json(result.invoice);
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(invoice);
  } catch (error) {
    next(error);
  }
}

async function generatePDF(req, res, next) {
  try {
    // PDF generation implementation
    res.status(501).json({ error: 'PDF generation not yet implemented' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  getById,
  generateClientInvoice,
  generateWorkerPayout,
  updateStatus,
  generatePDF,
};
```

### 7.5 Dashboard Controller (`controllers/dashboard.js`)

```javascript
const { prisma } = require('../lib/prisma');

async function getDashboardData(req, res, next) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get KPIs
    const activitiesThisMonth = await prisma.activity.findMany({
      where: {
        scheduledStart: { gte: startOfMonth, lte: endOfMonth },
        status: { in: ['DONE', 'VERIFIED', 'INVOICED'] },
      },
    });

    const hoursExecutedThisMonth = activitiesThisMonth.reduce(
      (sum, a) => sum + a.durationHours,
      0
    );

    const contracts = await prisma.contract.findMany({
      where: { status: 'ACTIVE' },
      include: {
        activities: {
          where: { status: { in: ['VERIFIED', 'INVOICED'] } },
        },
      },
    });

    const hoursSold = contracts.reduce((sum, c) => sum + c.totalHours, 0);
    const hoursUsed = contracts.reduce(
      (sum, c) => sum + c.activities.reduce((s, a) => s + a.durationHours, 0),
      0
    );

    // Calculate estimated revenue (simplified - uses client billing rates)
    const clients = await prisma.client.findMany();
    const estimatedRevenue = activitiesThisMonth.reduce((sum, activity) => {
      const client = clients.find((c) => c.id === activity.clientId);
      return sum + (activity.durationHours * (client?.billingRate || 0));
    }, 0);

    // Calculate operational cost
    const workers = await prisma.user.findMany({ where: { role: 'WORKER' } });
    const operationalCost = activitiesThisMonth.reduce((sum, activity) => {
      if (!activity.workerId) return sum;
      const worker = workers.find((w) => w.id === activity.workerId);
      return sum + (activity.durationHours * (worker?.hourlyRate || 0));
    }, 0);

    // Get urgent activities
    const urgentActivities = await prisma.activity.findMany({
      where: {
        OR: [
          { status: 'UNASSIGNED' },
          {
            status: 'SCHEDULED',
            scheduledStart: { lte: sevenDaysFromNow },
          },
          {
            scheduledStart: { lt: now },
            status: { not: 'DONE' },
          },
        ],
      },
      include: { client: true, worker: true, contract: true },
      orderBy: { scheduledStart: 'asc' },
      take: 20,
    });

    // Contract burndown
    const contractBurndown = contracts.map((contract) => ({
      contractId: contract.id,
      contractName: contract.orderNumber,
      totalHours: contract.totalHours,
      hoursUsed: contract.activities.reduce((sum, a) => sum + a.durationHours, 0),
    }));

    // Worker occupancy (simplified - last 7 days)
    const workerOccupancy = await Promise.all(
      workers.map(async (worker) => {
        const activities = await prisma.activity.findMany({
          where: {
            workerId: worker.id,
            scheduledStart: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
          },
        });
        return {
          workerId: worker.id,
          workerName: worker.name,
          dailyHours: [], // Simplified - would need date grouping
        };
      })
    );

    // Revenue vs Cost (simplified - last 30 days)
    const revenueVsCost = []; // Simplified - would need date grouping

    res.json({
      kpis: {
        hoursExecutedThisMonth,
        hoursSold,
        estimatedRevenue,
        operationalCost,
      },
      urgentActivities,
      contractBurndown,
      workerOccupancy,
      revenueVsCost,
    });
  } catch (error) {
    next(error);
  }
}

async function getKPIs(req, res, next) {
  try {
    // Extract KPI logic from getDashboardData
    res.status(501).json({ error: 'Use /dashboard endpoint' });
  } catch (error) {
    next(error);
  }
}

async function getMetrics(req, res, next) {
  try {
    // Extract metrics logic from getDashboardData
    res.status(501).json({ error: 'Use /dashboard endpoint' });
  } catch (error) {
    next(error);
  }
}

async function getUrgentActivities(req, res, next) {
  try {
    // Extract urgent activities logic from getDashboardData
    res.status(501).json({ error: 'Use /dashboard endpoint' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardData,
  getKPIs,
  getMetrics,
  getUrgentActivities,
};
```

## 8. Invoice Generation Service

Create `services/invoiceService.js`:

```javascript
const { prisma } = require('../lib/prisma');

async function generateClientInvoice(clientId, periodStart, periodEnd) {
  const activities = await prisma.activity.findMany({
    where: {
      clientId,
      status: 'VERIFIED',
      scheduledStart: { gte: new Date(periodStart) },
      scheduledEnd: { lte: new Date(periodEnd) },
    },
    include: { worker: true, contract: true },
  });

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  const billingRate = client.billingRate || 0;

  const totalAmount = activities.reduce((sum, activity) => {
    return sum + (activity.durationHours * billingRate);
  }, 0);

  const invoice = await prisma.invoice.create({
    data: {
      type: 'CLIENT_BILL',
      entityId: clientId,
      clientId: clientId, // Set relation field
      totalAmount,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      status: 'DRAFT',
    },
  });

  // Update activities to INVOICED
  await prisma.activity.updateMany({
    where: {
      id: { in: activities.map(a => a.id) },
    },
    data: { status: 'INVOICED' },
  });

  return { invoice, activities };
}

async function generateWorkerPayout(workerId, periodStart, periodEnd) {
  const activities = await prisma.activity.findMany({
    where: {
      workerId,
      status: 'VERIFIED',
      scheduledStart: { gte: new Date(periodStart) },
      scheduledEnd: { lte: new Date(periodEnd) },
    },
  });

  const worker = await prisma.user.findUnique({ where: { id: workerId } });
  const hourlyRate = worker.hourlyRate;

  const totalHours = activities.reduce((sum, a) => sum + a.durationHours, 0);
  const totalAmount = totalHours * hourlyRate;

  const invoice = await prisma.invoice.create({
    data: {
      type: 'WORKER_PAYOUT',
      entityId: workerId,
      workerId: workerId, // Set relation field
      totalAmount,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      status: 'DRAFT',
    },
  });

  return { invoice, activities, totalHours };
}

module.exports = {
  generateClientInvoice,
  generateWorkerPayout,
};
```

## 9. App.js Updates

Update `app.js` to include new routes and middleware:

```javascript
// app.js (additions)
const activitiesRouter = require('./routes/activities');
const contractsRouter = require('./routes/contracts');
const clientsRouter = require('./routes/clients');
const workersRouter = require('./routes/workers');
const invoicesRouter = require('./routes/invoices');
const dashboardRouter = require('./routes/dashboard');
const errorHandler = require('./middleware/errorHandler');

// ... existing code ...

app.use('/api/activities', activitiesRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/workers', workersRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/dashboard', dashboardRouter);

// Error handler must be last
app.use(errorHandler);
```

## 10. Docker Compose Integration

Update `docker-compose.yml` to include PostgreSQL:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: gecko
      POSTGRES_PASSWORD: gecko_password
      POSTGRES_DB: gecko_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    # ... existing backend config ...
    environment:
      DATABASE_URL: postgresql://gecko:gecko_password@postgres:5432/gecko_db
    depends_on:
      - postgres

volumes:
  postgres_data:
```

## 11. Package.json Dependencies

Update `backend/package.json`:

```json
{
  "dependencies": {
    "cookie-parser": "~1.4.4",
    "debug": "~2.6.9",
    "express": "~4.16.1",
    "http-errors": "~1.6.3",
    "morgan": "~1.9.1",
    "@prisma/client": "^5.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0"
  }
}
```

## 12. Environment Variables

Create `.env.example`:

```
DATABASE_URL=postgresql://gecko:gecko_password@localhost:5432/gecko_db
NODE_ENV=development
PORT=3000
```

# Drawbacks

1. **Prisma learning curve**: Team may need to learn Prisma syntax and migration workflow
2. **Type safety overhead**: Zod validation adds boilerplate but provides runtime safety
3. **Service layer complexity**: Additional abstraction layer may seem unnecessary for MVP, but helps with testability
4. **PostgreSQL setup**: Requires Docker knowledge and database administration basics
5. **Migration management**: Prisma migrations need to be handled carefully in team environments
6. **No authentication yet**: API endpoints are unprotected (needs separate RFC for auth)

# Alternatives

1. **Sequelize instead of Prisma**: Rejected because Prisma offers better TypeScript support and modern DX
2. **MongoDB instead of PostgreSQL**: Rejected per guidelines - relational nature of invoices/hours requires SQL
3. **Fastify instead of Express**: Considered but rejected to maintain existing boilerplate
4. **Joi instead of Zod**: Rejected because Zod has better TypeScript integration
5. **Direct SQL queries**: Rejected - ORM provides safety and maintainability
6. **GraphQL instead of REST**: Rejected for MVP - REST is simpler and sufficient

# Adoption strategy

1. **Phase 1**: Set up Prisma, create schema, run initial migration
2. **Phase 2**: Implement core CRUD endpoints (Activities, Clients, Workers)
3. **Phase 3**: Add business logic (contract validation, worker availability)
4. **Phase 4**: Implement invoice generation service
5. **Phase 5**: Add dashboard metrics endpoints
6. **Phase 6**: Testing, error handling refinement, documentation

**Migration path:**
- No breaking changes to existing Express setup
- New routes can be added incrementally
- Existing `routes/users.js` can be updated or kept alongside `routes/workers.js`

**Coordination:**
- Frontend team should align API calls with backend endpoints
- API contracts should be documented (OpenAPI/Swagger recommended)
- Database migrations should be reviewed before merging

# How we teach this

**Terminology:**
- **Prisma Schema**: Database schema definition file
- **Migration**: Database schema changes tracked as files
- **Controller**: Handles HTTP requests/responses
- **Service**: Contains business logic
- **Validation**: Data validation using Zod schemas

**Presentation:**
- This RFC should be presented as an extension of the existing Express.js patterns
- Emphasize the separation of concerns (routes → controllers → services → database)
- Show Prisma query examples and migration workflow
- Demonstrate error handling patterns

**Documentation updates:**
- Add README section on database setup
- Document Prisma commands (`npx prisma migrate`, `npx prisma studio`)
- Create API documentation (OpenAPI/Swagger)
- Document environment variables

**Developer onboarding:**
- New developers should read this RFC first
- Walk through Prisma schema structure
- Demonstrate one complete endpoint (e.g., create activity) as reference
- Show how to run migrations and seed data

# Coordination with Frontend RFC (0001)

This RFC has been coordinated with RFC 0001 (Frontend Pages and Modules). Key alignments:

1. **API Endpoints**: All endpoints match frontend expectations:
   - Dashboard: `GET /api/dashboard` returns complete dashboard data
   - Invoices: `POST /api/invoices/client` and `POST /api/invoices/worker` for separate invoice types
   - Worker Availability: `POST /api/workers/check-availability` with request body
   - Activities: Supports `contractId` filter in query parameters

2. **Data Types**: Validation schemas use `z.coerce.date()` to match frontend date handling

3. **Prisma Schema**: Invoice model uses separate `clientId` and `workerId` fields for proper relations (polymorphic via `entityId` field for querying)

4. **Error Responses**: Error handler returns JSON with `error` and optional `details` fields, compatible with frontend error handling

# Unresolved questions

1. **Authentication/Authorization**: How will API endpoints be secured? (JWT, session-based, OAuth?) - Needs separate RFC
2. **Database seeding**: Should we create seed scripts for initial data (test users, clients)?
3. **Soft deletes**: Should we implement soft deletes for important entities (activities, contracts)?
4. **Audit logging**: Should we track who created/modified records? (add `createdBy`, `updatedBy` fields?)
5. **File uploads**: How will evidence photos be stored? (S3, local filesystem, database BLOB?)
6. **PDF generation**: Should PDF generation be server-side (Node.js library) or client-side?
7. **Caching**: Should we implement Redis for caching frequently accessed data (dashboard metrics)?
8. **Rate limiting**: Should we add rate limiting to prevent API abuse?
9. **API versioning**: Should we version the API (`/api/v1/activities`)? Or is `/api/activities` sufficient for MVP?
10. **Transaction handling**: Should complex operations (invoice generation) use database transactions for atomicity?

