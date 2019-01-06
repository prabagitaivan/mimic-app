const fs = require('fs');
const wav = require('node-wav');
const fft = require('fft-js');
const dct = require('dct');

const preEmphasis = 0;
const sampleRate = 16000;
const frameSize = 25 / 1000 * sampleRate; // 400
const frameShift = 10 / 1000 * sampleRate; // 160
const window = 'hamming';
const fftSize = 512; // based on the next power of 2 from 400 -> 512.
const lowFreq = 300;
const highFreq = 8000;
const melFilter = 40;

/**
 * `extractWav` decode wav based on `file` and `label` location, extract the file using MFCC.
 * 
 * Return JSON of extracted sample as `data` and `label`.
 */
function extractWav(file, label) {
  // decode wav.
  let sample;
  const sample = wav.decode(fs.readFileSync(process.cwd() + '/data/collect/' + label + '/' + file)).channelData[0];

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
  if (window === 'hamming') {
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
    new Float32Array(frame.map(sample => Math.pow(Math.abs(sample), 2) / fftSize))
  );

  // calculate mel filterbank and dot product with the sample.
  let filSample = [];
  let fbank = require('./createMelFilterbank')(lowFreq, highFreq, melFilter, fftSize, sampleRate);
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

  return { data: dctSample, label };
}

// export `extractWav` function.
module.exports = extractWav;