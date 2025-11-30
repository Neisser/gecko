import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/prisma';
import { ActivityStatus, ContractStatus, UserRole } from '../generated/prisma/enums';

const router = Router();

// GET /api/dashboard - Get dashboard data
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get activities this month
    const activitiesThisMonth = await prisma.activity.findMany({
      where: {
        scheduledStart: { gte: startOfMonth, lte: endOfMonth },
        status: { in: [ActivityStatus.DONE, ActivityStatus.VERIFIED, ActivityStatus.INVOICED] },
      },
    });

    const hoursExecutedThisMonth = activitiesThisMonth.reduce(
      (sum, a) => sum + a.durationHours,
      0
    );

    // Get contracts
    const contracts = await prisma.contract.findMany({
      where: { status: ContractStatus.ACTIVE },
      include: {
        activities: {
          where: { status: { in: [ActivityStatus.VERIFIED, ActivityStatus.INVOICED] } },
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
      return sum + activity.durationHours * (client?.billingRate || 0);
    }, 0);

    // Calculate operational cost
    const workers = await prisma.user.findMany({ where: { role: UserRole.WORKER } });
    const operationalCost = activitiesThisMonth.reduce((sum, activity) => {
      if (!activity.workerId) return sum;
      const worker = workers.find((w) => w.id === activity.workerId);
      return sum + activity.durationHours * (worker?.hourlyRate || 0);
    }, 0);

    // Get urgent activities
    const urgentActivities = await prisma.activity.findMany({
      where: {
        OR: [
          { status: ActivityStatus.UNASSIGNED },
          {
            status: ActivityStatus.SCHEDULED,
            scheduledStart: { lte: sevenDaysFromNow },
          },
          {
            scheduledStart: { lt: now },
            status: { not: ActivityStatus.DONE },
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
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const workerOccupancy = await Promise.all(
      workers.map(async (worker) => {
        const activities = await prisma.activity.findMany({
          where: {
            workerId: worker.id,
            scheduledStart: { gte: sevenDaysAgo },
          },
        });
        const totalHours = activities.reduce((sum, a) => sum + a.durationHours, 0);
        return {
          workerId: worker.id,
          workerName: worker.name,
          totalHours,
          activityCount: activities.length,
        };
      })
    );

    // Revenue vs Cost (simplified - last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const activitiesLast30Days = await prisma.activity.findMany({
      where: {
        scheduledStart: { gte: thirtyDaysAgo },
        status: { in: [ActivityStatus.DONE, ActivityStatus.VERIFIED, ActivityStatus.INVOICED] },
      },
      include: { client: true, worker: true },
    });

    const revenueVsCost = {
      revenue: activitiesLast30Days.reduce((sum, activity) => {
        const client = clients.find((c) => c.id === activity.clientId);
        return sum + activity.durationHours * (client?.billingRate || 0);
      }, 0),
      cost: activitiesLast30Days.reduce((sum, activity) => {
        if (!activity.workerId) return sum;
        const worker = workers.find((w) => w.id === activity.workerId);
        return sum + activity.durationHours * (worker?.hourlyRate || 0);
      }, 0),
    };

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
});

// GET /api/dashboard/kpis - Get KPIs only (optional endpoint)
router.get('/kpis', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract KPI logic from getDashboardData
    res.status(501).json({ error: 'Use /dashboard endpoint' });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/metrics - Get metrics only (optional endpoint)
router.get('/metrics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract metrics logic from getDashboardData
    res.status(501).json({ error: 'Use /dashboard endpoint' });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/urgent-activities - Get urgent activities only (optional endpoint)
router.get('/urgent-activities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract urgent activities logic from getDashboardData
    res.status(501).json({ error: 'Use /dashboard endpoint' });
  } catch (error) {
    next(error);
  }
});

export default router;

