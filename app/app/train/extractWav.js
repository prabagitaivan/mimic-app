const fs = require('fs');
const wav = require('node-wav');
// const mfcc = require('./mfcc').construct(256, 40, 300, 8000, 16000);
const mfcc = require('node-mfcc/src/mfcc').construct(256, 40, 300, 8000, 16000);
const fft = require('fourier-transform');

function extractWav(file, label) {
  const sample = wav.decode(fs.readFileSync('../../data/collect/' + label + '/' + file)).channelData[0];
  const frameSize = 25 / 1000 * 16000;
  const frameShift = 10 / 1000 * 16000;

  const frameSample = [];
  for (i = 0; i <= sample.length - frameSize; i = i + frameShift) {
    const frame = new Float32Array(512);
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

  return { data: extractedSample, label };
}

module.exports = extractWav;