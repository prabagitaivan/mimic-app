const fs = require('fs');
const util = require('util');
const formidable = require('formidable');
const fft = require('fourier-transform');
const wav = require('node-wav');
const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');
const connection = require('../db/connection');
const model = require('../db/model');

const labels = ['a', 'i', 't', 'na', 'ma', 'mu', 'di', 'ri', 'ku', 'kan'];

async function router(address, port, filename, request) {
  let response;

  if (request.method === 'POST') {
    if (filename.toString().indexOf('\\uploadSpeech') != -1) response = await uploadSpeech(address, port, request);
    if (filename.toString().indexOf('\\identifySpeech') != -1) response = await identifySpeech(address, port, request);
  }

  return response;
}

function uploadSpeech(address, port, request) {
  const dirData = '\\data\\';
  const dirSpeech = '\\speech\\';

  const form = new formidable.IncomingForm();
  form.uploadDir = process.cwd() + dirData + dirSpeech;
  form.keepExtensions = true;
  form.maxFieldsSize = 10 * 1024 * 1024;
  form.maxFields = 1000;
  form.multiples = false;

  return new Promise(function (resolve) {
    form.parse(request, function (err, fields, files) {
      const file = util.inspect(files);

      const fileName = file.split('path:')[1].split('\',')[0].split(dirData)[1].split(dirSpeech)[1].toString().replace(/\\/g, '').replace(/\//g, '');
      const fileURL = 'http://' + address + ':' + port + '/data/speech/' + fileName;
      const filePath = files.file.path;

      console.log('fileURL: ', fileURL);
      console.log('filePath: ', filePath);
      resolve(JSON.stringify({ fileURL: fileURL, filePath: filePath }));
    });
  });
}

function identifySpeech(request) {
  const form = new formidable.IncomingForm();

  return new Promise(function (resolve) {
    form.parse(request, async function (err, fields, files) {
      const name = fields.name;
      const filePath = fields.filePath;

      let status;
      let resultDB = {};

      try {
        model.models.db = await connection.connect();
        resultDB = await model.models.findOne({}).sort({ createAt: -1 }).select('location -_id').exec();
        await connection.disconnect();

        if (typeof resultDB.location === 'undefined') {
          status = 'No train model found.';
          console.log('Status:', status);

          resolve(JSON.stringify({ status: status }));
        }
      } catch (err) {
        status = err;
        console.log('Status:', error);

        resolve(JSON.stringify({ status: status }));
      }

      const locationURL = resultDB.location;
      const tfModel = await tf.loadModel(locationURL + '/model.json');
      const data = extractWav(filePath);

      const prediction = tfModel.predict(data).dataSync();
      let predictionLabel = 0;
      for (i = 0; i < prediction.length; i++) {
        if (prediction[predictionLabel] <= prediction[i]) predictionLabel = i;
      }

      const label = labels[predictionLabel]
      const labelData = prediction[predictionLabel]
      if (labelData < 0.75) {
        status = 'No phonemes matched.';
        console.log('Status:', status);

        resolve(JSON.stringify({ status: status }));
      } else {
        try {
          model.speechDatas.db = await connection.connect();
          resultDB = await model.speechDatas.findOne({ name: name }).select('phonemes -_id').exec();

          let updateData = {};
          if (resultDB === null) {
            updateData.name = name;
            updateData.phonemes = {};
            updateData.phonemes[label] = filePath
          }
          else {
            updateData = resultDB;
            updateData.phonemes[label] = filePath
          }
          await model.speechDatas.updateOne({ name: name }, updateData, { upsert: true });

          await connection.disconnect();
        } catch (err) {
          status = err;
          console.log('Status:', status);

          resolve(JSON.stringify({ status: status }));
        }

        status = 'Matched phoneme ' + label + '! Phoneme registered to ' + name + '.';
        console.log('Status:', status);

        resolve(JSON.stringify({ status: status }));
      }
    });
  });
}

function extractWav(filePath) {
  const fftSize = 256;
  const melCount = 40;
  const lowHz = 300;
  const highHz = 8000;
  const sampleRate = 16000;
  const frameSize = 25 / 1000 * sampleRate;
  const frameShift = 10 / 1000 * sampleRate;

  const mfcc = require('node-mfcc/src/mfcc').construct(fftSize, melCount, lowHz, highHz, sampleRate);

  // const sample = wav.decode(fs.readFileSync(filePath)).channelData[0];
  const sample = wav.decode(fs.readFileSync('C:\\Users\\Prabagita Ivan\\Desktop\\aaaa.wav')).channelData[0];

  const frameSample = [];
  for (i = 0; i <= sample.length - frameSize; i = i + frameShift) {
    const frame = new Float32Array(fftSize * 2);
    for (j = 0; j < frame.length; j++) {
      if (j < frameSize) frame[j] = sample[i + j];
      else frame[j] = 0;
    }
    frameSample.push(frame);
  }

  const extractedSample = [];
  for (i = 0; i < frameSample.length; i++) {
    const fftSample = fft(frameSample[i]);
    extractedSample.push(new Float32Array(mfcc(fftSample)));
  }

  const time = extractedSample.length;
  const freq = extractedSample[0].length;
  const data = new Float32Array(time * freq);
  const shape = [1, time, freq, 1];

  for (i = 0; i < time; i++) {
    const melFreq = extractedSample[i];
    const offset = i * freq;

    data.set(melFreq, offset);
  }

  return tf.tensor4d(data, shape);
}

module.exports = router;