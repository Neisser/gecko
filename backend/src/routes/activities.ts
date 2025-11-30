import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/prisma';
import { ActivityStatus } from '../generated/prisma/enums';

const router = Router();

// Helper function to calculate duration in hours
function calculateDuration(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

// Helper function to validate contract hours
async function validateContractHours(contractId: string, hours: number) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      activities: {
        where: { status: { in: ['VERIFIED', 'INVOICED'] } },
      },
    },
  });

  if (!contract) {
    throw new Error('Contract not found');
  }

  const usedHours = contract.activities.reduce((sum, a) => sum + a.durationHours, 0);
  const remaining = contract.totalHours - usedHours;

  if (hours > remaining) {
    throw new Error(`Insufficient hours. Remaining: ${remaining}`);
  }
}

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

// GET /api/activities - List activities with filters
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, workerId, clientId, contractId, startDate, endDate } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    if (workerId) where.workerId = workerId;
    if (clientId) where.clientId = clientId;
    if (contractId) where.contractId = contractId;
    if (startDate && endDate) {
      where.scheduledStart = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const activities = await prisma.activity.findMany({
      where,
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
});

// GET /api/activities/:id - Get single activity
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Activity ID is required' });
    }
    const activity = await prisma.activity.findUnique({
      where: { id },
      include: { contract: true, worker: true, client: true },
    });
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    res.json(activity);
  } catch (error) {
    next(error);
  }
});

// POST /api/activities - Create new activity
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      title,
      contractId,
      clientId,
      workerId,
      scheduledStart,
      scheduledEnd,
      location,
      description,
    } = req.body;

    if (!title || !clientId || !scheduledStart || !scheduledEnd || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const startDate = new Date(scheduledStart);
    const endDate = new Date(scheduledEnd);
    
    if (endDate <= startDate) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    const durationHours = calculateDuration(startDate, endDate);

    // Check contract hours if contractId provided
    if (contractId) {
      await validateContractHours(contractId, durationHours);
    }

    const activity = await prisma.activity.create({
      data: {
        title,
        contractId: contractId || null,
        clientId,
        workerId: workerId || null,
        scheduledStart: startDate,
        scheduledEnd: endDate,
        durationHours,
        location,
        description: description || null,
        status: ActivityStatus.UNASSIGNED,
      },
      include: { contract: true, worker: true, client: true },
    });
    res.status(201).json(activity);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/activities/:id - Update activity
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Activity ID is required' });
    }

    const {
      title,
      contractId,
      clientId,
      workerId,
      scheduledStart,
      scheduledEnd,
      location,
      description,
      status,
    } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (contractId !== undefined) updateData.contractId = contractId || null;
    if (clientId !== undefined) updateData.clientId = clientId;
    if (workerId !== undefined) updateData.workerId = workerId || null;
    if (location !== undefined) updateData.location = location;
    if (description !== undefined) updateData.description = description || null;
    if (status !== undefined) updateData.status = status;

    if (scheduledStart !== undefined || scheduledEnd !== undefined) {
      const existing = await prisma.activity.findUnique({
        where: { id },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Activity not found' });
      }

      const startDate = scheduledStart ? new Date(scheduledStart) : existing.scheduledStart;
      const endDate = scheduledEnd ? new Date(scheduledEnd) : existing.scheduledEnd;

      if (endDate <= startDate) {
        return res.status(400).json({ error: 'End date must be after start date' });
      }

      updateData.scheduledStart = startDate;
      updateData.scheduledEnd = endDate;
      updateData.durationHours = calculateDuration(startDate, endDate);

      // Check contract hours if contractId is being set or updated
      const finalContractId = contractId !== undefined ? (contractId || null) : existing.contractId;
      if (finalContractId) {
        await validateContractHours(finalContractId, updateData.durationHours);
      }
    }

    const activity = await prisma.activity.update({
      where: { id },
      data: updateData,
      include: { contract: true, worker: true, client: true },
    });
    res.json(activity);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Activity not found' });
    }
    next(error);
  }
});

// PATCH /api/activities/:id/assign - Assign worker to activity
router.patch('/:id/assign', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activityId = req.params.id;
    if (!activityId) {
      return res.status(400).json({ error: 'Activity ID is required' });
    }

    const { workerId } = req.body;

    // Get activity to check scheduled times
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    });
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Check worker availability if workerId provided
    if (workerId) {
      const availability = await checkWorkerAvailability(
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
        workerId: workerId || null,
        status: workerId ? ActivityStatus.SCHEDULED : ActivityStatus.UNASSIGNED,
      },
      include: { worker: true, contract: true, client: true },
    });
    res.json(updatedActivity);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Activity not found' });
    }
    next(error);
  }
});

// PATCH /api/activities/:id/status - Update activity status
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Activity ID is required' });
    }

    const { status } = req.body;
    const activity = await prisma.activity.update({
      where: { id },
      data: { status },
      include: { contract: true, worker: true, client: true },
    });

    // If status is VERIFIED, contract hours are tracked via activities
    // No need to update contract directly as hours are calculated from activities

    res.json(activity);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Activity not found' });
    }
    next(error);
  }
});

// DELETE /api/activities/:id - Delete activity
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Activity ID is required' });
    }

    await prisma.activity.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Activity not found' });
    }
    next(error);
  }
});

export default router;

