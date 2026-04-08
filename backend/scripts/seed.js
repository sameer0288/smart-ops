const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Connected for seeding...');
};

const seed = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([
    User.deleteMany(),
    Project.deleteMany(),
    Task.deleteMany(),
    Activity.deleteMany(),
    Notification.deleteMany()
  ]);
  console.log('Cleared existing data');

  // Create Users
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const managerPassword = await bcrypt.hash('Manager@123', 12);
  const userPassword = await bcrypt.hash('User@123', 12);

  const admin = await User.create({
    name: 'Alex Admin',
    email: 'admin@smartops.com',
    password: 'Admin@123',
    role: 'admin',
    department: 'Engineering',
    designation: 'CTO',
    isActive: true
  });

  const manager1 = await User.create({
    name: 'Maria Manager',
    email: 'manager@smartops.com',
    password: 'Manager@123',
    role: 'manager',
    department: 'Product',
    designation: 'Product Manager',
    isActive: true
  });

  const manager2 = await User.create({
    name: 'David Chen',
    email: 'david@smartops.com',
    password: 'Manager@123',
    role: 'manager',
    department: 'Engineering',
    designation: 'Engineering Manager',
    isActive: true
  });

  const user1 = await User.create({
    name: 'Sarah Johnson',
    email: 'sarah@smartops.com',
    password: 'User@123',
    role: 'user',
    department: 'Engineering',
    designation: 'Frontend Developer',
    isActive: true
  });

  const user2 = await User.create({
    name: 'Tom Wilson',
    email: 'tom@smartops.com',
    password: 'User@123',
    role: 'user',
    department: 'Engineering',
    designation: 'Backend Developer',
    isActive: true
  });

  const user3 = await User.create({
    name: 'Emma Davis',
    email: 'emma@smartops.com',
    password: 'User@123',
    role: 'user',
    department: 'Design',
    designation: 'UI/UX Designer',
    isActive: true
  });

  console.log('✅ Users created');

  // Create Projects
  const project1 = await Project.create({
    name: 'Smart Operations Platform v2.0',
    description: 'Complete overhaul of the internal operations system with new features and improved performance.',
    status: 'active',
    priority: 'critical',
    color: '#6366f1',
    icon: '🚀',
    manager: manager1._id,
    createdBy: admin._id,
    members: [
      { user: user1._id, role: 'lead' },
      { user: user2._id, role: 'member' },
      { user: user3._id, role: 'member' },
      { user: manager2._id, role: 'observer' }
    ],
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-06-30'),
    budget: 150000,
    tags: ['platform', 'core', 'internal']
  });

  const project2 = await Project.create({
    name: 'Mobile App Development',
    description: 'Build native mobile applications for iOS and Android platforms.',
    status: 'planning',
    priority: 'high',
    color: '#10b981',
    icon: '📱',
    manager: manager2._id,
    createdBy: admin._id,
    members: [
      { user: user1._id, role: 'member' },
      { user: user3._id, role: 'lead' }
    ],
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-12-31'),
    budget: 80000,
    tags: ['mobile', 'ios', 'android']
  });

  const project3 = await Project.create({
    name: 'Customer Portal Redesign',
    description: 'Complete UI/UX redesign of the customer-facing portal for better user experience.',
    status: 'active',
    priority: 'medium',
    color: '#f59e0b',
    icon: '🎨',
    manager: manager1._id,
    createdBy: manager1._id,
    members: [
      { user: user3._id, role: 'lead' },
      { user: user1._id, role: 'member' }
    ],
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-05-31'),
    budget: 40000,
    tags: ['design', 'customer', 'ui']
  });

  console.log('✅ Projects created');

  // Create Tasks
  const tasks = await Task.create([
    {
      title: 'Implement JWT Authentication System',
      description: 'Build a secure JWT-based authentication system with refresh tokens and token rotation.',
      status: 'completed',
      priority: 'critical',
      type: 'feature',
      assignee: user2._id,
      createdBy: manager2._id,
      project: project1._id,
      dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      estimatedHours: 16,
      actualHours: 14,
      tags: ['auth', 'security', 'backend'],
      statusHistory: [
        { from: null, to: 'todo', changedBy: manager2._id, note: 'Task created' },
        { from: 'todo', to: 'in_progress', changedBy: user2._id, note: 'Started working' },
        { from: 'in_progress', to: 'completed', changedBy: user2._id, note: 'Done' }
      ]
    },
    {
      title: 'Design Dashboard UI Components',
      description: 'Create reusable UI components for the dashboard including charts, cards, and data tables.',
      status: 'in_progress',
      priority: 'high',
      type: 'feature',
      assignee: user1._id,
      createdBy: manager1._id,
      project: project1._id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      estimatedHours: 24,
      tags: ['frontend', 'ui', 'components'],
      statusHistory: [
        { from: null, to: 'todo', changedBy: manager1._id, note: 'Task created' },
        { from: 'todo', to: 'in_progress', changedBy: user1._id, note: 'started' }
      ]
    },
    {
      title: 'Setup CI/CD Pipeline',
      description: 'Configure GitHub Actions for automated testing, building, and deployment.',
      status: 'todo',
      priority: 'high',
      type: 'improvement',
      assignee: user2._id,
      createdBy: admin._id,
      project: project1._id,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      estimatedHours: 8,
      tags: ['devops', 'ci-cd'],
      statusHistory: [{ from: null, to: 'todo', changedBy: admin._id, note: 'Task created' }]
    },
    {
      title: 'Fix Payment Gateway Integration Bug',
      description: 'Payments failing intermittently on the checkout page. Investigate and fix the Stripe webhook handler.',
      status: 'in_review',
      priority: 'critical',
      type: 'bug',
      assignee: user2._id,
      createdBy: manager1._id,
      project: project1._id,
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // overdue
      estimatedHours: 4,
      tags: ['bug', 'payment', 'critical'],
      statusHistory: [
        { from: null, to: 'todo', changedBy: manager1._id },
        { from: 'todo', to: 'in_progress', changedBy: user2._id },
        { from: 'in_progress', to: 'in_review', changedBy: user2._id }
      ]
    },
    {
      title: 'Create Mobile Wireframes',
      description: 'Design wireframes for all 15 main screens of the mobile application.',
      status: 'in_progress',
      priority: 'medium',
      type: 'research',
      assignee: user3._id,
      createdBy: manager2._id,
      project: project2._id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      estimatedHours: 20,
      tags: ['design', 'wireframes', 'mobile'],
      statusHistory: [
        { from: null, to: 'todo', changedBy: manager2._id },
        { from: 'todo', to: 'in_progress', changedBy: user3._id }
      ]
    },
    {
      title: 'Customer Portal Homepage Redesign',
      description: 'Redesign the main landing page with modern UI patterns and improved conversion optimization.',
      status: 'todo',
      priority: 'high',
      type: 'feature',
      assignee: user3._id,
      createdBy: manager1._id,
      project: project3._id,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      estimatedHours: 16,
      tags: ['design', 'homepage', 'customer'],
      statusHistory: [{ from: null, to: 'todo', changedBy: manager1._id }]
    },
    {
      title: 'Write API Documentation',
      description: 'Document all REST API endpoints using Swagger/OpenAPI specification.',
      status: 'blocked',
      priority: 'medium',
      type: 'documentation',
      assignee: user2._id,
      createdBy: manager2._id,
      project: project1._id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      estimatedHours: 12,
      tags: ['documentation', 'api'],
      statusHistory: [
        { from: null, to: 'todo', changedBy: manager2._id },
        { from: 'todo', to: 'blocked', changedBy: user2._id, note: 'Waiting for API to be finalized' }
      ]
    },
    {
      title: 'Performance Optimization - Database Queries',
      description: 'Optimize slow database queries identified in production monitoring. Add proper indexes.',
      status: 'todo',
      priority: 'high',
      type: 'improvement',
      assignee: user2._id,
      createdBy: admin._id,
      project: project1._id,
      dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      estimatedHours: 8,
      tags: ['performance', 'database', 'backend'],
      statusHistory: [{ from: null, to: 'todo', changedBy: admin._id }]
    }
  ]);

  console.log('✅ Tasks created');

  // Create some activities
  const activities = [
    { user: admin._id, action: 'user_login', entity: 'user', entityId: admin._id, entityTitle: 'Alex Admin' },
    { user: manager1._id, action: 'project_created', entity: 'project', entityId: project1._id, entityTitle: project1.name },
    { user: user2._id, action: 'task_completed', entity: 'task', entityId: tasks[0]._id, entityTitle: tasks[0].title },
    { user: user1._id, action: 'task_status_changed', entity: 'task', entityId: tasks[1]._id, entityTitle: tasks[1].title, details: { from: 'todo', to: 'in_progress' } },
    { user: manager2._id, action: 'task_assigned', entity: 'task', entityId: tasks[2]._id, entityTitle: tasks[2].title },
    { user: admin._id, action: 'project_created', entity: 'project', entityId: project2._id, entityTitle: project2.name },
    { user: user3._id, action: 'task_status_changed', entity: 'task', entityId: tasks[4]._id, entityTitle: tasks[4].title, details: { from: 'todo', to: 'in_progress' } }
  ];
  await Activity.insertMany(activities);

  // Create some notifications
  await Notification.create([
    {
      recipient: user1._id,
      sender: manager1._id,
      type: 'task_assigned',
      title: 'New task assigned',
      message: 'Maria Manager assigned you "Design Dashboard UI Components"',
      link: `/tasks/${tasks[1]._id}`,
      entityType: 'task',
      entityId: tasks[1]._id,
      isRead: false
    },
    {
      recipient: user2._id,
      sender: admin._id,
      type: 'task_assigned',
      title: 'New task assigned',
      message: 'Alex Admin assigned you "Setup CI/CD Pipeline"',
      link: `/tasks/${tasks[2]._id}`,
      entityType: 'task',
      entityId: tasks[2]._id,
      isRead: false
    },
    {
      recipient: user3._id,
      sender: manager1._id,
      type: 'project_invitation',
      title: 'Added to project',
      message: 'Maria Manager added you to "Customer Portal Redesign"',
      link: `/projects/${project3._id}`,
      entityType: 'project',
      entityId: project3._id,
      isRead: true,
      readAt: new Date()
    }
  ]);

  console.log('✅ Activities and notifications created');

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('='.repeat(50));
  console.log('📧 Login Credentials:');
  console.log('='.repeat(50));
  console.log('👑 Admin:   admin@smartops.com   / Admin@123');
  console.log('🔷 Manager: manager@smartops.com / Manager@123');
  console.log('👤 User:    sarah@smartops.com   / User@123');
  console.log('='.repeat(50));

  process.exit(0);
};

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
