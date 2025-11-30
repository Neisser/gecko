import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/prisma';
import { UserRole, ActivityStatus } from '../generated/prisma/enums';

const router = Router();

// Helper function to check worker availability
async function checkWorkerAvailability(
  workerId: string,
  scheduledStart: Date,
  scheduledEnd: Date,
  excludeActivityId: string | null = null
) {
  const conflicting = await prisma.activity.findMany({
    where: {
      workerId,
      ...(excludeActivityId && { id: { not: excludeActivityId } }),
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      OR: [
        {
          scheduledStart: { lte: scheduledEnd },
          scheduledEnd: { gte: scheduledStart },
        },
      ],
    },
  });

  return {
    available: conflicting.length === 0,
    conflictingActivities: conflicting,
  };
}

// GET /api/workers - List workers
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workers = await prisma.user.findMany({
      where: { role: UserRole.WORKER },
      orderBy: { name: 'asc' },
    });
    res.json(workers);
  } catch (error) {
    next(error);
  }
});

// GET /api/workers/:id - Get single worker
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Worker ID is required' });
    }

    const worker = await prisma.user.findUnique({
      where: { id },
      include: {
        activities: {
          include: { client: true, contract: true },
          orderBy: { scheduledStart: 'desc' },
        },
      },
    });
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    res.json(worker);
  } catch (error) {
    next(error);
  }
});

// POST /api/workers - Create new worker
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, role, hourlyRate, specialty } = req.body;

    if (!name || !email || !hourlyRate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (parseFloat(hourlyRate) <= 0) {
      return res.status(400).json({ error: 'Hourly rate must be positive' });
    }

    const worker = await prisma.user.create({
      data: {
        name,
        email,
        role: role || UserRole.WORKER,
        hourlyRate: parseFloat(hourlyRate),
        specialty: specialty || null,
      },
    });
    res.status(201).json(worker);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Duplicate entry',
        message: 'A worker with this email already exists',
      });
    }
    next(error);
  }
});

// PATCH /api/workers/:id - Update worker
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Worker ID is required' });
    }

    const { name, email, role, hourlyRate, specialty } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      updateData.email = email;
    }
    if (role !== undefined) updateData.role = role;
    if (hourlyRate !== undefined) {
      if (parseFloat(hourlyRate) <= 0) {
        return res.status(400).json({ error: 'Hourly rate must be positive' });
      }
      updateData.hourlyRate = parseFloat(hourlyRate);
    }
    if (specialty !== undefined) updateData.specialty = specialty || null;

    const worker = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    res.json(worker);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Worker not found' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Duplicate entry',
        message: 'A worker with this email already exists',
      });
    }
    next(error);
  }
});

// DELETE /api/workers/:id - Delete worker
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Worker ID is required' });
    }

    await prisma.user.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Worker not found' });
    }
    // Check if worker has related records
    if (error.code === 'P2003') {
      return res.status(409).json({
        error: 'Cannot delete worker',
        message: 'Worker has associated activities or invoices',
      });
    }
    next(error);
  }
});

// GET /api/workers/:id/activities - Get worker activities
router.get('/:id/activities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Worker ID is required' });
    }

    const activities = await prisma.activity.findMany({
      where: { workerId: id },
      include: { client: true, contract: true },
      orderBy: { scheduledStart: 'desc' },
    });
    res.json(activities);
  } catch (error) {
    next(error);
  }
});

// POST /api/workers/check-availability - Check worker availability
router.post('/check-availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workerId, scheduledStart, scheduledEnd, excludeActivityId } = req.body;

    if (!workerId || !scheduledStart || !scheduledEnd) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const startDate = new Date(scheduledStart);
    const endDate = new Date(scheduledEnd);

    if (endDate <= startDate) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    const availability = await checkWorkerAvailability(
      workerId,
      startDate,
      endDate,
      excludeActivityId || null
    );
    res.json(availability);
  } catch (error) {
    next(error);
  }
});

export default router;

