const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getUsers, getUserById, createUser, updateUser, deleteUser, getUserWorkload } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(protect);

router.get('/', authorize('admin', 'manager'), getUsers);
router.get('/:id', authorize('admin', 'manager'), getUserById);
router.get('/:id/workload', authorize('admin', 'manager'), getUserWorkload);

router.post('/', authorize('admin'), [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'manager', 'user']).withMessage('Invalid role')
], validate, createUser);

router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
