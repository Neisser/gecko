# Gecko Backend API

Backend API for Gecko SaaS MVP - Risk Management and Activity Tracking System.

## Tech Stack

- **Node.js** with **Express.js**
- **PostgreSQL** database
- **Prisma** ORM
- **Zod** for validation

## Setup

### Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the `backend` directory:
```
DATABASE_URL=postgresql://gecko:gecko_password@localhost:5432/gecko_db
NODE_ENV=development
PORT=3000
```

3. Start PostgreSQL with Docker Compose:
```bash
docker-compose up -d postgres
```

4. Run Prisma migrations:
```bash
npm run prisma:migrate
```

5. Generate Prisma Client:
```bash
npm run prisma:generate
```

6. Start the server:
```bash
npm start
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Activities
- `GET /api/activities` - List all activities (with filters: status, workerId, clientId, contractId, startDate, endDate)
- `GET /api/activities/:id` - Get single activity
- `POST /api/activities` - Create new activity
- `PATCH /api/activities/:id` - Update activity
- `PATCH /api/activities/:id/assign` - Assign worker to activity
- `PATCH /api/activities/:id/status` - Update activity status
- `DELETE /api/activities/:id` - Delete activity

### Contracts
- `GET /api/contracts` - List all contracts
- `GET /api/contracts/:id` - Get single contract
- `POST /api/contracts` - Create new contract
- `PATCH /api/contracts/:id` - Update contract
- `GET /api/contracts/:id/hours-remaining` - Get remaining hours for contract
- `DELETE /api/contracts/:id` - Delete contract

### Clients
- `GET /api/clients` - List all clients
- `GET /api/clients/:id` - Get single client
- `POST /api/clients` - Create new client
- `PATCH /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client
- `GET /api/clients/:id/contracts` - Get client contracts
- `GET /api/clients/:id/activities` - Get client activities

### Workers
- `GET /api/workers` - List all workers
- `GET /api/workers/:id` - Get single worker
- `POST /api/workers` - Create new worker
- `PATCH /api/workers/:id` - Update worker
- `DELETE /api/workers/:id` - Delete worker
- `GET /api/workers/:id/activities` - Get worker activities
- `POST /api/workers/check-availability` - Check worker availability

### Invoices
- `GET /api/invoices` - List all invoices (with filter: type)
- `GET /api/invoices/:id` - Get single invoice
- `POST /api/invoices/client` - Generate client invoice
- `POST /api/invoices/worker` - Generate worker payout
- `PATCH /api/invoices/:id/status` - Update invoice status
- `GET /api/invoices/:id/pdf` - Generate PDF (not implemented yet)

### Dashboard
- `GET /api/dashboard` - Get complete dashboard data (KPIs, urgent activities, metrics)
- `GET /api/dashboard/kpis` - Get KPIs only
- `GET /api/dashboard/metrics` - Get metrics only
- `GET /api/dashboard/urgent-activities` - Get urgent activities only

## Prisma Commands

- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## Project Structure

```
backend/
├── app.js                    # Express app configuration
├── bin/
│   └── www                   # Server entry point
├── prisma/
│   ├── schema.prisma         # Prisma schema definition
│   └── migrations/           # Auto-generated migrations
├── lib/
│   ├── prisma.js             # Prisma client singleton
│   ├── validations.js        # Zod validation schemas
│   └── errors.js             # Custom error handlers
├── middleware/
│   └── errorHandler.js       # Global error handler
├── services/
│   ├── activityService.js    # Business logic for activities
│   └── invoiceService.js     # Invoice generation logic
├── controllers/
│   ├── activities.js         # Activity CRUD operations
│   ├── contracts.js         # Contract management
│   ├── clients.js            # Client management
│   ├── workers.js            # Worker/user management
│   ├── invoices.js           # Invoice generation
│   └── dashboard.js          # Dashboard metrics
└── routes/
    ├── index.js              # Root route
    ├── users.js              # User routes
    ├── activities.js         # Activity routes
    ├── contracts.js          # Contract routes
    ├── clients.js            # Client routes
    ├── workers.js            # Worker routes
    ├── invoices.js           # Invoice routes
    └── dashboard.js          # Dashboard routes
```

## Error Handling

The API uses a centralized error handler that:
- Handles Zod validation errors (400)
- Handles Prisma errors (404, 409)
- Handles custom AppError instances
- Returns consistent JSON error responses

## Development

The server runs on port 3000 by default. In development mode, Prisma will log all queries to the console.

## Notes

- All timestamps are stored in UTC
- UUIDs are used for all primary keys
- The API follows RESTful conventions
- Validation is performed using Zod schemas
- Business logic is separated into service files

