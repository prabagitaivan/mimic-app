const fs = require('fs');
const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');
const cryptoRandomString = require('crypto-random-string');
const saveModelDB = require('./lib/saveModelDB');
const nextBatch = require('./lib/nextBatch');

// load all data to `dataset`.
const dataset = require('./lib/loadData');

// define input and output tensorflow shape.
const time = dataset.datatrain[0].data.length;
const freq = dataset.datatrain[0].data[0].length;
const inputShape = [time, freq, 1];
const outputShape = dataset.labels.length;

const model = require('./model')(inputShape, outputShape); // load tensorflow model to `model`.
const batch = 32; // n inputs at the same time to be trained.
const epochs = 16; // n times the batches to be trained.
const trainIteration = 1500; // n times the train iteration.
const testIteration = 300; // Every n times in `trainIteration` the `model` is tested.

// define all test input and output from `dataset.datatest` to `testData` and `testLabel` for prediction.
const testData = nextBatch.getData(dataset.datatest, i, dataset.datatest.length, time, freq);
const testLabel = nextBatch.getLabel(dataset.labels, dataset.datatest, i, dataset.datatest.length);

const loss = [];
const accuracy = [];

/**
 * `train` train the `model` to fit the `dataset.datatrain` and validate the `model` on 
 * `dataset.datavalidation` data by its loss and accuracy.
 * 
 * Train iterate `trainIteration` times and test every `testIteration` in `trainIteration`.
 * Every iteration `loss` and `accuracy` is printed. Every test is occured and the last iteration, 
 * `confusionMatrix` is printed, `model` is saved, the saved model location is saved to MongoDB,
 * `loss` and `accuration` is saved as csv.
 */
async function train() {
  for (i = 0; i < trainIteration; i++) {
    // define train input and output from `dataset.datatrain` and validation from `dataset.datavalidation`.
    const batchData = nextBatch.getData(dataset.datatrain, i, batch, time, freq);
    const batchLabel = nextBatch.getLabel(dataset.labels, dataset.datatrain, i, batch);
    const batchValidation = nextBatch.getData(dataset.datavalidation, i, batch, time, freq);

    // train the model and get `loss` and `accuracy`. 
    const history = await model.fit(
      batchData,
      batchLabel,
      { batchSize: batch, validationData: batchValidation, epochs: epochs, verbose: 0 }
    );
    loss.push(history.history.loss[0].toFixed(10));
    accuracy.push(history.history.acc[0].toFixed(5));

    console.log(new Date().toISOString() + ' | Step ' + (i + 1) + ' | accuracy: ' + accuracy[i] + ' | loss: ' + loss[i]);

    // check if it is n `testIteration`.
    if ((i !== 0 && i % testIteration === 0) || (i + 1 === trainIteration)) {
      // test the model and show `confusionMatrix` the test result.
      const labels = tf.argMax(testLabel, 1);
      const predictions = tf.argMax(model.predict(testData), 1);
      const confusionMatrix = tf.math.confusionMatrix(labels, predictions, dataset.labels.length);

      console.log(new Date().toISOString() + ' | Step ' + (i + 1) + ' | test - confusion matrix:\n' + confusionMatrix);

      const location = process.cwd() + '/data/train/model/' + cryptoRandomString(32);
      const locationURL = 'file:///' + location.split(':\\')[1].replace(/\\/g, '/');;

      // save `loss`, `accuracy`, `confusionMatrix` and `model`.
      fs.writeFileSync(process.cwd() + '/data/train/loss.csv', loss);
      fs.writeFileSync(process.cwd() + '/data/train/accuracy.csv', accuracy);
      fs.appendFileSync(process.cwd() + '/data/train/confMatrix', confusionMatrix + ' Step ' + (i + 1) + '\n');
      await model.save(locationURL);
      await saveModelDB(locationURL);
    }
  }
};

// execute `train`.
train();