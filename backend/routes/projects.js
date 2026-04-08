const express = require('express');
const router = express.Router();
const { getProjects, getProject, createProject, updateProject, deleteProject, addMember, removeMember } = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getProjects);
router.get('/:id', getProject);
router.post('/', authorize('admin', 'manager'), createProject);
router.put('/:id', authorize('admin', 'manager'), updateProject);
router.delete('/:id', authorize('admin'), deleteProject);
router.post('/:id/members', authorize('admin', 'manager'), addMember);
router.delete('/:id/members/:userId', authorize('admin', 'manager'), removeMember);

module.exports = router;
