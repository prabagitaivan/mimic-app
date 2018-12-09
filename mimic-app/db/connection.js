var mongoose = require('mongoose');

var connection;

async function connect() {
  connection = await mongoose.connect('mongodb://localhost/mimic_speech', { useNewUrlParser: true });
  return connection;
};

async function disconnect() {
  await connection.disconnect();
}

module.exports = {
  connect,
  disconnect
};