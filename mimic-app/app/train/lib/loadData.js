const fs = require('fs');
const shuffle = require('shuffle-array');
const extractWav = require('./extractWav');

const labels = ['a', 'i', 'na', 'ma', 'mu', 'di', 'ri', 'ku', 'kan', 'unknown'];
const loadTrain = [];
const loadValidation = [];
const loadTest = [];

/**
 * `extractFiles` extract wav from loaded files as `load`, assigned to corresponding `data`.
 * 
 * Return array of extracted waves. Every iteration when extracting the loaded files is printed.
 * If incosistent data is met, the process stop and exit.
 */
function extractFiles(load, type) {
  const data = [];
  let lastExtract;

  // shuffle `load` to avoid overfitting model.
  load = shuffle(load);

  for (l = 0; l < load.length; l++) {
    const extract = extractWav(load[l].file, load[l].label);
    if (l !== 0 && typeof lastExtract !== 'undefined' && lastExtract.data.length !== extract.data.length) {
      console.log(load[l - 1].file + ' (label : ' + load[l - 1].label + ')' +
        ' is different with data [time] ' +
        load[l].file + ' (label : ' + load[l].label + '). ' +
        'Please check again. Default time is 1 second. Process exiting.');
      process.exit();
    } else {
      data.push(extract);
    }

    lastExtract = extract;
    console.log(new Date().toISOString() + ' | Step ' + (l + 1) + ' | Extracting ' + type + ' Wav: ' + load[l].file);
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

const datatrain = extractFiles(loadTrain, 'Train');
const datavalidation = extractFiles(loadValidation, 'Validation');
const datatest = extractFiles(loadTest, 'Test');

// put `labels`, `datatrain`, `datavalidation`, `datatest` to JSON and export it.
const dataset = { labels, datatrain, datavalidation, datatest }
module.exports = dataset;