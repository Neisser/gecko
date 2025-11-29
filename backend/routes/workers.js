// routes/workers.js
const express = require('express');
const router = express.Router();
const workersController = require('../controllers/workers');

router.get('/', workersController.list);
router.get('/:id', workersController.getById);
router.post('/', workersController.create);
router.patch('/:id', workersController.update);
router.delete('/:id', workersController.delete);
router.get('/:id/activities', workersController.getActivities);
// POST endpoint for availability check (matches frontend expectations)
router.post('/check-availability', workersController.checkAvailability);

module.exports = router;

