var server = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');
const wavDecoder = require("wav-decoder");
const wavEncoder = require("wav-encoder");
var formidable = require('formidable');
var util = require('util');
var connection = require('./db/connection');
var model = require('./db/model');

var port = 80;

function serverHandler(request, response) {
  var uri = url.parse(request.url).pathname;
  var filename = path.join(process.cwd(), uri);

  if (filename && filename.toString().indexOf('\\uploadFile') != -1
    && request.method.toLowerCase() == 'post') {
    uploadFile(request, response);
    return;
  }

  if (filename && filename.toString().indexOf('\\loadSpeechData') != -1
    && request.method.toLowerCase() == 'get') {
    loadSpeechData(request, response);
    return;
  }

  if (filename && filename.toString().indexOf('\\generateSpeech') != -1
    && request.method.toLowerCase() == 'post') {
    generateSpeech(request, response);
    return;
  }

  fs.exists(filename, function (exists) {
    if (!exists) {
      response.writeHead(404);
      response.write('404 Not Found: ' + filename + '\n');
      response.end();
      return;
    }

    fs.readFile(filename, 'binary', function (err, file) {
      if (err) {
        response.writeHead(500);
        response.write(err + '\n');
        response.end();
        return;
      }

      response.writeHead(200);
      response.write(file, 'binary');
      response.end();
    });
  });
}

var app;

app = server.createServer(serverHandler);

app = app.listen(port, process.env.IP || "0.0.0.0", function () {
  var addr = app.address();

  if (addr.address == '0.0.0.0') {
    addr.address = 'localhost';
  }

  app.address = addr.address;

  console.log("Server listening at", 'http://' + addr.address + ":" + addr.port + '/home.html');
});

function uploadFile(request, response) {
  var form = new formidable.IncomingForm();
  var dir = '\\upload\\';

  form.uploadDir = __dirname + dir;
  form.keepExtensions = true;
  form.maxFieldsSize = 10 * 1024 * 1024;
  form.maxFields = 1000;
  form.multiples = false;

  form.parse(request, function (err, fields, files) {
    var file = util.inspect(files);

    response.writeHead(200);

    var fileName = file.split('path:')[1].split('\',')[0].split(dir)[1].toString().replace(/\\/g, '').replace(/\//g, '');
    var fileURL = 'http://' + app.address + ':' + port + '/upload/' + fileName;

    console.log('fileURL:', fileURL);
    response.write(JSON.stringify({ fileURL: fileURL }));
    response.end();
  });
}

async function loadSpeechData(request, response) {
  var result = [];
  var error;

  try {
    model.speechDatas.db = await connection.connect();
    result = await model.speechDatas.find({}).select('name -_id').exec();

    if (result.length === 0) {
      error = 'No speech data found.';
      console.log('Error:', error);
    }

    connection.disconnect();
  } catch (err) {
    error = err;
    console.log('Error:', error);
  }

  response.writeHead(200);
  console.log('speechDatas:', result);
  response.write(JSON.stringify({ speechDatas: result, error: error }));
  response.end();
}

function generateSpeech(request, response) {
  var form = new formidable.IncomingForm();

  form.parse(request, async function (err, fields, files) {
    var name = fields.name;
    var words = fields.words;

    var fileURL;
    var error;
    var result = [];

    try {
      model.speechDatas.db = await connection.connect();
      result = await model.speechDatas.find({ name: name }).select('phonemes -_id').exec();

      connection.disconnect();
    } catch (err) {
      error = err;
      console.log('Error:', error);

      response.writeHead(200);
      response.write(JSON.stringify({ fileURL: fileURL, error: error }));
      response.end();
      return;
    }

    var phonemes = [];
    for (var phoneme in result[0].phonemes) {
      phonemes.push(phoneme);
    }

    var wordsPhonemes = [];
    for (i = 0; i < words.length; i++) {
      if (words[i] === ' ') {
        wordsPhonemes.push(' ');
      } else if (i + 3 <= words.length 
          && phonemes.includes(words.substring(i, i + 3))) {
        wordsPhonemes.push(words.substring(i, i + 3));
        i = i + 2;
      } else if (i + 2 <= words.length 
          && phonemes.includes(words.substring(i, i + 2))) {
        wordsPhonemes.push(words.substring(i, i + 2));
        i = i + 1;
      } else if (phonemes.includes(words.substring(i, i + 1))) {
        wordsPhonemes.push(words.substring(i, i + 1));
      } else {
        error = words[i] + ' is not found or registered from the speech data. ' +
          'Registered phonemes : ' + phonemes
        console.log('Error:', error);

        response.writeHead(200);
        response.write(JSON.stringify({ fileURL: fileURL, error: error }));
        response.end();
        return;
      }
    }

    var generateAudio = {
      sampleRate: 48000,
      channelData: [new Float32Array(0)]
    };

    for (i = 0; i < wordsPhonemes.length; i++) {
      var generateAudioData = generateAudio.channelData[0];
      var generateAudioLength = generateAudio.channelData[0].length;

      if (wordsPhonemes[i] === ' ') {
        var inData = new Float32Array(generateAudio.sampleRate).map(() => 0);
        var inLength = generateAudio.sampleRate;
      } else {
        var buffer = fs.readFileSync(result[0].phonemes[wordsPhonemes[i]]);
        var decode = wavDecoder.decode.sync(buffer);

        var inData = decode.channelData[0];
        var inLength = decode.channelData[0].length;
      }

      var channelData = new Float32Array(generateAudioLength + inLength);
      channelData.set(generateAudioData);
      channelData.set(inData, generateAudioLength);
      generateAudio.channelData[0] = channelData;
    }

    var buffer = wavEncoder.encode.sync(generateAudio);
    var dir = '\\generate\\';
    var fileName = generateRandomString() + '.wav';
    var file = __dirname + dir + fileName;
    fs.writeFileSync(file, new Buffer(buffer));
    
    var fileURL = 'http://' + app.address + ':' + port + '/generate/' + fileName;

    console.log('fileURL:', fileURL);
    response.write(JSON.stringify({ fileURL: fileURL }));
    response.end();
  });
}

function generateRandomString() {
  if (window.crypto) {
    var a = window.crypto.getRandomValues(new Uint32Array(3));
    var token = '';

    for (var i = 0, l = a.length; i < l; i++) {
      token += a[i].toString(36);
    }

    return token;
  } else {
    return (Math.random() * new Date().getTime()).toString(36).replace(/\./g, '');
  }
}