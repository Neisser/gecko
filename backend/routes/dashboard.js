// routes/dashboard.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard');

// Main dashboard endpoint that returns all data (matches frontend expectations)
router.get('/', dashboardController.getDashboardData);
// Individual endpoints for granular access (optional)
router.get('/kpis', dashboardController.getKPIs);
router.get('/metrics', dashboardController.getMetrics);
router.get('/urgent-activities', dashboardController.getUrgentActivities);

module.exports = router;

