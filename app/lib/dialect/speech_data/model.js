const mongoose = require('mongoose');

const schema = mongoose.Schema({
  id: { type: String, required: true },
  gender: { type: String, required: true },
  speech: { type: String, required: true },
});

const model = mongoose.model('speech_data', schema);

module.exports = model;
