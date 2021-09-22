const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const User = require('../models/user');

exports.getUsers = async (req, res, next) => {

  let users;
  try {
    users = await User.find({}, '-password');
   } catch (err) {
    return next(new HttpError('Server error', 500))
  }

  res.json(users.map(user => user.toObject({getters: true})))
};

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return  next(new HttpError(
      'Invalid inputs passed, please check your data.',
      422
    ));
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

  const createdUser = new User({
    name,
    email,
    password,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Empire_State_Building_%28aerial_view%29.jpg/800px-Empire_State_Building_%28aerial_view%29.jpg',
    places: []
  });

  try {
    await createdUser.save()
  } catch (err) {
    console.log(err);
    return next(new HttpError('Could not create user.', 500))
  }

  res.status(201).json({ user: createdUser.toObject({getters: true}) });
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    return next(new HttpError('Server error', 500));
  }

  if (!existingUser || existingUser.password !== password) {
    return next(new HttpError('Invalid credentials', 401))
  }

  res.json({ message: 'Logged in!' });
};
