// routes/clients.js
const express = require('express');
const router = express.Router();
const clientsController = require('../controllers/clients');

router.get('/', clientsController.list);
router.get('/:id', clientsController.getById);
router.post('/', clientsController.create);
router.patch('/:id', clientsController.update);
router.delete('/:id', clientsController.delete);
router.get('/:id/contracts', clientsController.getContracts);
router.get('/:id/activities', clientsController.getActivities);

module.exports = router;

