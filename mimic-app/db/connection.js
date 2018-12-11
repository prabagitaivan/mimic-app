var mongoose = require('mongoose');

var connection;

/**
 * `connect` establish connection to mongodb mimic_speech database on localhost.
 * 
 * Establised connection is saved in `connection`.
 */
async function connect() {
  connection = await mongoose.connect('mongodb://localhost/mimic_speech', { useNewUrlParser: true });
  return connection;
};

/**
 * `disconnect` close established `connection` to mongodb.
 */
async function disconnect() {
  await connection.disconnect();
}

// export `connect` and `disconnect` functions.
module.exports = {
  connect,
  disconnect
};