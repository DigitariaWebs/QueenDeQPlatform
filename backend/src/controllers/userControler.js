const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const emailService = require('../services/emailService');

exports.getUsers = async (req, res, next) => {
  const users = await User.find();
  successResponse(res, users);
};

exports.getUser = async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return errorResponse(res, 404, 'User not found');
  successResponse(res, user);
};

exports.createUser = async (req, res, next) => {
  const { name, email, password } = req.body;
  const user = new User({ name, email, password });
  await user.save();
  // send welcome email (async, but we don't await here)
  emailService.sendWelcomeEmail(email, name).catch(console.error);
  successResponse(res, user, 'User created', 201);
};

exports.deleteUser = async (req, res, next) => {
  await User.findByIdAndDelete(req.params.id);
  successResponse(res, null, 'User deleted');
};
