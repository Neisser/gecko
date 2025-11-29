// services/invoiceService.js
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

