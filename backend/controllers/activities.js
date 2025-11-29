// controllers/activities.js
const { prisma } = require('../lib/prisma');
const { validateActivity } = require('../lib/validations');
const { NotFoundError } = require('../lib/errors');
const activityService = require('../services/activityService');

async function list(req, res, next) {
  try {
    const { status, workerId, clientId, contractId, startDate, endDate } = req.query;
    const activities = await prisma.activity.findMany({
      where: {
        ...(status && { status }),
        ...(workerId && { workerId }),
        ...(clientId && { clientId }),
        ...(contractId && { contractId }),
        ...(startDate && endDate && {
          scheduledStart: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      },
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
}

async function getById(req, res, next) {
  try {
    const activity = await prisma.activity.findUnique({
      where: { id: req.params.id },
      include: { contract: true, worker: true, client: true },
    });
    if (!activity) throw new NotFoundError('Activity');
    res.json(activity);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = validateActivity(req.body);
    const durationHours = activityService.calculateDuration(
      data.scheduledStart,
      data.scheduledEnd
    );

    // Check contract hours if contractId provided
    if (data.contractId) {
      await activityService.validateContractHours(data.contractId, durationHours);
    }

    const activity = await prisma.activity.create({
      data: {
        ...data,
        scheduledStart: new Date(data.scheduledStart),
        scheduledEnd: new Date(data.scheduledEnd),
        durationHours,
        status: 'UNASSIGNED',
      },
      include: { contract: true, worker: true, client: true },
    });
    res.status(201).json(activity);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const data = validateActivity(req.body);
    const durationHours = activityService.calculateDuration(
      data.scheduledStart,
      data.scheduledEnd
    );

    // Check contract hours if contractId provided
    if (data.contractId) {
      await activityService.validateContractHours(data.contractId, durationHours);
    }

    const activity = await prisma.activity.update({
      where: { id: req.params.id },
      data: {
        ...data,
        scheduledStart: new Date(data.scheduledStart),
        scheduledEnd: new Date(data.scheduledEnd),
        durationHours,
      },
      include: { contract: true, worker: true, client: true },
    });
    res.json(activity);
  } catch (error) {
    next(error);
  }
}

async function assignWorker(req, res, next) {
  try {
    const { workerId } = req.body;
    const activityId = req.params.id;

    // Get activity to check scheduled times
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    });
    if (!activity) throw new NotFoundError('Activity');

    // Check worker availability if workerId provided
    if (workerId) {
      const availability = await activityService.checkWorkerAvailability(
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
        workerId,
        status: workerId ? 'SCHEDULED' : 'UNASSIGNED',
      },
      include: { worker: true, contract: true, client: true },
    });
    res.json(updatedActivity);
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const activity = await prisma.activity.update({
      where: { id: req.params.id },
      data: { status },
      include: { contract: true, worker: true, client: true },
    });

    // If status is VERIFIED, update contract hours
    if (status === 'VERIFIED' && activity.contractId) {
      await activityService.deductContractHours(activity.contractId, activity.durationHours);
    }

    res.json(activity);
  } catch (error) {
    next(error);
  }
}

async function deleteActivity(req, res, next) {
  try {
    await prisma.activity.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  assignWorker,
  updateStatus,
  delete: deleteActivity,
};

