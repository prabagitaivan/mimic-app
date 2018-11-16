const db = require('../../db');
const model = require('./model');

exports.read = async (req, res) => {
  let result = {};
  model.db = await db();
  result = await model.find({}).select('id');
  res.send(result);
};

exports.update = (req, res) => {
  res.send('NOT IMPLEMENTED');
};
