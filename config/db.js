const mongoose = require('mongoose');
const config = require('config');
const uri = config.get('mongoURI');

const connectDB = async () => {
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');
  } catch (err) {
    console.log('Could not connect to DB');
  }
};

module.exports = connectDB;
