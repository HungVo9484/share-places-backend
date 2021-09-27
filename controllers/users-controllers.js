const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const jwtSecret = config.get('jwtSecret');

const HttpError = require('../models/http-error');
const User = require('../models/user');
const bcryptjs = require('bcryptjs');

exports.getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, '-password');
  } catch (err) {
    return next(new HttpError('Server error', 500));
  }

  res.json(users.map((user) => user.toObject({ getters: true })));
};

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError(
        'Invalid inputs passed, please check your data.',
        422
      )
    );
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    return next(new HttpError('Server error', 500));
  }

  if (existingUser) {
    return next(new HttpError('User exists already.', 400));
  }

  let hashedPassword;

  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(
      new HttpError('Could not create user, please try agin!', 500)
    );
  }

  existingUser = new User({
    name,
    email,
    password: hashedPassword,
    image: req.file.path,
    places: [],
  });

  try {
    await existingUser.save();
  } catch (err) {
    return next(new HttpError('Could not create user.', 500));
  }

  let token;

  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      jwtSecret,
      {
        expiresIn: '1h',
      }
    );
  } catch (err) {
    return next(new HttpError('Could not create user.', 500));
  }

  res.status(201).json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
  });
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    return next(new HttpError('Server error', 500));
  }

  if (!existingUser) {
    return next(new HttpError('Invalid credentials', 401));
  }

  let isValidPassword = false;

  try {
    isValidPassword = await bcrypt.compare(
      password,
      existingUser.password
    );
  } catch (err) {
    return next(
      new HttpError('Could not login, please try again!', 500)
    );
  }

  if (!isValidPassword) {
    return next(new HttpError('Invalid credentials', 401));
  }

  let token;

  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      jwtSecret,
      {
        expiresIn: '1h',
      }
    );
  } catch (err) {
    return next(new HttpError('Could not login.', 500));
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
  });
};
