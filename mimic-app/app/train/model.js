const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');

function modelML(input, output) {
  const model = tf.sequential();
  model.add(tf.layers.conv2d({ inputShape: input, filters: 8, kernelSize: [4, 2], activation: 'relu' }));
  model.add(tf.layers.maxPooling2d({ poolSize: [2, 1], strides: [2, 1] }));
  model.add(tf.layers.conv2d({ filters: 32, kernelSize: [4, 2], activation: 'relu' }));
  model.add(tf.layers.maxPooling2d({ poolSize: [2, 1], strides: [2, 1] }));
  model.add(tf.layers.conv2d({ filters: 32, kernelSize: [4, 3], activation: 'relu' }));
  model.add(tf.layers.maxPooling2d({ poolSize: [2, 2], strides: [2, 2] }));
  model.add(tf.layers.conv2d({ filters: 32, kernelSize: [4, 2], activation: 'relu' }));
  model.add(tf.layers.maxPooling2d({ poolSize: [2, 2], strides: [1, 2] }));
  model.add(tf.layers.flatten({}));
  model.add(tf.layers.dropout({ rate: 0.25 }));
  model.add(tf.layers.dense({ units: 2000, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.5 }));
  model.add(tf.layers.dense({ units: output, activation: 'softmax' }));

  model.compile({
    loss: 'categoricalCrossentropy',
    optimizer: tf.train.sgd(0.0025),
    metrics: ['accuracy']
  });

  return model;
}

module.exports = modelML;