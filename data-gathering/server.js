var server = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');

var port = 80;

function serverHandler(request, response) {
  var uri = url.parse(request.url).pathname;
  var filename = path.join(process.cwd(), uri);
  var isWin = !!process.platform.match(/^win/);

  if (filename && filename.toString().indexOf(isWin ? '\\uploadData1' : '/uploadData1') != -1 && request.method.toLowerCase() == 'post') {
    uploadData(1, request, response);
    return;
  }

  if (filename && filename.toString().indexOf(isWin ? '\\uploadData2' : '/uploadData2') != -1 && request.method.toLowerCase() == 'post') {
    uploadData(2, request, response);
    return;
  }
  
  if (filename && filename.toString().indexOf(isWin ? '\\uploadData3' : '/uploadData3') != -1 && request.method.toLowerCase() == 'post') {
    uploadData(3, request, response);
    return;
  }

  if (filename && filename.toString().indexOf(isWin ? '\\uploadData4' : '/uploadData4') != -1 && request.method.toLowerCase() == 'post') {
    uploadData(4, request, response);
    return;
  }
  
  if (filename && filename.toString().indexOf(isWin ? '\\uploadData5' : '/uploadData5') != -1 && request.method.toLowerCase() == 'post') {
    uploadData(5, request, response);
    return;
  }
  
  if (filename && filename.toString().indexOf(isWin ? '\\uploadData6' : '/uploadData6') != -1 && request.method.toLowerCase() == 'post') {
    uploadData(6, request, response);
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

  console.log("Server listening at", 'http://' + addr.address + ":" + addr.port + '/data-gathering/home.html');
});

function uploadData(x, request, response) {
  var formidable = require('formidable');
  var util = require('util');

  var form = new formidable.IncomingForm();
  var dirData = !!process.platform.match(/^win/) ? '\\data\\' : '/data/';
  var dir = !!process.platform.match(/^win/) ? '\\data' + x + '\\' : '/data' + x + '/';

  form.uploadDir = __dirname + dirData + dir;
  form.keepExtensions = true;
  form.maxFieldsSize = 10 * 1024 * 1024;
  form.maxFields = 1000;
  form.multiples = false;

  form.parse(request, function (err, fields, files) {
    var file = util.inspect(files);

    response.writeHead(200);

    var fileName = file.split('path:')[1].split('\',')[0].split(dirData)[1].split(dir)[1].toString().replace(/\\/g, '').replace(/\//g, '');
    var fileURL = 'http://' + app.address + ':' + port + '/data/data' + x  + '/' + fileName;

    console.log('fileURL: ', fileURL);
    response.write(JSON.stringify({ fileURL: fileURL }));
    response.end();
  });
}