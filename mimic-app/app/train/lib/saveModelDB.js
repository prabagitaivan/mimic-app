const connection = require('../../../db/connection');
const model = require('../../../db/model');

/**
 * `saveModelDB` save `location` to `models` collection in mimic_speech database in MongoDB.
 */
async function saveModelDB(location) {
  try {
    model.models.db = await connection.connect();
    await model.models.create({ location });
    await connection.disconnect();
  } catch (err) {
    error = err.errmsg;
    console.log('Error:', error);
  }
}

// export `saveModelDB` function.
module.exports = saveModelDB;