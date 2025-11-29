// controllers/clients.js
const { prisma } = require('../lib/prisma');
const { validateClient } = require('../lib/validations');
const { NotFoundError } = require('../lib/errors');

async function list(req, res, next) {
  try {
    const clients = await prisma.client.findMany({
      include: {
        contracts: {
          where: { status: 'ACTIVE' },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(clients);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        contracts: true,
        activities: {
          include: { worker: true, contract: true },
          orderBy: { scheduledStart: 'desc' },
        },
      },
    });
    if (!client) throw new NotFoundError('Client');
    res.json(client);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = validateClient(req.body);
    const client = await prisma.client.create({
      data,
    });
    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const data = validateClient(req.body);
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data,
    });
    res.json(client);
  } catch (error) {
    next(error);
  }
}

async function deleteClient(req, res, next) {
  try {
    await prisma.client.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function getContracts(req, res, next) {
  try {
    const contracts = await prisma.contract.findMany({
      where: { clientId: req.params.id },
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
}

async function getActivities(req, res, next) {
  try {
    const activities = await prisma.activity.findMany({
      where: { clientId: req.params.id },
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
}

module.exports = {
  list,
  getById,
  create,
  update,
  delete: deleteClient,
  getContracts,
  getActivities,
};

