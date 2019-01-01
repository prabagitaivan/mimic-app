const mongoose = require('mongoose');

// define `speechDatas` schema for its mongodb collection.
const speechDatas = mongoose.model('speechdatas', mongoose.Schema({
  name: String,
  syllables: Object,
}));

// define `models` schema for its mongodb collection.
const models = mongoose.model('models', mongoose.Schema({
  location: String,
  createAt: {
    type: Date,
    default: Date.now
  }
}));

// export `speechDatas` and `models` functions.
module.exports = {
  speechDatas,
  models
};
