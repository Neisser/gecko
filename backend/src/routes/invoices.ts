import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/prisma';
import { InvoiceType, InvoiceStatus, ActivityStatus } from '../generated/prisma/enums';

const router = Router();

// Helper function to generate client invoice
async function generateClientInvoice(clientId: string, periodStart: Date, periodEnd: Date) {
  const activities = await prisma.activity.findMany({
    where: {
      clientId,
      status: ActivityStatus.VERIFIED,
      scheduledStart: { gte: periodStart },
      scheduledEnd: { lte: periodEnd },
    },
    include: { worker: true, contract: true },
  });

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    throw new Error('Client not found');
  }

  const billingRate = client.billingRate || 0;
  const totalAmount = activities.reduce((sum, activity) => {
    return sum + activity.durationHours * billingRate;
  }, 0);

  const invoice = await prisma.invoice.create({
    data: {
      type: InvoiceType.CLIENT_BILL,
      entityId: clientId,
      clientId: clientId,
      totalAmount,
      periodStart,
      periodEnd,
      status: InvoiceStatus.DRAFT,
    },
  });

  // Update activities to INVOICED
  await prisma.activity.updateMany({
    where: {
      id: { in: activities.map((a) => a.id) },
    },
    data: { status: ActivityStatus.INVOICED },
  });

  return { invoice, activities };
}

// Helper function to generate worker payout
async function generateWorkerPayout(workerId: string, periodStart: Date, periodEnd: Date) {
  const activities = await prisma.activity.findMany({
    where: {
      workerId,
      status: ActivityStatus.VERIFIED,
      scheduledStart: { gte: periodStart },
      scheduledEnd: { lte: periodEnd },
    },
  });

  const worker = await prisma.user.findUnique({ where: { id: workerId } });
  if (!worker) {
    throw new Error('Worker not found');
  }

  const hourlyRate = worker.hourlyRate;
  const totalHours = activities.reduce((sum, a) => sum + a.durationHours, 0);
  const totalAmount = totalHours * hourlyRate;

  const invoice = await prisma.invoice.create({
    data: {
      type: InvoiceType.WORKER_PAYOUT,
      entityId: workerId,
      workerId: workerId,
      totalAmount,
      periodStart,
      periodEnd,
      status: InvoiceStatus.DRAFT,
    },
  });

  return { invoice, activities, totalHours };
}

// GET /api/invoices - List invoices
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.query;
    const where: any = {};
    if (type) where.type = type;

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: true,
        worker: true,
      },
      orderBy: { generatedAt: 'desc' },
    });
    res.json(invoices);
  } catch (error) {
    next(error);
  }
});

// GET /api/invoices/:id - Get single invoice
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Invoice ID is required' });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        worker: true,
      },
    });
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    next(error);
  }
});

// POST /api/invoices/client - Generate client invoice
router.post('/client', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { entityId, periodStart, periodEnd } = req.body;

    if (!entityId || !periodStart || !periodEnd) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    if (endDate <= startDate) {
      return res.status(400).json({ error: 'Period end date must be after period start date' });
    }

    const result = await generateClientInvoice(entityId, startDate, endDate);
    res.status(201).json(result.invoice);
  } catch (error: any) {
    if (error.message === 'Client not found') {
      return res.status(404).json({ error: 'Client not found' });
    }
    next(error);
  }
});

// POST /api/invoices/worker - Generate worker payout
router.post('/worker', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { entityId, periodStart, periodEnd } = req.body;

    if (!entityId || !periodStart || !periodEnd) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    if (endDate <= startDate) {
      return res.status(400).json({ error: 'Period end date must be after period start date' });
    }

    const result = await generateWorkerPayout(entityId, startDate, endDate);
    res.status(201).json(result.invoice);
  } catch (error: any) {
    if (error.message === 'Worker not found') {
      return res.status(404).json({ error: 'Worker not found' });
    }
    next(error);
  }
});

// PATCH /api/invoices/:id/status - Update invoice status
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Invoice ID is required' });
    }

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status },
    });
    res.json(invoice);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    next(error);
  }
});

// GET /api/invoices/:id/pdf - Generate PDF (placeholder)
router.get('/:id/pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Invoice ID is required' });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        worker: true,
      },
    });
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    // PDF generation not yet implemented
    res.status(501).json({ error: 'PDF generation not yet implemented' });
  } catch (error) {
    next(error);
  }
});

export default router;

