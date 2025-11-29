// routes/contracts.js
const express = require('express');
const router = express.Router();
const contractsController = require('../controllers/contracts');

router.get('/', contractsController.list);
router.get('/:id', contractsController.getById);
router.post('/', contractsController.create);
router.patch('/:id', contractsController.update);
router.get('/:id/hours-remaining', contractsController.getHoursRemaining);
router.delete('/:id', contractsController.delete);

module.exports = router;

