const fs = require('fs');
const shuffle = require('shuffle-array');
const extractWav = require('./extractWav');

const labels = ['a', 'i', 't', 'na', 'ma', 'mu', 'di', 'ri', 'ku', 'kan'];
let loadAll = [];

for (i = 0; i < labels.length; i++) {
  console.log(new Date().toISOString() + ' | Step ' + (i + 1) + ' | Load files from label: ' + labels[i]);
  const files = (fs.readdirSync('../../data/collect/' + labels[i]));

  for (j = 0; j < files.length; j++) {
    const data = {
      file: files[j],
      label: labels[i]
    };

    loadAll.push(data);
  }
}

const datatrain = [];
const datavalidation = [];
const datatest = [];

const validation = Math.floor(10 / 100 * loadAll.length);
const test = Math.floor(10 / 100 * loadAll.length);
const train = loadAll.length - validation - test;

loadAll = shuffle(loadAll);
let lastSpectogram;
for (k = 0; k < loadAll.length; k++) {
  const spectogram = extractWav(loadAll[k].file, loadAll[k].label);
  if (k !== 0 && lastSpectogram !== 'undefined'
    && lastSpectogram.data.length !== spectogram.data.length) {
    console.log(loadAll[k - 1].file + ' (label : ' + loadAll[k - 1].label + ')' +
      ' is different with data [time] ' +
      loadAll[k].file + ' (label : ' + loadAll[k].label + '). ' +
      'Please check again. Default time is 1 second. Process exiting.');
    process.exit();
  } else {
    if (k < train) datatrain.push(spectogram);
    else if (k < train + validation) datavalidation.push(spectogram);
    else if (k < train + validation + test) datatest.push(spectogram);
  }

  lastSpectogram = spectogram;
  console.log(new Date().toISOString() + ' | Step ' + (k + 1) + ' | Extracting wav: ' + loadAll[k].file);
}

const dataset = { labels, datatrain, datavalidation, datatest }
module.exports = dataset;