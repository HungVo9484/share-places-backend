const mongoose = require('mongoose')
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../utils/location');
const Place = require('../models/place');
const User = require('../models/user');

exports.getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place

  try {
    place = await Place.findById(placeId);
  } catch (err) {
    return next(new HttpError('Server error', 500))
  }

  if (!place) {
    return next(new HttpError(
      'Could not find a place by the provided place id.',
      404
    ));
  }

  res.json({ place: place.toObject({ getters: true }) });
};

exports.getPlacesByUSerId = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate('places');
  } catch (err) {
    return next(new HttpError('Server error', 500))
  }

  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(
      new HttpError(
        'Could not find a place by the provided place id.',
        404
      )
    );
  }

  res.json({ places: userWithPlaces.places.map(place => place.toObject({getters: true})) });
};

exports.createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new HttpError('Invalid inputs passed, please check your data.', 422));
  }

  const { title, description, address, creator } = req.body;

  // let coordinates;
  // try {
  //   coordinates = await getCoordsForAddress(address);
  // } catch (error) {
  //   return next(error);
  // }

  let user;

  try {
    user = await User.findById(creator);
  } catch (err) {
    return next(new HttpError('Server error.', 500))
  }
  
  if (!user) {
    return next(new HttpError('Could not find the user.', 404))
  }

  const createdPlace = new Place({
    title,
    description,
    location: {
      lat: 0,
      lng: 0
    },
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Empire_State_Building_%28aerial_view%29.jpg/800px-Empire_State_Building_%28aerial_view%29.jpg',
    address,
    creator,
  });

  console.log(user.places);

  try {
    // const sess = await mongoose.startSession();
    // sess.startTransaction()
    // await createdPlace.save({session: sess});
    // user.places.push(createdPlace);
    // await user.save({ session: sess });
    // await sess.commitTransaction()

    await createdPlace.save();
    user.places.push(createdPlace);
    await user.save();
    
  } catch (err) {
    return next(new HttpError('Could not create place.', 500))
  }

  res.status(201).json({ place: createdPlace.toObject({getters: true}) });
};

exports.updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError('Invalid inputs passed, please check your data.', 422);
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;

  try {
    place = await Place.findById(placeId);
    place.title = title;
    place.description = description;
    await place.save();
  } catch (err) {
    return next(new HttpError('Server error', 500))
  }

  res.status(200).json({ place: place.toObject({getters: true}) });
};

exports.deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  
  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
    if (!place) {
      return next(new HttpError('Place not exist', 404))
    }

    const placeIndex = place.creator.places.findIndex(id => id.toString() === placeId);
    place.creator.places.splice(placeIndex, 1);
    await place.creator.save()

    await place.remove()
  } catch (err) {
    return next(new HttpError('Server error', 500))
  }

  
  res.status(200).json({ message: 'Deleted place.' });
};
