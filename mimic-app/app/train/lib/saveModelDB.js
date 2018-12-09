const connection = require('../../../db/connection');
const model = require('../../../db/model');

async function saveModelDB(location) {
  try {
    model.models.db = await connection.connect();
    await model.models.create({ location });
    await connection.disconnect();
  } catch (err) {
    error = err;
    console.log('Error:', error);
  }
}

module.exports = saveModelDB;