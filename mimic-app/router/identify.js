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

/**
 * `extract` decode wav based on `filePath`, frame it, extract by FFT and MFCC and
 * convert it to tensorflow input shape.
 * 
 * Return 4d tensor.
 */
function extract(filePath) {
  const sampleRate = 16000;
  const frameSize = 25 / 1000 * sampleRate; // 400
  const frameShift = 10 / 1000 * sampleRate; // 160
  const fftSize = 256; // based on the next power of 2 from 400 -> 512 as the input.
  const melCount = 40;
  const lowHz = 300;
  const highHz = 8000;

  const mfcc = require('node-mfcc/src/mfcc').construct(fftSize, melCount, lowHz, highHz, sampleRate);

  // decode wav.
  const sample = wav.decode(fs.readFileSync(filePath)).channelData[0];

  // framing the sample.
  const frameSample = [];
  for (i = 0; i <= sample.length - frameSize; i = i + frameShift) {
    const frame = new Float32Array(fftSize * 2);
    for (j = 0; j < frame.length; j++) {
      if (j < frameSize) frame[j] = sample[i + j];
      else frame[j] = 0;
    }
    frameSample.push(frame);
  }

  // extract by FFT and MFCC.
  const extractedSample = [];
  for (i = 0; i < frameSample.length; i++) {
    const fftSample = fft(frameSample[i]);
    extractedSample.push(new Float32Array(mfcc(fftSample)));
  }

  // define tensorflow input shape.
  const time = extractedSample.length;
  const freq = extractedSample[0].length;
  const data = new Float32Array(time * freq);
  const shape = [1, time, freq, 1];

  // convert extracted wav to tensorflow input data.
  for (i = 0; i < time; i++) {
    const melFreq = extractedSample[i];
    const offset = i * freq;

    data.set(melFreq, offset);
  }

  // return 4d tensor. 
  return tf.tensor4d(data, shape);
}

/**
 * `uploadSpeech` upload file in the `request` based on defined directory and
 * then convert its path location to url.
 * 
 * Return the url and path location as `fileURL` and `filePath`.
 */
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

/**
 * `identifySpeech` load lastest saved trained model from MongoDB `models` collection.
 * Use it to identify the speech file from `filePath` by `extract` then feed it to `model`.
 * Matched speech will register the phoneme to corresponding `name` and update it on MongoDB.
 * 
 * Error connection will return message. Not found model will return message. Unsatisfied identification,
 * results below 0.75 (75%) from `model` will return message. None of those is occured will update the MongoDB
 * `speechDatas` collection on its `name` and identified phoneme `filePath` and return message. The returned 
 * message wheter just information or even error is return as `status`.
 */
function identifySpeech(request) {
  const form = new formidable.IncomingForm();

  return new Promise(function (resolve) {
    form.parse(request, async function (err, fields, files) {
      // take `name` and `filePath` data from POST request. 
      const name = fields.name;
      const filePath = fields.filePath;

      let status;
      let resultDB = {};

      // load model location from MongoDB.
      try {
        model.models.db = await connection.connect();
        resultDB = await model.models.findOne({}).sort({ createAt: -1 }).select('location -_id').exec();
        await connection.disconnect();

        // return if nothing is found.
        if (typeof resultDB.location === 'undefined') {
          status = 'No train model found.';
          console.log('Status:', status);

          resolve(JSON.stringify({ status: status }));
        }
      } catch (err) { // return if connection error is occured.
        status = err.errmsg;
        console.log('Status:', status);

        resolve(JSON.stringify({ status: status }));
      }

      // load the model as `tfModel` from model location and extract speech as `data` from `filePath`. 
      const locationURL = resultDB.location;
      const tfModel = await tf.loadModel(locationURL + '/model.json');
      const data = extract(filePath);

      // identify the speech and process data from it.
      const prediction = tfModel.predict(data).dataSync();
      let predictionLabel = 0;
      for (i = 0; i < prediction.length; i++) {
        if (prediction[predictionLabel] <= prediction[i]) predictionLabel = i;
      }
      const label = labels[predictionLabel]
      const labelData = prediction[predictionLabel]

      // return if result unsatisfied, below 75%.
      if (labelData < 0.75) {
        status = 'No phonemes matched.';
        console.log('Status:', status);

        resolve(JSON.stringify({ status: status }));
      } else {
        // find if `name` is already registered in MongoDB or not.
        try {
          model.speechDatas.db = await connection.connect();
          resultDB = await model.speechDatas.findOne({ name: name }).select('phonemes -_id').exec();

          // create the document if not found, update if found before update to MongoDB.
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
        } catch (err) { // return if connection error is occured.
          status = err.errmsg;
          console.log('Status:', status);

          resolve(JSON.stringify({ status: status }));
        }

        status = 'Matched phoneme ' + label + ' (' + (labelData.toFixed(2) / 1 * 100) + '%)! Phoneme registered to ' + name + '.';
        console.log('Status:', status);

        // return success identify speech information. 
        resolve(JSON.stringify({ status: status }));
      }
    });
  });
}

/**
 * `router` handle all mimic app identify section request, each response corresponding to each request.
 * There are 2 type request categorized by mimic app identify section, `uploadSpeech` and `identifySpeech`. 
 * When the request doesn't match anything it return nothing.
 */
async function router(address, port, filename, request) {
  let response;

  if (request.method === 'POST') {
    if (filename.toString().indexOf('\\uploadSpeech') != -1) response = await uploadSpeech(address, port, request);
    if (filename.toString().indexOf('\\identifySpeech') != -1) response = await identifySpeech(request);
  }

  return response;
}

// export `router` functions.
module.exports = router;