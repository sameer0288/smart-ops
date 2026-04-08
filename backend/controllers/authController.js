const User = require('../models/User');
const Activity = require('../models/Activity');
const { asyncHandler, AppError } = require('../middleware/validate');

// Helper: send token response
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = user.getSignedJwtToken();
  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      department: user.department,
      designation: user.designation,
      isActive: user.isActive,
      createdAt: user.createdAt
    }
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, department, designation } = req.body;

  // Check if email exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('Email already registered', 400));
  }

  // Only admin can create admin/manager accounts
  let assignedRole = 'user';
  if (role && ['admin', 'manager'].includes(role)) {
    // Check if there's an admin token in headers (for initial setup)
    if (req.user && req.user.role === 'admin') {
      assignedRole = role;
    }
    // Allow first user to be admin
    const userCount = await User.countDocuments();
    if (userCount === 0) assignedRole = 'admin';
  }

  const user = await User.create({
    name, email, password, department, designation,
    role: assignedRole
  });

  // Log activity
  await Activity.create({
    user: user._id,
    action: 'user_created',
    entity: 'user',
    entityId: user._id,
    entityTitle: user.name,
    details: { role: user.role },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  sendTokenResponse(user, 201, res, 'Account created successfully');
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new AppError('Invalid credentials', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Account deactivated. Contact administrator.', 401));
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new AppError('Invalid credentials', 401));
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Log login activity
  await Activity.create({
    user: user._id,
    action: 'user_login',
    entity: 'user',
    entityId: user._id,
    entityTitle: user.name,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  sendTokenResponse(user, 200, res, 'Login successful');
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      department: user.department,
      designation: user.designation,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    }
  });
});

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { name, department, designation, avatar } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, department, designation, avatar },
    { new: true, runValidators: true }
  );

  await Activity.create({
    user: req.user._id,
    action: 'user_updated',
    entity: 'user',
    entityId: user._id,
    entityTitle: user.name,
    ipAddress: req.ip
  });

  res.json({ success: true, message: 'Profile updated', user });
});

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return next(new AppError('Current password is incorrect', 400));
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password changed successfully');
});

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  await Activity.create({
    user: req.user._id,
    action: 'user_logout',
    entity: 'user',
    entityId: req.user._id,
    entityTitle: req.user.name,
    ipAddress: req.ip
  });
  res.json({ success: true, message: 'Logged out successfully' });
});
