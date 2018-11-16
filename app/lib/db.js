const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const db = async () => {
  let connection;

  if (typeof process.env.MONGO_URL !== 'undefined') {
    connection = await mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true },
      (err) => { console.log('MongoDB is not connected. Error:', err); });
  } else {
    console.log('No MongoDB URL to be connected.');
  }

  return connection;
};

module.exports = db;
