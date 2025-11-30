import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/prisma';

const router = Router();

// GET /api/contracts - List contracts
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clientId, status } = req.query;
    
    const where: any = {};
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        client: true,
        activities: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(contracts);
  } catch (error) {
    next(error);
  }
});

// GET /api/contracts/:id - Get single contract
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Contract ID is required' });
    }

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        client: true,
        activities: {
          include: { worker: true },
        },
      },
    });
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json(contract);
  } catch (error) {
    next(error);
  }
});

// POST /api/contracts - Create new contract
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clientId, orderNumber, totalHours, startDate, endDate, status } = req.body;

    if (!clientId || !orderNumber || !totalHours || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    if (totalHours <= 0) {
      return res.status(400).json({ error: 'Total hours must be positive' });
    }

    const contract = await prisma.contract.create({
      data: {
        clientId,
        orderNumber,
        totalHours: parseFloat(totalHours),
        startDate: start,
        endDate: end,
        status: status || 'ACTIVE',
      },
      include: { client: true },
    });
    res.status(201).json(contract);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Duplicate entry',
        message: 'A contract with this order number already exists for this client',
      });
    }
    next(error);
  }
});

// PATCH /api/contracts/:id - Update contract
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Contract ID is required' });
    }

    const { clientId, orderNumber, totalHours, startDate, endDate, status } = req.body;

    const updateData: any = {};
    if (clientId !== undefined) updateData.clientId = clientId;
    if (orderNumber !== undefined) updateData.orderNumber = orderNumber;
    if (totalHours !== undefined) {
      if (totalHours <= 0) {
        return res.status(400).json({ error: 'Total hours must be positive' });
      }
      updateData.totalHours = parseFloat(totalHours);
    }
    if (status !== undefined) updateData.status = status;

    if (startDate !== undefined || endDate !== undefined) {
      const existing = await prisma.contract.findUnique({
        where: { id },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      const start = startDate ? new Date(startDate) : existing.startDate;
      const end = endDate ? new Date(endDate) : existing.endDate;

      if (end <= start) {
        return res.status(400).json({ error: 'End date must be after start date' });
      }

      updateData.startDate = start;
      updateData.endDate = end;
    }

    const contract = await prisma.contract.update({
      where: { id },
      data: updateData,
      include: { client: true, activities: true },
    });
    res.json(contract);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Contract not found' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Duplicate entry',
        message: 'A contract with this order number already exists for this client',
      });
    }
    next(error);
  }
});

// GET /api/contracts/:id/hours-remaining - Get remaining hours for contract
router.get('/:id/hours-remaining', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Contract ID is required' });
    }

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        activities: {
          where: { status: { in: ['VERIFIED', 'INVOICED'] } },
        },
      },
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const usedHours = contract.activities.reduce((sum: number, a) => sum + a.durationHours, 0);
    const remaining = contract.totalHours - usedHours;

    res.json({
      contractId: contract.id,
      totalHours: contract.totalHours,
      usedHours,
      remainingHours: remaining,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/contracts/:id - Delete contract
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Contract ID is required' });
    }

    await prisma.contract.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Contract not found' });
    }
    next(error);
  }
});

export default router;

