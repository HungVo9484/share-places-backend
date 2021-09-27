const express = require('express');
const { check } = require('express-validator');

const placesControllers = require('../controllers/places-controller');
const fileUpload = require('../middlewares/file-upload');
const checkAuth = require('../middlewares/check-auth');

const router = express.Router();

router.get('/:pid', placesControllers.getPlaceById);

router.get('/user/:uid', placesControllers.getPlacesByUSerId);

router.use(checkAuth);

router.post('/', fileUpload.single('image'), [
  check('title').notEmpty(),
  check('description').isLength({ min: 5 }),
  check('address').notEmpty()
], placesControllers.createPlace);

router.patch('/:pid', [
  check('title').notEmpty(),
  check('description').isLength({ min: 5 }),
], placesControllers.updatePlace);

router.delete('/:pid', placesControllers.deletePlace);

module.exports = router;
