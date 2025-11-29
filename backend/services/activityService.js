// services/activityService.js
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

