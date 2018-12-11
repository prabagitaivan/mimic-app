const tf = require('@tensorflow/tfjs');

/**
 * `getData` convert corresponding `dataset` data based on `iteration`, 
 * `batch`, `time`, `freq` to tensorflow input.
 * 
 * Define tensorflow input shape from `batch`, `time`, and `freq`.
 * Define tensorflow input data convert it by rearrange the data inside `dataset` based on
 * `batch`, `iteration`, `time`, and `freq`. Then it return as 4d tensor.
 */
function getData(dataset, iteration, batch, time, freq) {
  const data = new Float32Array(batch * time * freq);
  const shape = [batch, time, freq, 1]; // 1 because of B/W color.

  for (j = 0; j < batch; j++) {
    let spectogram;

    if (iteration + j >= dataset.length) spectogram = dataset[(iteration + j) % dataset.length].data;
    else spectogram = dataset[iteration + j].data;

    for (k = 0; k < time; k++) {
      const melFreq = spectogram[k];
      const offset = j * freq * time + k * freq;

      data.set(melFreq, offset);
    }
  }

  tf.tensor4d(data, shape).print();
  return tf.tensor4d(data, shape);
}

/**
 * `getLabel` convert corresponding `dataset` label based on `iteration`, 
 * `batch` to tensorflow output.
 * 
 * Define tensorflow output shape from `batch`, and `labels.length`.
 * Define tensorflow output data convert it by define array from `labels` based on
 * `batch`, `iteration`, and `dataset`. Then it return as 2d tensor.
 */
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

// export `getData` and `getLabel` functions.
module.exports = {
  getData,
  getLabel
}