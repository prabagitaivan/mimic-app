const fs = require('fs');
const formidable = require('formidable');
const wav = require('node-wav');
const cryptoRandomString = require('crypto-random-string');
const connection = require('../db/connection');
const model = require('../db/model');

async function router(address, port, filename, request) {
  let response;

  if (request.method === 'GET') {
    if (filename.toString().indexOf('\\loadSpeech') != -1) response = await loadSpeech();
  } else if (request.method === 'POST') {
    if (filename.toString().indexOf('\\generateSpeech') != -1) response = await generateSpeech(address, port, request);
  }

  return response;
}

async function loadSpeech() {
  let resultDB = [];
  let error;

  try {
    model.speechDatas.db = await connection.connect();
    resultDB = await model.speechDatas.find({}).select('name -_id').exec();
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

function generateSpeech(address, port, request) {
  const form = new formidable.IncomingForm();

  return new Promise(function (resolve) {
    form.parse(request, async function (err, fields, files) {
      const name = fields.name;
      const words = fields.words;

      let fileURL;
      let error;
      let resultDB = [];
      let buffer;

      try {
        model.speechDatas.db = await connection.connect();
        resultDB = await model.speechDatas.find({ name: name }).select('phonemes -_id').exec();
        await connection.disconnect();
      } catch (err) {
        error = err;
        console.log('Error:', error);

        resolve(JSON.stringify({ fileURL: fileURL, error: error }));
      }

      const phonemes = [];
      for (phoneme in resultDB[0].phonemes) phonemes.push(phoneme);

      const extractWord = [];
      for (i = 0; i < words.length; i++) {
        if (words[i] === ' ') {
          extractWord.push(' ');
        } else if (i + 3 <= words.length && phonemes.includes(words.substring(i, i + 3))) {
          extractWord.push(words.substring(i, i + 3));
          i = i + 2;
        } else if (i + 2 <= words.length && phonemes.includes(words.substring(i, i + 2))) {
          extractWord.push(words.substring(i, i + 2));
          i = i + 1;
        } else if (phonemes.includes(words.substring(i, i + 1))) {
          extractWord.push(words.substring(i, i + 1));
        } else {
          error = words[i] + ' is not found or registered from the speech data. ' +
            'Registered phonemes : ' + phonemes;
          console.log('Error:', error);

          resolve(JSON.stringify({ fileURL: fileURL, error: error }));
        }
      }

      const sampleRate = 16000;
      const channelData = [new Float32Array(0)];
      for (i = 0; i < extractWord.length; i++) {
        const prevFreq = channelData[0];
        const offset = channelData[0].length;

        let nextFreq;
        if (extractWord[i] === ' ') {
          nextFreq = new Float32Array(sampleRate).map(() => 0);
        } else {
          buffer = fs.readFileSync(resultDB[0].phonemes[extractWord[i]]);
          nextFreq = wav.decode(buffer).channelData[0].slice(0, sampleRate);
        }

        const freq = new Float32Array(sampleRate + offset);
        freq.set(prevFreq);
        freq.set(nextFreq, offset);

        channelData[0] = freq;
      }

      const dirData = '\\data\\';
      const dirGenerate = '\\generate\\';
      const fileName = 'upload_' + cryptoRandomString(32) + '.wav';
      const file = process.cwd() + dirData + dirGenerate + fileName;

      buffer = wav.encode(channelData, {sampleRate: sampleRate});
      fs.writeFileSync(file, new Buffer(buffer));

      fileURL = 'http://' + address + ':' + port + '/data/generate/' + fileName;

      console.log('fileURL:', fileURL);
      resolve(JSON.stringify({ fileURL: fileURL }));
    });
  });

}

module.exports = router;