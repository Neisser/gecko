// routes/activities.js
const express = require('express');
const router = express.Router();
const activitiesController = require('../controllers/activities');

// GET /api/activities - List activities with filters
router.get('/', activitiesController.list);

// GET /api/activities/:id - Get single activity
router.get('/:id', activitiesController.getById);

// POST /api/activities - Create new activity
router.post('/', activitiesController.create);

// PATCH /api/activities/:id - Update activity
router.patch('/:id', activitiesController.update);

// PATCH /api/activities/:id/assign - Assign worker to activity
router.patch('/:id/assign', activitiesController.assignWorker);

// PATCH /api/activities/:id/status - Update activity status
router.patch('/:id/status', activitiesController.updateStatus);

// DELETE /api/activities/:id - Delete activity
router.delete('/:id', activitiesController.delete);

module.exports = router;

