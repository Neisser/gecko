// controllers/invoices.js
const { prisma } = require('../lib/prisma');
const { validateInvoice } = require('../lib/validations');
const { NotFoundError } = require('../lib/errors');
const invoiceService = require('../services/invoiceService');

async function list(req, res, next) {
  try {
    const { type } = req.query;
    const invoices = await prisma.invoice.findMany({
      where: type ? { type } : {},
      include: {
        client: type === 'CLIENT_BILL' || !type,
        worker: type === 'WORKER_PAYOUT' || !type,
      },
      orderBy: { generatedAt: 'desc' },
    });
    res.json(invoices);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        worker: true,
      },
    });
    if (!invoice) throw new NotFoundError('Invoice');
    res.json(invoice);
  } catch (error) {
    next(error);
  }
}

async function generateClientInvoice(req, res, next) {
  try {
    const data = validateInvoice(req.body);
    if (data.type !== 'CLIENT_BILL') {
      return res.status(400).json({ error: 'Invalid invoice type for this endpoint' });
    }
    const result = await invoiceService.generateClientInvoice(
      data.entityId,
      data.periodStart,
      data.periodEnd
    );
    res.status(201).json(result.invoice);
  } catch (error) {
    next(error);
  }
}

async function generateWorkerPayout(req, res, next) {
  try {
    const data = validateInvoice(req.body);
    if (data.type !== 'WORKER_PAYOUT') {
      return res.status(400).json({ error: 'Invalid invoice type for this endpoint' });
    }
    const result = await invoiceService.generateWorkerPayout(
      data.entityId,
      data.periodStart,
      data.periodEnd
    );
    res.status(201).json(result.invoice);
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(invoice);
  } catch (error) {
    next(error);
  }
}

async function generatePDF(req, res, next) {
  try {
    // PDF generation implementation
    res.status(501).json({ error: 'PDF generation not yet implemented' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  getById,
  generateClientInvoice,
  generateWorkerPayout,
  updateStatus,
  generatePDF,
};

