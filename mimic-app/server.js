const server = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');

// define the `address` and `port`.
const address = process.env.IP || 'localhost';
const port = 80;

/**
 * `serverHandler` handle all request to the server each response corresponding to each request.
 * There are 3 type main router `collect`, `identify`, `generate` to handle any request corresponding to them.
 * When the request match it return 200 alongside with the response corresponding to the router. 
 * When the request doesn't match any of those, it check if the file url as `filename` is existed in working 
 * directory or not. When the `filename` not found it return 404 Not Found. When found it read the `file` and return it with 200
 * so that it can be displayed by the browser. It return 500 if error occured when reading the `file`.
 */
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

let app;

// create the server and listen with `serverHandler`.
app = server.createServer(serverHandler);
app = app.listen(port, address, function () {
  // print information regarding to the app.
  console.log('Could take time to load tensorflow before the page could be open.');
  console.log('Collect: ', 'http://' + address + ':' + port + '/app/collect/home.html');
  console.log('Mimic: ', 'http://' + address + ':' + port + '/app/mimic/home.html');
  console.log('Readme: ', 'http://' + address + ':' + port + '/readme.md');
});
