// controllers/contracts.js
const { prisma } = require('../lib/prisma');
const { validateContract } = require('../lib/validations');
const { NotFoundError } = require('../lib/errors');

async function list(req, res, next) {
  try {
    const { clientId, status } = req.query;
    const contracts = await prisma.contract.findMany({
      where: {
        ...(clientId && { clientId }),
        ...(status && { status }),
      },
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
}

async function getById(req, res, next) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        activities: {
          include: { worker: true },
        },
      },
    });
    if (!contract) throw new NotFoundError('Contract');
    res.json(contract);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = validateContract(req.body);
    const contract = await prisma.contract.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
      include: { client: true },
    });
    res.status(201).json(contract);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const data = validateContract(req.body);
    const contract = await prisma.contract.update({
      where: { id: req.params.id },
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
      include: { client: true },
    });
    res.json(contract);
  } catch (error) {
    next(error);
  }
}

async function getHoursRemaining(req, res, next) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id },
      include: {
        activities: {
          where: { status: { in: ['VERIFIED', 'INVOICED'] } },
        },
      },
    });
    if (!contract) throw new NotFoundError('Contract');

    const usedHours = contract.activities.reduce((sum, a) => sum + a.durationHours, 0);
    const remaining = contract.totalHours - usedHours;

    res.json({
      contractId: contract.id,
      totalHours: contract.totalHours,
      usedHours,
      remaining,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteContract(req, res, next) {
  try {
    await prisma.contract.delete({
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
  getHoursRemaining,
  delete: deleteContract,
};

