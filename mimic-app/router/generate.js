const fs = require('fs');
const formidable = require('formidable');
const wav = require('node-wav');
const cryptoRandomString = require('crypto-random-string');
const connection = require('../db/connection');
const model = require('../db/model');

/**
 * `loadSpeech` load all registered name from MongoDB `speecDatas` collection.
 * 
 * Return the array of name as `data` and `error` message if nothing is found or
 * connection error.
 */
async function loadSpeech() {
  let resultDB = [];
  let error;

  try {
    model.speechDatas.db = await connection.connect();
    resultDB = await model.speechDatas.find({}).select('name -_id -__v').exec();
    await connection.disconnect();

    if (resultDB.length === 0) {
      error = 'No speech data found.';
      console.log('Error:', error);
    }
  } catch (err) {
    error = err;
    console.log('Error:', error);
  }

  const data = resultDB.map((data) => data.name);

  console.log('speechData:', data);
  return JSON.stringify({ speechData: data, error: error });
}

/**
 * `generateSpeech` load registered phonemes from MongoDB `speecDatas` collection based on `name`.
 * Extract `words` as `extractWord`. Decode all coresponding `extractWord` based on the database result.
 * Combine them and encode to wav file and take its `fileURL` location.
 *  
 * Return the url as `fileURL` and `error` message if connection error or unregistered phoneme is found.
 */
function generateSpeech(address, port, request) {
  const form = new formidable.IncomingForm();

  return new Promise(function (resolve) {
    form.parse(request, async function (err, fields, files) {
      // take `name` and `words` data from POST request. 
      const name = fields.name;
      const words = fields.words;

      let fileURL;
      let error;
      let resultDB = {};
      let buffer;

      // load registered phonemes from MongoDB.
      try {
        model.speechDatas.db = await connection.connect();
        resultDB = await model.speechDatas.findOne({ name: name }).select('phonemes -_id -__v').exec();
        await connection.disconnect();
      } catch (err) { // return if connection error is occured.
        error = err;
        console.log('Error:', error);

        resolve(JSON.stringify({ fileURL: fileURL, error: error }));
      }

      // take just the phonemes from `resultDB`.
      const phonemes = [];
      for (phoneme in resultDB.phonemes) phonemes.push(phoneme);

      // extract the `words`.
      const extractWord = [];
      for (i = 0; i < words.length; i++) {
        if (words[i] === ' ') { // check if it is space.
          extractWord.push(' ');
        } else if (i + 3 <= words.length && phonemes.includes(words.substring(i, i + 3))) { // check if it the next 3 char is in `phonemes`. 
          extractWord.push(words.substring(i, i + 3));
          i = i + 2;
        } else if (i + 2 <= words.length && phonemes.includes(words.substring(i, i + 2))) { // check if it the next 2 char is in `phonemes`. 
          extractWord.push(words.substring(i, i + 2));
          i = i + 1;
        } else if (phonemes.includes(words.substring(i, i + 1))) { // check if it the next char is in `phonemes`. 
          extractWord.push(words.substring(i, i + 1));
        } else { // return if unregistered phoneme is found.
          error = words[i] + ' is not found or registered from the speech data. ' +
            'Registered ' + name + ' phonemes : ' + phonemes;
          console.log('Error:', error);

          resolve(JSON.stringify({ fileURL: fileURL, error: error }));
        }
      }

      // combine each `extractWord` into 1 `channelData`.
      const sampleRate = 16000;
      const channelData = [new Float32Array(0)];
      // iterate each `extractWord`.
      for (i = 0; i < extractWord.length; i++) {
        const prevAmpli = channelData[0];
        const offset = channelData[0].length;

        let nextAmpli;
        if (extractWord[i] === ' ') { // if space it fill the `nextAmpli` with 0 `sampleRate` times.
          nextAmpli = new Float32Array(sampleRate).map(() => 0);
        } else { // else it fill from the decode result based on `resultDB` and corresponding `extractWord`.
          buffer = fs.readFileSync(resultDB.phonemes[extractWord[i]]);
          nextAmpli = wav.decode(buffer).channelData[0].slice(0, sampleRate);
        }

        // arrange the ampli and redefined the `channelData`.
        const ampli = new Float32Array(sampleRate + offset);
        ampli.set(prevAmpli);
        ampli.set(nextAmpli, offset);
        channelData[0] = ampli;
      }

      // define upload directory.
      const dirData = '\\data\\';
      const dirGenerate = '\\generate\\';
      const fileName = 'upload_' + cryptoRandomString(32) + '.wav';
      const file = process.cwd() + dirData + dirGenerate + fileName;

      // encode wav based on `channelData` and `sampleRate`
      buffer = wav.encode(channelData, { sampleRate: sampleRate });
      fs.writeFileSync(file, Buffer.from(buffer));

      // return the file url as `fileURL`.
      fileURL = 'http://' + address + ':' + port + '/data/generate/' + fileName;
      console.log('fileURL:', fileURL);
      resolve(JSON.stringify({ fileURL: fileURL }));
    });
  });

}

/**
 * `router` handle all mimic app generate section request, each response corresponding to each request.
 * There are 2 type request categorized by mimic app identify section, `loadSpeech` and `generateSpeech`. 
 * When the request doesn't match anything it return nothing.
 */
async function router(address, port, filename, request) {
  let response;

  if (request.method === 'GET') {
    if (filename.toString().indexOf('\\loadSpeech') != -1) response = await loadSpeech();
  } else if (request.method === 'POST') {
    if (filename.toString().indexOf('\\generateSpeech') != -1) response = await generateSpeech(address, port, request);
  }

  return response;
}

// export `router` functions.
module.exports = router;