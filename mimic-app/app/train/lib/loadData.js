const fs = require('fs');
const shuffle = require('shuffle-array');
const extractWav = require('./extractWav');

const labels = ['a', 'i', 't', 'na', 'ma', 'mu', 'di', 'ri', 'ku', 'kan'];
const loadTrain = [];
const loadValidation = [];
const loadTest = [];

/**
 * `extractFiles` extract wav from loaded files as `load`, assigned to corresponding `data`.
 * 
 * Return array of extracted waves. Every iteration when extracting the loaded files is printed.
 * If incosistent data is met, the process stop and exit.
 */
function extractFiles(load, data, type) {
  const data = [];
  let lastSpectogram;

  // shuffle `load` to avoid overfitting model.
  load = shuffle(load);

  for (k = 0; k < load.length; k++) {
    const spectogram = extractWav(load[k].file, load[k].label);
    if (k !== 0 && lastSpectogram !== 'undefined'
      && lastSpectogram.data.length !== spectogram.data.length) {
      console.log(load[k - 1].file + ' (label : ' + load[k - 1].label + ')' +
        ' is different with data [time] ' +
        load[k].file + ' (label : ' + load[k].label + '). ' +
        'Please check again. Default time is 1 second. Process exiting.');
      process.exit();
    } else {
      data.push(spectogram);
    }

    lastSpectogram = spectogram;
    console.log(new Date().toISOString() + ' | Step ' + (k + 1) + ' | Extracting ' + type + ' Wav: ' + load[k].file);
  }

  return data;
}

// iterate each `labels` to load files. Every iteration when loading the files is printed.
for (i = 0; i < labels.length; i++) {
  console.log(new Date().toISOString() + ' | Step ' + (i + 1) + ' | Load files from label: ' + labels[i]);

  // shuffle `files` to avoid overfitting model.
  const files = shuffle(fs.readdirSync(process.cwd() + '/data/collect/' + labels[i]));

  // 80% train data, 10% validation data, 10% test data.
  const validation = Math.floor(10 / 100 * files.length);
  const test = Math.floor(10 / 100 * files.length);
  const train = files.length - validation - test;
  for (j = 0; j < files.length; j++) {
    const data = {
      file: files[j],
      label: labels[i]
    };

    if (j < train) loadTrain.push(data);
    else if (j < train + validation) loadValidation.push(data);
    else if (j < train + validation + test) loadTest.push(data);
  }
}

const datatrain = extractFiles(loadTrain, datatrain, 'Train');
const datavalidation = extractFiles(loadValidation, datavalidation, 'Validation');
const datatest = extractFiles(loadTest, datatest, 'Test');

// put `labels`, `datatrain`, `datavalidation`, `datatest` to JSON and export it.
const dataset = { labels, datatrain, datavalidation, datatest }
module.exports = dataset;