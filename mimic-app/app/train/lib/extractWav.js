const fs = require('fs');
const wav = require('node-wav');
const fft = require('fourier-transform');

const sampleRate = 16000;
const frameSize = 25 / 1000 * sampleRate; // 400
const frameShift = 10 / 1000 * sampleRate; // 160
const fftSize = 256; // based on the next power of 2 from 400 -> 512 as the input.
const melCount = 40;
const lowHz = 300;
const highHz = 8000;

const mfcc = require('node-mfcc/src/mfcc').construct(fftSize, melCount, lowHz, highHz, sampleRate);

/**
 * `extractWav` decode wav based on `file` and `label` location, frame it and extract by FFT and MFCC.
 * 
 * Return JSON of extracted sample as `data` and `label`.
 */
function extractWav(file, label) {
  // decode wav.
  const sample = wav.decode(fs.readFileSync(process.cwd() + '/data/collect/' + label + '/' + file)).channelData[0];

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

  return { data: extractedSample, label };
}

// export `extractWav` function.
module.exports = extractWav;