// controllers/dashboard.js
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

