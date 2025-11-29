// controllers/workers.js
const { prisma } = require('../lib/prisma');
const { validateWorker } = require('../lib/validations');
const { NotFoundError } = require('../lib/errors');
const activityService = require('../services/activityService');

async function list(req, res, next) {
  try {
    const workers = await prisma.user.findMany({
      where: { role: 'WORKER' },
      orderBy: { name: 'asc' },
    });
    res.json(workers);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const worker = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        activities: {
          include: { client: true, contract: true },
          orderBy: { scheduledStart: 'desc' },
        },
      },
    });
    if (!worker) throw new NotFoundError('Worker');
    res.json(worker);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = validateWorker(req.body);
    const worker = await prisma.user.create({
      data: {
        ...data,
        role: 'WORKER',
      },
    });
    res.status(201).json(worker);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const data = validateWorker(req.body);
    const worker = await prisma.user.update({
      where: { id: req.params.id },
      data,
    });
    res.json(worker);
  } catch (error) {
    next(error);
  }
}

async function deleteWorker(req, res, next) {
  try {
    await prisma.user.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function getActivities(req, res, next) {
  try {
    const activities = await prisma.activity.findMany({
      where: { workerId: req.params.id },
      include: { client: true, contract: true },
      orderBy: { scheduledStart: 'desc' },
    });
    res.json(activities);
  } catch (error) {
    next(error);
  }
}

async function checkAvailability(req, res, next) {
  try {
    const { workerId, scheduledStart, scheduledEnd, excludeActivityId } = req.body;
    const availability = await activityService.checkWorkerAvailability(
      workerId,
      scheduledStart,
      scheduledEnd,
      excludeActivityId
    );
    res.json(availability);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  delete: deleteWorker,
  getActivities,
  checkAvailability,
};

