const fs = require('fs');
const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');
const cryptoRandomString = require('crypto-random-string');
const saveModelDB = require('./lib/saveModelDB');

const batch = 32;
const epochs = 16;
const trainIteration = 1500;
const testIteration = 300;

const dataset = require('./lib/loadData');

const time = dataset.datatrain[0].data.length;
const freq = dataset.datatrain[0].data[0].length;
const inputShape = [time, freq, 1];
const outputShape = dataset.labels.length;

const model = require('./model')(inputShape, outputShape);
const nextBatch = require('./lib/nextBatch');

const batchTestData = nextBatch.getData(dataset.datatest, i, dataset.datatest.length, time, freq);
const batchTestLabel = nextBatch.getLabel(dataset.labels, dataset.datatest, i, dataset.datatest.length);

const loss = [];
const accuracy = [];

async function train() {
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
    accuracy.push(history.history.acc[0].toFixed(5));

    console.log(new Date().toISOString() + ' | Step ' + (i + 1) + ' | accuracy: ' + accuracy[i] + ' | loss: ' + loss[i]);

    if ((i !== 0 && i % testIteration === 0)
      || (i + 1 === trainIteration)) {
      const labels = tf.argMax(batchTestLabel, 1);
      const predictions = tf.argMax(model.predict(batchTestData), 1);
      const confusionMatrix = tf.math.confusionMatrix(labels, predictions, dataset.labels.length);

      console.log(new Date().toISOString() + ' | Step ' + (i + 1) + ' | test - confusion matrix:\n' + confusionMatrix);

      const location = process.cwd() + '/data/train/model/' + cryptoRandomString(32);
      const locationURL = 'file:///' + location.split(':\\')[1].replace(/\\/g, '/');;

      fs.writeFileSync(process.cwd() + '/data/train/loss.csv', loss);
      fs.writeFileSync(process.cwd() + '/data/train/accuracy.csv', accuracy);
      fs.appendFileSync(process.cwd() + '/data/train/confMatrix', confusionMatrix + ' Step ' + (i + 1) + '\n');

      await model.save(locationURL);
      await saveModelDB(locationURL);
    }
  }
};

train();