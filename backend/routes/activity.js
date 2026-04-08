const express = require('express');
const router = express.Router();
const { getActivity, getActivityStats } = require('../controllers/activityController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getActivity);
router.get('/stats', authorize('admin', 'manager'), getActivityStats);

module.exports = router;
