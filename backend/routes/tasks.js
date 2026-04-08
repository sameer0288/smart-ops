const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getTasks, getTask, createTask, updateTask, deleteTask, getTaskStats, bulkUpdateTasks } = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(protect);

router.get('/stats', getTaskStats);
router.get('/', getTasks);
router.get('/:id', getTask);

router.post('/', [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('status').optional().isIn(['todo', 'in_progress', 'in_review', 'blocked', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('type').optional().isIn(['feature', 'bug', 'improvement', 'research', 'documentation', 'other']).withMessage('Invalid type')
], validate, createTask);

router.put('/bulk', authorize('admin', 'manager'), bulkUpdateTasks);

router.put('/:id', [
  body('title').optional().trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('status').optional().isIn(['todo', 'in_progress', 'in_review', 'blocked', 'completed', 'cancelled']).withMessage('Invalid status')
], validate, updateTask);

router.delete('/:id', authorize('admin', 'manager'), deleteTask);

module.exports = router;
