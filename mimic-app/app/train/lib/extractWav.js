const fs = require('fs');
const wav = require('node-wav');
const fft = require('fourier-transform');

const fftSize = 256;
const melCount = 40;
const lowHz = 300;
const highHz = 8000;
const sampleRate = 16000;
const frameSize = 25 / 1000 * sampleRate;
const frameShift = 10 / 1000 * sampleRate;

const mfcc = require('node-mfcc/src/mfcc').construct(fftSize, melCount, lowHz, highHz, sampleRate);

function extractWav(file, label) {
  const sample = wav.decode(fs.readFileSync(process.cwd() + '/data/collect/' + label + '/' + file)).channelData[0];

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

  return { data: extractedSample, label };
}

module.exports = extractWav;