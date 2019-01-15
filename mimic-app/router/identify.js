const fs = require('fs');
const util = require('util');
const formidable = require('formidable');
const wav = require('node-wav');
const fft = require('fft-js');
const dct = require('dct');
const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');
const connection = require('../db/connection');
const model = require('../db/model');

const labels = ['a', 'i', 'na', 'ma', 'mu', 'di', 'ri', 'ku', 'kan', 'unknown'];

/**
 * `createMelFilterbank` create filterbank for extraction process.
 * If input parameters are incorrect, the process stop and exit.
 * 
 * Return the filterbank model.
 */
function createMelFilterbank(lowFreq, highFreq, nFilter, fftSize, sampleRate) {
  // parameter check.
  if (lowFreq < 0 || highFreq > sampleRate / 2) {
    console.log('Low frequency must more or equal 0' +
      ' and high frequency must less than or equal half of sample rate.' +
      ' Process exiting');
    process.exit();
  }

  // set filterbank start and end. 
  let lowMel = 2595 * Math.log10(1 + (lowFreq / 700));
  let highMel = 2595 * Math.log10(1 + (highFreq / 700));

  // Equally spaced in Mel scale.
  let mel = [];
  let step = (highMel - lowMel) / ((nFilter + 2) - 1);
  for (i = 0; i < nFilter + 2; i++) {
    mel.push(lowMel + (i * step));
  }

  // Convert back to frequency.
  let freq = [];
  freq = mel.map(x => 700 * (Math.pow(10, (x / 2595)) - 1));

  // Round frequencies to the nearest FFT bin.
  let bin = [];
  bin = freq.map(x => Math.floor(fftSize * x / sampleRate))

  // Model the filterbank.
  let fbank = [];
  for (i = 1; i < bin.length - 1; i++) { // nFilter
    let fLeft = bin[i - 1];
    let fCenter = bin[i];
    let fRight = bin[i + 1];

    let filter = new Float32Array(fftSize / 2);
    for (j = 0; j < filter.length; j++) {
      if (j < fLeft) filter[j] = 0;
      else if (j >= fLeft && j < fCenter) filter[j] = (j - fLeft) / (fCenter - fLeft);
      else if (j == fCenter) filter[j] = 1;
      else if (j <= fRight && j > fCenter) filter[j] = (fRight - j) / (fRight - fCenter);
      else if (j > fRight) filter[j] = 0;
    }
    fbank.push(filter);
  }

  return fbank;
}

/**
 * `extractAndConvert` decode wav based on `filePath`, frame it, extract the file using MFCC. and
 * convert it to tensorflow input shape.
 * 
 * Return 4d tensor.
 */
function extractAndConvert(filePath) {
  const preEmphasis = 0;
  const sampleRate = 16000;
  const frameSize = 25 / 1000 * sampleRate; // 400
  const frameShift = 10 / 1000 * sampleRate; // 160
  const window = '';
  const fftSize = 512; // based on the next power of 2 from 400 -> 512.
  const lowFreq = 300;
  const highFreq = 8000;
  const melFilter = 40;

  // decode wav.
  let sample;
  sample = wav.decode(fs.readFileSync(filePath)).channelData[0];

  // framing and windowing the sample.
  let preSample;
  if (preEmphasis !== 0) {
    preSample = new Float32Array(sample.length);
    for (i = 0; i < sample.length; i++) {
      if (i === 0) preSample[i] = sample[i];
      else preSample[i] = sample[i] - preEmphasis * sample[i - 1];
    }
  } else {
    preSample = sample;
  }
  let frameSample = [];
  for (i = 0; i < preSample.length; i = i + frameShift) {
    let frame = new Float32Array(frameSize);
    for (j = 0; j < frameSize; j++) {
      if (i + j < preSample.length) frame[j] = preSample[i + j];
      else frame[j] = 0;
    }
    frameSample.push(frame);
  }
  let winSample = [];
  if (window === 'hamming') { // windowing use hamming is waste because decoded wav have too many trailing zeros.
    winSample = frameSample.map(frame =>
      frame.map(sample => 0.54 - 0.46 * Math.cos((2 * Math.PI * sample) / (frameSize - 1)))
    );
  } else { // window === '';
    winSample = frameSample;
  }

  // fft and power spectrum.
  let prefftSample = [];
  let fftSample = [];
  let powSample = [];
  if (fftSize > frameSize) {
    for (i = 0; i < winSample.length; i++) {
      let frame = new Float32Array(fftSize);
      for (j = 0; j < fftSize; j++) {
        if (j < frameSize) frame[j] = winSample[i][j];
        else frame[j] = 0;
      }
      prefftSample.push(frame);
    }
  } else {
    prefftSample = winSample;
  }
  fftSample = prefftSample.map(frame => fft.util.fftMag(fft.fft(frame)));
  powSample = fftSample.map(frame =>
    // With to the power produce double the trailing zeros.
    // new Float32Array(frame.map(sample => Math.pow(Math.abs(sample), 2) / fftSize))
    new Float32Array(frame.map(sample => sample))
  );

  // calculate mel filterbank and dot product with the sample.
  let filSample = [];
  let fbank = createMelFilterbank(lowFreq, highFreq, melFilter, fftSize, sampleRate);
  let fbankTranspose = [];
  for (i = 0; i < fbank[0].length; i++) {
    let filter = new Float32Array(fbank.length);
    for (j = 0; j < fbank.length; j++) {
      filter[j] = fbank[j][i];
    }
    fbankTranspose.push(filter);
  }
  for (i = 0; i < powSample.length; i++) {
    let frame = new Float32Array(fbankTranspose[0].length);;
    for (j = 0; j < fbankTranspose[0].length; j++) {
      for (k = 0; k < powSample[i].length; k++) {
        frame[j] += powSample[i][k] * fbankTranspose[k][j];
      }
    }
    filSample.push(frame);
  }

  // logarithma the sample.
  let logSample = [];
  logSample = filSample.map(frame => frame.map(x => Math.log(1 + x)));

  // dct the sample and take 0 until 13.
  let dctSample = [];
  dctSample = logSample.map(frame => new Float32Array(dct(frame).slice(0, 13)));

  // define tensorflow input shape.
  const time = dctSample.length;
  const freq = dctSample[0].length;
  const data = new Float32Array(time * freq);
  const shape = [1, time, freq, 1];

  // convert extracted wav to tensorflow input data.
  for (i = 0; i < time; i++) {
    const melFreq = dctSample[i];
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
  const dirData = '\\data';
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
 * Use it to identify the speech file from `filePath` by `extractAndConvert` then feed it to `model`.
 * Matched speech will register the syllable to corresponding `name` and update it on MongoDB.
 * 
 * Error connection will return message. Not found model will return message. Unsatisfied identification or
 * results below 0.75 (75%) from `model` will return message. None of those is occured will update the MongoDB
 * `speechDatas` collection on its `name` and identified syllable `filePath` and return message. The returned 
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
      const data = extractAndConvert(filePath);

      // identify the speech and process data from it.
      const prediction = tfModel.predict(data).dataSync();
      let predictionLabel = 0;
      for (i = 0; i < prediction.length; i++) {
        if (prediction[predictionLabel] <= prediction[i]) predictionLabel = i;
      }
      const label = labels[predictionLabel]
      const labelData = prediction[predictionLabel]

      // return if result unsatisfied, below 75%.
      if (labelData < 0.75 || label === 'unknown') {
        status = 'No syllables matched.';
        console.log('Highest predictions ' + label + ' with ' + labelData + ' accuracy.');
        console.log('Status:', status);

        resolve(JSON.stringify({ status: status }));
      } else {
        // find if `name` is already registered in MongoDB or not.
        try {
          model.speechDatas.db = await connection.connect();
          resultDB = await model.speechDatas.findOne({ name: name }).select('syllables -_id').exec();

          // create the document if not found, update if found before update to MongoDB.
          let updateData = {};
          if (resultDB === null) {
            updateData.name = name;
            updateData.syllables = {};
            updateData.syllables[label] = filePath
          }
          else {
            updateData = resultDB;
            updateData.syllables[label] = filePath
          }
          await model.speechDatas.updateOne({ name: name }, updateData, { upsert: true });

          await connection.disconnect();
        } catch (err) { // return if connection error is occured.
          status = err.errmsg;
          console.log('Status:', status);

          resolve(JSON.stringify({ status: status }));
        }

        status = 'Matched syllable ' + label + ' (' + (labelData.toFixed(2) / 1 * 100) + '%)! syllable registered to ' + name + '.';
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