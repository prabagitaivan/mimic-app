const fs = require('fs');
const tf = require('@tensorflow/tfjs-node/node_modules/@tensorflow/tfjs');
require('@tensorflow/tfjs-node');

async function train() {
  const batch = 5;
  const epochs = 10;
  const trainIteration = 1500;
  const testIteration = 400;

  const dataset = require('./loadData');

  const time = dataset.datatrain[0].data.length;
  const freq = dataset.datatrain[0].data[0].length;
  const inputShape = [time, freq, 1];
  const outputShape = dataset.labels.length;

  const model = require('./model')(inputShape, outputShape);
  const nextBatch = require('./nextBatch');

  const batchTestData = nextBatch.getData(dataset.datatest, i, dataset.datatest.length, time, freq);
  const batchTestLabel = nextBatch.getLabel(dataset.labels, dataset.datatest, i, dataset.datatest.length);

  const loss = [];
  const accuracy = [];

  for (i = 0; i < trainIteration; i++) {
    const batchData = nextBatch.getData(dataset.datatrain, i, batch, time, freq);
    const batchLabel = nextBatch.getLabel(dataset.labels, dataset.datatrain, i, batch);
    const batchValidation = nextBatch.getData(dataset.datavalidation, i, batch, time, freq);

    const history = await model.fit(
      batchData,
      batchLabel,
      { batchSize: batch, validationData: batchValidation, epochs: epochs, verbose: 0 }
    );

    loss.push(history.history.loss[0].toFixed(10));
    accuracy.push(history.history.acc[0].toFixed(10));

    console.log(new Date().toISOString() + ' | Step ' + (i + 1) + ' | accuracy: ' + accuracy[i] + ' | loss: ' + loss[i]);

    if ((i !== 0 && i % testIteration === 0)
      || (i + 1 === trainIteration)) {
      const labels = tf.argMax(batchTestLabel, 1);
      const predictions = tf.argMax(model.predict(batchTestData), 1);
      const confusionMatrix = tf.math.confusionMatrix(labels, predictions, dataset.labels.length);

      console.log(new Date().toISOString() + ' | Step ' + (i + 1) + ' | test - confusion matrix: ' + confusionMatrix);

      if (i + 1 === trainIteration){
        await model.save('file://../../data/train/model/trainedModelFinal');
        fs.writeFileSync('../../data/train/loss.csv', loss);
        fs.writeFileSync('../../data/train/accuracy.csv', accuracy);
      } else {
        await model.save('file://../../data/train/model/trainedModel-' + (i / testIteration));
      }
    }
  }
};

train();