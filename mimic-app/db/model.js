var mongoose = require('mongoose');

var speechDatas = mongoose.model('speechdatas', mongoose.Schema({
  name: String,
  phonemes: Object,
}));

var models = mongoose.model('models', mongoose.Schema({
  location: String,
  createAt: {
    type: Date,
    default: Date.now
  }
}));

module.exports = {
  speechDatas,
  models
};
