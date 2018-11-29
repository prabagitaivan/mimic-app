var mongoose = require('mongoose');

var speechDatas = mongoose.model('speechdatas', mongoose.Schema({
  name: String,
  phonemes: Object,
}));

var phonemes = mongoose.model('phonemes', mongoose.Schema({
  phoneme: String,
}));

module.exports = {
  speechDatas,
  phonemes
};
