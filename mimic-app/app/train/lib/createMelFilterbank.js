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

// export `createMelFilterbank` function.
module.exports = createMelFilterbank;
