import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/prisma';

const router = Router();

// GET /api/clients - List clients
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        contracts: true,
        activities: true,
      },
      orderBy: { name: 'asc' },
    });
    res.json(clients);
  } catch (error) {
    next(error);
  }
});

// GET /api/clients/:id - Get single client
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        contracts: {
          include: { activities: true },
        },
        activities: {
          include: { worker: true, contract: true },
          orderBy: { scheduledStart: 'desc' },
        },
      },
    });
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    next(error);
  }
});

// POST /api/clients - Create new client
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, contactName, email, billingRate } = req.body;

    if (!name || !contactName || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const client = await prisma.client.create({
      data: {
        name,
        contactName,
        email,
        billingRate: billingRate ? parseFloat(billingRate) : null,
      },
    });
    res.status(201).json(client);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Duplicate entry',
        message: 'A client with this email already exists',
      });
    }
    next(error);
  }
});

// PATCH /api/clients/:id - Update client
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    const { name, contactName, email, billingRate } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (contactName !== undefined) updateData.contactName = contactName;
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      updateData.email = email;
    }
    if (billingRate !== undefined) {
      updateData.billingRate = billingRate ? parseFloat(billingRate) : null;
    }

    const client = await prisma.client.update({
      where: { id },
      data: updateData,
    });
    res.json(client);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Client not found' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Duplicate entry',
        message: 'A client with this email already exists',
      });
    }
    next(error);
  }
});

// DELETE /api/clients/:id - Delete client
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    await prisma.client.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Client not found' });
    }
    // Check if client has related records
    if (error.code === 'P2003') {
      return res.status(409).json({
        error: 'Cannot delete client',
        message: 'Client has associated contracts or activities',
      });
    }
    next(error);
  }
});

// GET /api/clients/:id/contracts - Get client contracts
router.get('/:id/contracts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    const contracts = await prisma.contract.findMany({
      where: { clientId: id },
      include: {
        activities: {
          where: { status: { in: ['VERIFIED', 'INVOICED'] } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(contracts);
  } catch (error) {
    next(error);
  }
});

// GET /api/clients/:id/activities - Get client activities
router.get('/:id/activities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    const activities = await prisma.activity.findMany({
      where: { clientId: id },
      include: {
        worker: true,
        contract: true,
      },
      orderBy: { scheduledStart: 'desc' },
    });
    res.json(activities);
  } catch (error) {
    next(error);
  }
});

export default router;

