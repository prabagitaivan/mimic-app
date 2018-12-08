const tf = require('@tensorflow/tfjs-node/node_modules/@tensorflow/tfjs');

function getData(dataset, iteration, batch, time, freq) {
  const data = new Float32Array(batch * time * freq);
  const shape = [batch, time, freq, 1];

  for (j = 0; j < batch; j++) {
    let spectogram;

    if (iteration + j >= dataset.length)  spectogram = dataset[(iteration + j) % dataset.length].data;
    else spectogram = dataset[iteration + j].data;

    for (k = 0; k < time; k++) {
      const melFreq = spectogram[k];
      const offset = j * freq * time + k * freq;

      data.set(melFreq, offset);
    }
  }

  return tf.tensor4d(data, shape);
}

function getLabel(labels, dataset, iteration, batch) {
  const data = [];
  const shape = [batch, labels.length];

  for (j = 0; j < batch; j++) {
    let label;
    
    if (iteration + j >= dataset.length) label = dataset[(iteration + j) % dataset.length].label;
    else label = dataset[iteration + j].label;

    for (k = 0; k < labels.length; k++) {
      if (label === labels[k]) data.push(1);
      else data.push(0);
    }
  }

  return tf.tensor2d(data, shape);
}

module.exports = {
  getData,
  getLabel
}