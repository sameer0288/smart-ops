const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getTaskComments, addComment, updateComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(protect);
router.get('/task/:taskId', getTaskComments);
router.post('/', [
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be 1-1000 characters'),
  body('taskId').isMongoId().withMessage('Valid task ID required')
], validate, addComment);
router.put('/:id', [
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be 1-1000 characters')
], validate, updateComment);
router.delete('/:id', deleteComment);

module.exports = router;
