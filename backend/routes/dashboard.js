const express = require('express');
const router = express.Router();
const { getDashboard, getWorkloadDistribution } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getDashboard);
router.get('/workload', authorize('admin', 'manager'), getWorkloadDistribution);

module.exports = router;
