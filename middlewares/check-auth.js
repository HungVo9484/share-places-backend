const jwt = require('jsonwebtoken');
const config = require('config');
const jwtSecret = config.get('jwtSecret');

const HttpError = require('../models/http-error');

module.exports = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    next();
  }
  try {
    const token = req.headers.authorization.split(' ')[1]; // Authorization: 'Bearer TOKEN';
  
    if (!token) {
       throw new HttpError('Authentication failed!', 401);
    }
    const decodedToken = jwt.verify(token, jwtSecret);
    req.userData = {userId: decodedToken.userId}
    next()
  } catch (err) {
    return next(new HttpError('Authentication failed!', 401));
  }
};
