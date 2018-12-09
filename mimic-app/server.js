const server = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');

async function serverHandler(request, response) {
  const uri = url.parse(request.url).pathname;
  const filename = path.join(process.cwd(), uri);

  const collect = await require('./router/collect')(address, port, filename, request);
  if (typeof collect !== 'undefined') {
    response.writeHead(200);
    response.write(collect);
    response.end();
    return;
  }

  const identify = await require('./router/identify')(address, port, filename, request);
  if (typeof identify !== 'undefined') {
    response.writeHead(200);
    response.write(identify);
    response.end();
    return;
  }

  const generate = await require('./router/generate')(address, port, filename, request);
  if (typeof generate !== 'undefined') {
    response.writeHead(200);
    response.write(generate);
    response.end();
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

const address = process.env.IP || 'localhost';
const port = 80;

let app;

app = server.createServer(serverHandler);
app = app.listen(port, address, function () {
  console.log("Collect : Server listening at", 'http://' + address + ":" + port + '/app/collect/home.html');
  console.log("Mimic : Server listening at", 'http://' + address + ":" + port + '/app/mimic/home.html');
});
