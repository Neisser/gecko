// routes/invoices.js
const express = require('express');
const router = express.Router();
const invoicesController = require('../controllers/invoices');

router.get('/', invoicesController.list);
router.get('/:id', invoicesController.getById);
// Separate endpoints for client and worker invoices (matches frontend expectations)
router.post('/client', invoicesController.generateClientInvoice);
router.post('/worker', invoicesController.generateWorkerPayout);
router.patch('/:id/status', invoicesController.updateStatus);
router.get('/:id/pdf', invoicesController.generatePDF);

module.exports = router;

